(function () {
	function getFailMessageAndSnap(result) {
		if (result.lastIndexOf('fail', 0) === 0) {
			var split = result.split(':', 2);
			if (split.length == 1)
				return false;
			ohSnap(split[1], "red");
			return split[1];
		}
		return false;
	}

	function startAuth() {
		$('#auth-form input[name="username"]').removeAttr('disabled');
		$('#auth-form input[name="password"]').removeAttr('disabled').val('');
		$('#auth-form').addClass('hidden');
		$('#auth-step2').removeClass('hidden');
		_user.auth({ callback: callbackAuth });
	}

	function callbackAuth(result) {
		var failMessage = getFailMessageAndSnap(result);
		if (failMessage) {
			$('#auth-step2-error').removeClass('hidden');
			$('#auth-step2-loading').addClass('hidden');
			$('#auth-step2-error-text').text(failMessage);
			return;
		}

		if (result == 'account_deleted') {
			ohSnap('Аккаунт в процессе удаления', "red");
			return;
		}

		if (result == 'invalid_token') {
			$('#a_totp').addClass('hidden');
			$('#a_footer').removeClass('hidden');
			$('#a_footer_totp').addClass('hidden');

			$('#auth-step2').addClass('hidden');
			$('#auth-step2-error').addClass('hidden');
			$('#auth-step2-loading').removeClass('hidden');

			$('#auth-form').removeClass('hidden');
			return;
		}

		if (result == '2fa') {
			$('#auth-step2').addClass('hidden');
			$('#auth-step2-error').addClass('hidden');
			$('#auth-step2-loading').removeClass('hidden');

			$('#auth-form').removeClass('hidden');

			$('#auth-form input[name="username"]').attr('disabled', 'disabled');
			$('#auth-form input[name="password"]').attr('disabled', 'disabled');

			$('#a_totp').slideDown(200).removeClass('hidden').find('input[name="totp"]').focus();
			$('#a_footer').addClass('hidden');
			$('#a_footer_totp').removeClass('hidden');
			return;
		}

		if (result == 'success') {
			var $btn = $('#auth-form button');
			$btn.addClass('btn-notransform');
			setTimeout(function () {
				$btn.removeClass('btn-notransform');
			}, 1000);

			$('#username').text(username = _user.getUsername());
			$('body').attr('class', 'main');
			$('a[href="#play"]').trigger('click');

			// Возвращение окна авторизации в нормальный вид
			$('#a_totp').addClass('hidden');
			$('#a_footer').removeClass('hidden');
			$('#a_footer_totp').addClass('hidden');

			$('#auth-step2').addClass('hidden');
			$('#auth-step2-error').addClass('hidden');
			$('#auth-step2-loading').removeClass('hidden');

			$('#auth-form').removeClass('hidden');
			return;
		}
	}

	function doLoginTotp() {
		var $totp = $('#auth-form input[name="totp"]');
		totp = $totp.val();
		if (totp == null || (totp.length != 6 && totp.length != 8) || !/^\d+$/.test(totp)) {
			$totp.tooltipster($.extend(tooltipster_error, {
				content: 'Вы должны ввести 6-ти или 8-ми значное число'
			})).tooltipster('show');
			return;
		}

		var $btn = $('#auth-form button');
		$btn.attr('disabled', '').text('Авторизация...');

		_user.login2fa({
			code: totp,
			callback: function (data) {
				$btn.removeAttr('disabled').text('Войти');
				if (getFailMessageAndSnap(data))
					return;
				startAuth();
			},
		})
	}

	$(document).ready(function () {
		$('#auth-form').submit(function () {
			if (!$('#a_totp').hasClass('hidden')) {
				doLoginTotp();
				return false;
			}

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

			var $btn = $(this).find('button');
			$btn.attr('disabled', '').text('Авторизация...');
			_user.login({
				username: username,
				password: password,
				callback: function (data) {
					$btn.removeAttr('disabled').text('Войти');
					if (getFailMessageAndSnap(data))
						return;

					if (data == '2fa') {
						$('#auth-form input[name="username"]').attr('disabled', 'disabled');
						$('#auth-form input[name="password"]').attr('disabled', 'disabled');
						$('#a_totp').slideDown(200).removeClass('hidden').find('input[name="totp"]').focus();
						$('#a_footer').addClass('hidden');
						$('#a_footer_totp').removeClass('hidden');
						return;
					}

					startAuth();
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

			_user.logout();
		});

		$('#a_btn_retry_auth').click(function () {
			$('#auth-step2-error').addClass('hidden');
			$('#auth-step2-loading').removeClass('hidden');

			_user.auth({ callback: callbackAuth });
		});

		$('#a_auth_back').click(function () {
			$('#a_totp').addClass('hidden');
			$('#a_footer').removeClass('hidden');
			$('#a_footer_totp').addClass('hidden');

			$('#auth-step2').addClass('hidden');
			$('#auth-step2-error').addClass('hidden');
			$('#auth-step2-loading').removeClass('hidden');

			$('#auth-form').removeClass('hidden');

			_user.logout();
		});
	});

	$(document).on('vimeworld:load', function () {
		$('#auth-form input[name="username"]').val(_user.getUsername());
		if (_user.canAutoAuth()) {
			startAuth();
		}
	});
})();
