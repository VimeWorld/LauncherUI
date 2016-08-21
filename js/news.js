(function() {
	var perPage = 10;
	var offset = 0;
	var loading = false;
	var group_id = -29034706;
	var newsAdded = 0;
	var lastWatched = -1;
	var newestPost = -1;
	var pinned = null;

	function load_news() {
		if (loading)
			return;

		loading = true;
		ajax({
			url: 'http://api.vk.com/method/wall.get',
			data: {
				owner_id: group_id,
				count: perPage,
				filter: 'owner',
				v: '5.45',
				offset: offset
			},
			callback: function(data) {
				var firstLoad = offset == 0;
				offset += perPage;

				var parsed = $.parseJSON(data);
				var items = parsed.response.items;

				if (items.length == 0)
					return;

				if (firstLoad)
					$('#news').html('');

				var unwatched = 0;
				var watched = false;
				for (id in items) {
					if (items[id].text.indexOf('#offtop') == -1) {
						if (items[id].is_pinned) {
							pinned = items[id];
						} else {
							if (newestPost == -1)
								newestPost = items[id].id;
							if (!watched) {
								if (items[id].id <= lastWatched) {
									watched = true;
								} else {
									unwatched++;
								}
							}
							if (pinned != null && items[id].id < pinned.id) {
								addPost(pinned);
								newsAdded++;
								pinned = null;
							}
							addPost(items[id]);
							newsAdded++;
						}
					}
				}

				_common.print('[news] ' + items.length + ' posts loaded');
				loading = false;

				if (offset == perPage) {
					if (unwatched > 0) {
						if (watched) {
							$('.m_n_unwatched').text(unwatched);
						} else {
							$('.m_n_unwatched').text((unwatched > 9 ? 9 : unwatched) + '+');
						}
					}
				}

				if (newsAdded <= 3)
					load_news();
			}
		});
	}

	function addPost(post) {
		post.text = anchorme.js(post.text, {
			emails: false,
			html: false
		});
		var lines = post.text.split('\n');
		var listStart = -1;
		for (i in lines) {
			var c = lines[i].substr(0, 1);
			if (c == '-' || c == '—') {
				lines[i] = '<li>' + lines[i].substr(1) + '</li>';
				if (listStart == -1) {
					listStart = i;
					lines[i] = '<p><ul>' + lines[i];
				}
			} else {
				if (listStart != -1) {
					listStart = -1;
					lines[i] = '</ul></p><p>' + lines[i] + '</p>';
				} else {
					lines[i] = '<p>' + lines[i] + '</p>';
				}
			}
		}
		if (listStart != -1) {
			lines[lines.length - 1] += '</ul></p>';
		}
		post.text = lines.join('');

		var hasVideo = false;
		if (post.attachments) {
			post.attachments.forEach(function(attach) {
				if (attach.type == 'photo') {
					var photo = attach.photo;
					var url = photo.photo_807 || photo.photo_604 || photo.photo_130 || photo.photo_75;
					post.text += '<p class="img"><img src="' + url + '"></p>';
				} else if (attach.type == 'doc' && attach.doc.ext == 'gif') {
					post.text += '<p class="gif"><img src="' + attach.doc.url + '"></p>';
				} else if (attach.type == 'video') {
					var video = attach.video;
					video.img = video.photo_640 || video.photo_320 || video.photo_130;
					video.url = 'https://vk.com/wall' + group_id + '_' + post.id + '?z=video' + video.owner_id + '_' + video.id;
					if (video.duration > 0)
						video.duration = formatTime(parseTime(video.duration));
					else
						video.duration = '';
					post.text += tpl('tpl_news_post_video', video);
					hasVideo = true;
				}
			});
		}
		var $post = $(tpl('tpl_news_post', post));
		$('#news').append($post);
	}

	function parseTime(time) {
		this.seconds = time % 60;
		time = Math.floor(time / 60);
		this.minutes = time % 60;
		time = Math.floor(time / 60);
		this.hours = time % 60;
		//_common.print(this.hours+':'+this.minutes+":"+this.seconds);
		return this;
	}

	function formatTime(time) {
		var toStr = function(num, length) {
			var str = num.toString();
			while (str.length < length)
				str = '0' + str;
			return str;
		};
		var out = '';
		if (time.hours > 0) {
			out += time.hours + ':' + toStr(time.minutes, 2);
		} else {
			out += time.minutes;
		}
		out += ':' + toStr(time.seconds, 2);
		return out;
	}

	$(document).ready(function(event) {
		$('#news').scroll(function() {
			var $this = $(this);
			if ($this[0].scrollHeight - $this.height() - $this.scrollTop() < 100) {
				load_news();
			}
		}).one('tab:open', function() {
			lastWatched = newestPost;
			_config.setLastWatchedPost(lastWatched);
			$('.m_n_unwatched').text('');
		});
	});

	$(document).on('vimeworld:load', function(event) {
		_common.print('Trying to load news...');
		lastWatched = _config.getLastWatchedPost();
		load_news();
	});
})();
