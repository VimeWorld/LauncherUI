$(document).ready(function(){
    $('#auth-form').submit(function(){
        var $username = $(this).find('input[name="username"]');
        var $password = $(this).find('input[name="password"]');
        var username = $username.val();
        var password = $password.val();

        if (username.length < 3 || username.length > 16){
            $username.tooltipster($.extend(tooltipster_error, {
                content: 'От 3 до 16 символов'
            })).tooltipster('show');
            return false;
        }

        if (password == null || password.length < 6){
            $password.tooltipster($.extend(tooltipster_error, {
                content: 'Не менее 6 символов'
            })).tooltipster('show');
            return false;
        }

        var btn = $(this).find('button');
        btn.attr('disabled', '').text('Авторизация...');
        _user.login({
            username: username,
            password: password,
            callback: function(data){
                btn.removeAttr('disabled').text('Войти');
                if (data.lastIndexOf('fail', 0) === 0){
                    var split = data.split(':', 2);
                    if (split.length == 1)
                        return;
                    ohSnap(split[1], "red");
                    return;
                }
                if (data == 'update'){
                    overlay.show(function(){}, false);
                    $('#update-popup').addClass('active');
                    return;
                }
                btn.addClass('btn-notransform');
                $password.val('');
                $('#username').text(username = _user.getUsername());
                $('body').attr('class', 'main');
                $('a[href="#play"]').trigger('click');
            }
        });
        return false;
    });

    $('#register-form').submit(function(){
        var $username = $(this).find('input[name="username"]');
        var $password = $(this).find('input[name="password"]');
        var $password2 = $(this).find('input[name="password2"]');
        var $email = $(this).find('input[name="email"]');
        var $checkbox = $(this).find('input[type="checkbox"]');
        var username = $username.val();
        var password = $password.val();
        var password2 = $password2.val();
        var email = $email.val();

        if (username == null || username.length < 3 || username.length > 16){
            $username.tooltipster('content', 'От 3 до 16 символов').tooltipster('show');
            return false;
        }
        if (/[^0-9a-zA-Z\_]/.test(username)){
            $username.tooltipster('content', 'Логин содержит недопустимые символы').tooltipster('show');
            return false;
        }
        if (password == null || password.length < 6 || password.length > 20){
            $password.tooltipster('content', 'От 6 до 20 символов').tooltipster('show');
            return false;
        }
        if (/[^0-9a-zA-Z\_]/.test(password)){
            $password.tooltipster('content', 'Пароль содержит недопустимые символы').tooltipster('show');
            return false;
        }
        if (password != password2){
            $password2.tooltipster('content', 'Пароли не совпадают').tooltipster('show');
            return false;
        }
        if (!/^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i.test(email)){
            $email.tooltipster('content', 'Введите корректный Email').tooltipster('show');
            return false;
        }
        if (!$checkbox.prop('checked')){
            $checkbox.next().tooltipster('content', 'Необходимо согласиться с правилами').tooltipster('show');
            return false;
        }

        var btn = $(this).find('button');
        btn.attr('disabled', '').text('Регистрация...');
        _user.register({
            username: username,
            password: password,
            email: email,
            callback: function(data){
                btn.removeAttr('disabled').text('Зарегистрироваться');
                if (data.lastIndexOf('fail', 0) === 0){
                    ohSnap(data.split(':', 2)[1], "red");
                    return;
                }
                if (data.lastIndexOf('success', 0) === 0)
                    ohSnap(data.split(':', 2)[1], "green");
                btn.addClass('btn-notransform');
                $password.val('');
                $password2.val('');
                $username.val('');
                $email.val('');
                $checkbox.removeAttr('checked');
                $('a[href="#auth"]').trigger('click');
            }
        });
        return false;
    });
    $('#register-form input, #register-form label').tooltipster(tooltipster_error);

    $('#logout').click(function(){
        _user.logout();
        $('body').attr('class', 'auth');
        $('a[href="#auth"]').trigger('click');
    });

    $('#tocp').click(function(){
        var base64 = btoa(_user.getUsername() + ":" + _user.getPassword().substr(0, 32));
        _common.openURL('http://cp.vimeworld.ru/login?auth='+base64);
    });
});

$(document).on('vimeworld:load', function(){
    $('#auth-form input[name="username"]').val(_user.getUsername());
        if (_user.canAutoAuth()){
            $('#auth-form input[name="password"]').val(_user.getPassword());
            setTimeout(function(){
                $('#auth-form').submit();
            }, 200);
        }
});
