$(document).ready(function(event) {
	$('#s_savepass').change(function() {
		_config.setSavePass($(this).is(":checked"));
	});
	$('#s_fullscreen').change(function() {
		_config.setFullscreen($(this).is(":checked"));
	});
	$('#s_useshaders').change(function() {
		_config.setUseShaders($(this).is(":checked"));
	});
	$('#s_smoothscroll').change(function() {
		_config.setSmoothScroll($(this).is(":checked"));
	});
	$('#s_memory').blur(function() {
		var val = _config.validateMemory($(this).val());
		$(this).val(val);
		_config.setMemory(parseInt(val));
	});
	$('#s_width').blur(function() {
		var val = _config.validateWidth($(this).val());
		$(this).val(val);
		_config.setWidth(parseInt(val));
	});
	$('#s_height').blur(function() {
		var val = _config.validateHeight($(this).val());
		$(this).val(val);
		_config.setHeight(parseInt(val));
	});
	$('#s_theme').change(function() {
		var theme = $(this).find("option:selected").attr('value');
		_config.setTheme(theme);
		$('#h_theme').attr('href', 'css/vimeworld-' + theme + '.css');
	});
});

$(document).on('vimeworld:load', function(event) {
	if (_config.isSavePass())
		$('#s_savepass').attr('checked', '');
	if (_config.isFullscreen())
		$('#s_fullscreen').attr('checked', '');
	if (_config.isUseShaders())
		$('#s_useshaders').attr('checked', '');
	if (_config.isSmoothScroll())
		$('#s_smoothscroll').attr('checked', '');
	$('#s_memory').val(_config.getMemory());
	$('#s_width').val(_config.getWidth());
	$('#s_height').val(_config.getHeight());
	$('#s_osuuid').val(_config.getOsuuid())
		.click(function() {
			$(this).select();
		});

	//Загрузка темы
	var theme = _config.getTheme();
	var themes = [];
	$('#s_theme option').each(function(item) {
		themes.push($(this).attr('value'));
	});
	if ($.inArray(theme, themes) == -1) {
		theme = 'blue';
		_config.setTheme(theme);
	}
	$('#s_theme option[value="' + theme + '"]').attr('selected', '1');
	$('#h_theme').attr('href', 'css/vimeworld-' + theme + '.css');

	//Плавная прокрутка
	if (_config.isSmoothScroll())
		$('body').append('<script src="js/libs/smooth-scroll.min.js"></script>');

	//Открытие папки лаунчера
	$('#s_open_launcher_dir').click(function(event) {
		event.preventDefault();
		_game.openLauncherDir();
	});

	_common.print('Settings loaded');
});
