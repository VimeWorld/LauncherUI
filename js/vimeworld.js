/*! Copyright (c) 2015-2022, xtrafrancyz (https://xtrafrancyz.net)
 * VimeWorld.com Launcher script
 */

vw = {
	showInvalidLaunch: function () {
		overlay.show(function () {
			$('#invalid-launch-popup').removeClass('active');
		}, true);
		$('#invalid-launch-popup').addClass('active');
	},
	showNeedUpdate: function () {
		overlay.show(function () { }, false);
		$('#update-popup').addClass('active');
	},
	gameLoading: false
};

var tooltipster_error = {
	timer: 1500,
	position: 'top-right',
	trigger: 'custom',
	theme: 'tooltipster-red',
	restoration: 'none',
	contentCloning: false,
	offsetY: -4
};
var tooltipster_hover = {
	timer: 1500,
	position: 'top-right',
	trigger: 'hover',
	theme: 'tooltipster-default',
	restoration: 'none',
	contentCloning: false,
	offsetY: -4
};

//Перехватывает ошибки и выводит их в консоль
window.onerror = function () {
	if (window._common != undefined)
		_common.onerror(arguments);
};

/**
 * Выполняет AJAX запрос через лаунчер
 * @param url: адрес
 * @param type: post, get
 * @param data: assoc array
 * @param callback: function
 */
function ajax(options) {
	if (options.type == undefined)
		options.type = 'get';
	if (options.data == undefined)
		options.data = '';
	else {
		var data = options.data;
		options.data = '';
		var i = 0;
		for (key in data) {
			if (i++ != 0)
				options.data += '&';
			options.data += key + '=' + escape(data[key]);
		}
	}
	_common.ajax(options);
}

var overlay = {
	show: function (callback, hideOnClick) {
		this.hideOnClick = hideOnClick;
		this.callback = callback;
		$('#overlay').addClass('active').animate({
			'opacity': 1
		});
	},
	hide: function () {
		this._close();
		if (this.callback != undefined) {
			this.callback();
			this.callback = undefined;
		}
	},
	click: function () {
		if (this.callback == undefined || !this.hideOnClick)
			return;
		this.hide();
	},
	closeNow: function () {
		if (this.callback != undefined) {
			this.callback();
			this.callback = undefined;
		}
		$('#overlay').css({
			'opacity': 0
		}).removeClass('active');
	},
	closeNoCallback: function () {
		this._close();
		this.callback = undefined;
	},
	_close: function () {
		if (this.callback == undefined)
			return;
		$('#overlay').animate({
			'opacity': 0
		}, {
			complete: function () {
				$('#overlay').removeClass('active');
			}
		});
	}
};

//Вызывается после полной загрузки всех "мостов"
$(document).on('vimeworld:load', function () {
	_common.print("Init...");
});

$(document).ready(function () {
	// Запрет перетягивания картинок
	$('img').on('dragstart', function (event) {
		event.preventDefault();
	});

	// Запрет нажатия кнопки Tab
	$(document).keydown(function (e) {
		if (e.keyCode == 9) // tab pressed
			e.preventDefault();
	});

	// Убирание фокуса с инпута при нажатии на ентер
	$('input[data-enter-blur]').keydown(function (e) {
		if (e.keyCode == 13) // enter pressed
			$(e.target).blur();
	});

	// Запрет выделения
	var focused;
	$('*').mousedown(function (e) {
		if (e.bypass != undefined)
			return true;

		$elem = $(e.target);
		if ($elem[0].nodeName == 'LABEL' && $elem[0].hasAttribute('for'))
			$elem = $('#' + $elem.attr('for'));
		var isInput = ($elem[0].nodeName == 'INPUT' || $elem[0].nodeName == 'SELECT') && (focused = $elem);
		if (isInput || $elem.attr('selectable') != undefined) {
			e.bypass = true;
			return true;
		}

		window.getSelection().removeAllRanges();
		if (focused != undefined) {
			focused.blur();
			focused = undefined;
		}

		return false;
	});

	// Включение тултипов
	$.fn.tooltipster('setDefaults', {
		animation: 'grow',
		contentAsHTML: true
	});
	$('.tooltip').tooltipster();

	$('#overlay').click(function (e) {
		if (e.target != this) return;
		overlay.click();
	});

	// Верхнее меню
	(function () {
		var handler = function () {
			$(this).attr('class', 'tab hidden');
		};
		$('.header .menu a').click(function () {
			var $this = $(this);
			if ($this.hasClass('active') || $this.attr('href').lastIndexOf('#', 0) !== 0)
				return;

			$('.header .menu a').removeClass('active');
			$this.addClass('active');

			$('#content .tab:not(.hidden)')
				.attr('class', 'tab animated fadeOutDown')
				.one('webkitAnimationEnd animationend', handler);

			$('#' + $this.attr('href').substr(1))
				.trigger('tab:open')
				.off('webkitAnimationEnd animationend', handler)
				.attr('class', 'tab animated fadeInDown');
		});
	})()

	// Выпадающие менюшки
	$('.dropdown > div').click(function () {
		var btn = $(this).parent();
		if (btn.hasClass('active')) {
			btn.find('ul')
				.removeClass('zoomIn')
				.addClass('zoomOutRight')
				.one('webkitAnimationEnd animationend', function () {
					btn.removeClass('active')
				});
		} else {
			btn.addClass('active')
				.find('ul')
				.removeClass('zoomOutRight')
				.addClass('animated')
				.addClass('zoomIn');
		}
	});
	$(document).mouseup(function (e) {
		var container = $('.dropdown');
		if (!container.is(e.target) && (container.has(e.target).length === 0 || !e.target.hasAttribute("do-not-close")))
			container.filter('.active').find('>div').trigger('click');
	});

	// Кнопки закрыть и свернуть
	$('#gui_close').click(function (event) {
		_gui.exit();
	});
	$('#gui_min').click(function (event) {
		_common.minimize();
	});

	// Перетаскивание окна
	$('.header').mousedown(function (e) {
		e.stopImmediatePropagation();
		_common.startDrag();
		return false;
	});

	// Изменение размера окна
	$('#drag-resize').mousedown(function (e) {
		e.stopImmediatePropagation();
		_common.startResize();
		return false;
	});

	// Обработка нажатий на ссылки
	$('body').on('click', 'a', function (e) {
		e.preventDefault();
		var href = $(this).attr('href');
		if (href == undefined)
			return;
		// Открытие внешних ссылок в браузере
		if (href.lastIndexOf('http:', 0) == 0 || href.lastIndexOf('https:', 0) == 0 || href.lastIndexOf('//', 0) == 0) {
			_common.openURL(href);
			return;
		}
		if (href.substr(0, 1) == '@') {
			if (href.indexOf(':') > 0) {
				var split = href.split(':');
				var action = split[0];
				var value = split[1];
				switch (action) {
					case '@click':
						$(value).trigger('click');
						break;
					case "@tab":
						$('.header .menu a[href="#' + value + '"]').trigger('click');
						break;
				}
			}
		}
	});

	setInterval(function () {
		$('.time-from-now').each(function () {
			$(this).text(moment($(this).attr('data-time'), "X").fromNow());
		});
	}, 30000);

	//$('a[href="#news"]').trigger('click');
});
