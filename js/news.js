(function() {
	var vkProfileLinkRegexp = /\[(.*)\|(.*)\]/;
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
			/* Original request to vk.com
			url: 'http://api.vk.com/method/wall.get',
			data: {
				owner_id: group_id,
				count: perPage,
				filter: 'owner',
				v: '5.45',
				offset: offset
			},*/
			url: 'https://launcher.vimeworld.ru/data/news.php',
			data: {
				count: perPage,
				offset: offset
			},
			callback: function(data) {
				var firstLoad = offset == 0;
				offset += perPage;

				var parsed = $.parseJSON(data);
				if (parsed.response == undefined) {
					$('#news').html(tpl('tpl_news_error'));
					return;
				}

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
								addPost(pinned, parsed.response);
								newsAdded++;
								pinned = null;
							}
							addPost(items[id], parsed.response);
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

	function addPost(post, response) {
		preparePostContent(post, response);

		var $post = $(tpl('tpl_news_post', post));
		$post.find('.gifplayer').gifplayer({
			label: '<img style="margin: 13px 0 0 4px" src="img/video_play_compact.png">'
		});
		twemoji.parse($post[0], {
			folder: 'svg',
			ext: '.svg'
		});
		$('#news').append($post);
	}

	function preparePostContent(post, response) {
		post_owner_profile = findProfile(post.owner_id, response);
		post.avatar = post_owner_profile.photo_50;

		post.text = anchorme.js(post.text, {
			emails: false,
			html: false
		});
		var lines = post.text.split('\n');
		var renderList = false;
		for (i in lines) {
			lines[i] = lines[i].replace(vkProfileLinkRegexp, function(str, id, name, offset, s) {
				return '<a href="https://vk.com/' + id + '">' + name + '</a>';
			});
			var c = lines[i].substr(0, 1);
			if (c == '-' || c == '—') {
				lines[i] = '<li>' + lines[i].substr(1) + '</li>';
				if (!renderList) {
					renderList = true;
					lines[i] = '<p><ul>' + lines[i];
				}
			} else {
				if (renderList) {
					renderList = false;
					lines[i] = '</ul></p><p>' + lines[i] + '</p>';
				} else {
					lines[i] = '<p>' + lines[i] + '</p>';
				}
			}
		}
		if (renderList) {
			lines[lines.length - 1] += '</ul></p>';
		}
		post.text = lines.join('');

		// Обработка репостов
		if (post.copy_history && post.copy_history.length == 1) {
			var reposted = post.copy_history[0];

			post.text += '<div class="repost">';

			// Поиск имени владельца поста
			var profile_list = response.profiles;
			var owner_id = reposted.owner_id;
			if (reposted.owner_id < 0) { // если был репост группы
				profile_list = response.groups;
				owner_id = -owner_id;
			}
			var profile = findProfile(reposted.owner_id, response);
			if (profile != null) {
				var avatar = '<img class="avatar" src="' + profile.photo_50 + '">';
				var time = '<span class="time-from-now" data-time="' + reposted.date + '">' + moment(reposted.date, "X").fromNow() + '</span>';
				post.text += '<h2 class="title"><a href="' + profile.url + '">' + avatar + ' ' + profile.name + '</a>' + time + '</h2>';
			}

			preparePostContent(reposted, response);
			post.text += reposted.text;

			post.text += '</div>';
		}

		if (post.attachments) {
			var getBestPhoto = function(photos) {
				var photo = null;
				for (i in photos) {
					var s = photos[i];
					if (photo == null || (s.width < 800 && s.width > photo.width))
						photo = s;
				}
				return photo;
			};
			post.attachments.forEach(function(attach) {
				if (attach.type == 'photo') {
					var photo = attach.photo;
					var url = photo.photo_807 || photo.photo_604 || photo.photo_130 || photo.photo_75;
					post.text += '<p class="img"><img src="' + url + '"></p>';
				} else if (attach.type == 'link' && attach.link.url.indexOf('vk.com/@') !== -1) {
					var article = attach.link;
					article.img = article.photo.photo_807 || article.photo.photo_604 || article.photo.photo_130 || article.photo.photo_75;
					article.url = article.url.replace('m.vk.com', 'vk.com').replace('@-29034706', '@vimeworld');
					post.text += tpl('tpl_news_post_article', article);
				} else if (attach.type == 'doc' && attach.doc.ext == 'gif') {
					var preview = attach.doc.preview;
					var photo = getBestPhoto(preview.photo.sizes);
					if (photo != null) {
						if (preview.video != undefined && preview.video.src.indexOf('mp4=1') !== -1) {
							post.text += '<p><img class="gifplayer" src="' + photo.src + '" data-mode="video" data-mp4="' + preview.video.src + '"></p>';
						} else {
							post.text += '<p><img class="gifplayer" src="' + photo.src + '" data-gif="' + attach.doc.url + '"></p>';
						}
					} else {
						post.text += '<p><img class="gifplayer" src="' + attach.doc.url + '"></p>';
					}
				} else if (attach.type == 'video') {
					var video = attach.video;
					video.img = video.photo_800 || video.photo_640 || video.photo_320 || video.photo_130;
					video.url = video.external_url || 'https://vk.com/wall' + group_id + '_' + post.id + '?z=video' + video.owner_id + '_' + video.id;
					video.duration = video.duration > 0 ? formatTime(parseTime(video.duration)) : '';
					post.text += tpl('tpl_news_post_video', video);
				}
			});
		}
	}

	function findProfile(id, response) {
		_common.print(id + " " + JSON.stringify(response))
		var profile_list = response.profiles;
		var group = id < 0;
		if (group) {
			profile_list = response.groups;
			id = -id;
		}
		var profile = null;
		for (var i = 0; i < profile_list.length; i++) {
			if (profile_list[i].id == id) {
				profile = profile_list[i];
				break;
			}
		}
		if (profile != null) {
			if (group) {
				if (profile.screen_name) {
					profile.url = profile.screen_name;
				} else if (profile.type == 'group') {
					profile.url = 'club' + id;
				} else if (profile.type == 'page') {
					profile.url = 'public' + id;
				}
			} else {
				profile.name = profile.first_name + ' ' + profile.last_name;
				profile.url = 'id' + profile.id;
			}
			profile.url = 'https://vk.com/' + profile.url;
		}
		return profile;
	}

	function parseTime(time) {
		this.seconds = time % 60;
		time = Math.floor(time / 60);
		this.minutes = time % 60;
		time = Math.floor(time / 60);
		this.hours = time % 60;
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
