$(document).ready(function () {
	$('#auth-form').submit(function () {
		var $username = $(this).find('input[name="username"]');
		var $password = $(this).find('input[name="password"]');
		var username = $username.val();
		var password = $password.val();

		if (username.length < 3 || username.length > 16) {
			$username.tooltipster($.extend(tooltipster_error, {
				content: 'От 3 до 16 символов'
			})).tooltipster('show');
			return false;
		}

		if (password == null || password.length < 6) {
			$password.tooltipster($.extend(tooltipster_error, {
				content: 'Не менее 6 символов'
			})).tooltipster('show');
			return false;
		}

		var totp = '';
		if (!$('#a_totp').hasClass('hidden')) {
			var $totp = $(this).find('input[name="totp"]');
			totp = $totp.val();
			if (totp == null || (totp.length != 6 && totp.length != 8) || !/^\d+$/.test(totp)) {
				$totp.tooltipster($.extend(tooltipster_error, {
					content: 'Вы должны ввести 6-ти или 8-ми значное число'
				})).tooltipster('show');
				return false;
			}
		}

		var btn = $(this).find('button');
		btn.attr('disabled', '').text('Авторизация...');
		_user.login({
			username: username,
			password: password,
			totp: totp,
			callback: function (data) {
				btn.removeAttr('disabled').text('Войти');
				if (data.lastIndexOf('fail', 0) === 0) {
					var split = data.split(':', 2);
					if (split.length == 1)
						return;
					ohSnap(split[1], "red");
					return;
				}
				if (data == 'update') {
					vw.showNeedUpdate();
					return;
				}
				if (data == '2fa') {
					$('#auth-form input[name="username"]').attr('disabled', 'disabled');
					$('#auth-form input[name="password"]').attr('disabled', 'disabled');
					$('#a_totp').slideDown(200).removeClass('hidden').find('input[name="totp"]').focus();
					$('#a_footer').addClass('hidden');
					$('#a_footer_totp').removeClass('hidden');
					return;
				}
				if (data == 'sucess-outdated-password') {
					overlay.closeNow();
					overlay.show(function () {
						$('#outdated-password-popup').removeClass('active');
					}, true);
					$('#outdated-password-popup').addClass('active');
				}
				btn.addClass('btn-notransform');
				setTimeout(function () {
					btn.removeClass('btn-notransform');
				}, 1000);
				$password.val('');
				$('#username').text(username = _user.getUsername());
				$('body').attr('class', 'main');
				$('a[href="#play"]').trigger('click');
			}
		});
		return false;
	});

	$('#logout').click(function () {
		if (vw.gameLoading) {
			ohSnap('Нельзя менять аккаунт во время запуска игры', "red");
			return;
		}
		_user.logout();
		$('body').attr('class', 'auth');
		$('a[href="#auth"]').trigger('click');
	});

	$('#tocp').click(function () {
		_common.openURL('https://cp.vimeworld.com');
	});
	$('#toprofile').click(function () {
		_common.openURL('https://vimeworld.com/player/' + _user.getUsername());
	});

	$('#a_totp_back').click(function () {
		$('#auth-form input[name="username"]').removeAttr('disabled');
		$('#auth-form input[name="password"]').removeAttr('disabled').val('');
		$('#a_totp').slideUp(200, function () {
			$(this).addClass('hidden');
		});
		$('#a_footer').removeClass('hidden');
		$('#a_footer_totp').addClass('hidden');
	});
});

$(document).on('vimeworld:load', function () {
	$('#auth-form input[name="username"]').val(_user.getUsername());
	if (_user.canAutoAuth()) {
		$('#auth-form input[name="password"]').val(_user.getPassword());
		setTimeout(function () {
			$('#auth-form').submit();
		}, 200);
	}
});
