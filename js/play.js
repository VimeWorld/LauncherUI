(function() {
	var servers = {};
	var nameToId = {};
	var mg = {};
	var updateInfoTimer;
	var serversLoadedOnUsername = '';
	var onlineUpdatersScheduled = false;

	var getOnlineString = function(server) {
		if (server.online == undefined)
			return '';
		var text = '<span class="muted">' + server.online;
		if (server.max == 0) {
			text = '<span class="red">Оффлайн</span>';
		} else {
			if (server.max > 0)
				text += '/' + server.max;
			text += '</span>';
		}
		return text;
	}

	var loadOnline = function() {
		ajax({
			url: 'https://mc.vimeworld.ru/mon/min.txt',
			callback: function(data) {
				data = data.split(';');
				var total = 0;
				data.forEach(function(item) {
					var split = item.split(':');
					server = servers[nameToId[split[0]]];
					if (server != undefined) {
						split = split[1].split('/');
						server.online = parseInt(split[0]);
						server.max = parseInt(split[1]);
						if (server.max != 0)
							total += server.online;
						$('#srv_' + server.id + " .status").html(getOnlineString(server));
					}
				});
				$('#total-online').html('Общий онлайн: <span class="green">' + total + '</span>');
				if (_game.getSelected() != -1)
					$('#server-online').html(getOnlineString(servers[_game.getSelected()]));
			}
		});
		setTimeout(loadOnline, 60000);
	}

	var loadMiniGamesOnline = function() {
		ajax({
			url: 'https://mc.vimeworld.ru/mon/mg.json',
			callback: function(data) {
				if (typeof data === 'string')
					data = JSON.parse(data);
				mg = data;
				setMiniGamesOnlineValues();
			}
		});
		setTimeout(loadMiniGamesOnline, 60000);
	}

	var setMiniGamesOnlineValues = function() {
		$('#server-description .minigames-list').find('.online').each(function() {
			var game = $(this).attr('data-mg');
			if (game) {
				var online = 0;
				game.split(',').forEach(function(item) {
					if (item in mg)
						online += mg[item];
				});
				$(this).text(online);
			}
		});
	}

	var updateInfo = function() {
		$('#loading-bar').attr('value', _game.progress * 10);
		$('#loading-bar-text').text(_game.status);
		if (!_game.running) {
			clearInterval(updateInfoTimer);
			updateInfoTimer = undefined;
			vw.gameLoading = false;
			$('#loading-bar-container').removeClass('active');
			$('#play-btn').removeAttr('disabled');
			$('#loading-bar').attr('value', '0');
			$('#loading-bar-text').text('');
		}
	}

	$(document).ready(function() {
		$('#play-btn').click(function() {
			$(this).attr('disabled', '');
			_game.startUpdate();
			$('#loading-object').text('Запуск ' + servers[_game.getSelected()].name);
			$('#loading-bar-container').addClass('active');
			updateInfoTimer = setInterval(updateInfo, 100);
			vw.gameLoading = true;
		});

		$('#p_screenshots').click(function() {
			_game.openScreenshotsDir();
		});
		$('#p_openclient').click(function() {
			_game.openClientDir();
		});
		$('#p_deleteclient').click(function() {
			_game.deleteClient();
		});

		$('#play').on('tab:open', function() {
			if (_config.getUsername() == serversLoadedOnUsername)
				return;
			serversLoadedOnUsername = _config.getUsername();
			_gui.loadServers({
				callback: function(data) {
					data = $.parseJSON(data);
					_common.print("Loaded " + data.length + " servers");
					var out = '';
					var id = 0;
					servers = {};
					nameToId = {};
					data.forEach(function(server) {
						servers[id] = server;
						nameToId[server.name] = id;
						server.id = id++;
						out += tpl('tpl_server_list_item', server);
					});

					$('#servers ul')
						.html(out)
						.find('li').click(function(e) {
							var id = parseInt($(this).attr('data-id'));
							var server = servers[id];
							_game.setSelected(id);
							$(this).addClass('active').siblings().removeClass('active');
							$('#server-name').text(server.name);
							$('#server-description')
								.html(twemoji.parse(server.desc, {
									folder: 'svg',
									ext: '.svg'
								}))
								.scrollTop(0);
							$('#server-online').html(getOnlineString(server));
							$('#server-description').find('.tooltip').tooltipster({
								'delay': 0,
								'speed': 100
							});
							setMiniGamesOnlineValues();
						});

					var lastServer = _config.getLastServer();
					if (lastServer == null || nameToId[lastServer] == undefined)
						id = 0;
					else
						id = nameToId[lastServer];
					$('#srv_' + id).trigger('click');
					$('#play-btn').removeAttr('disabled');

					if (!onlineUpdatersScheduled) {
						onlineUpdatersScheduled = true;
						loadOnline();
						loadMiniGamesOnline();
					}
				}
			});
		});
	});

	$(document).on('vimeworld:load', function() {

	});
})();
