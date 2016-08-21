/**
 * == OhSnap!.js ==
 * A simple jQuery/Zepto notification library designed to be used in mobile apps
 *
 * author: Justin Domingue
 * date: september 5, 2013
 * version: 0.1.3
 * copyright - nice copyright over here
 */

/* Shows a toast on the page
 * Params:
 *  text: text to show
 *  color: color of the toast. one of red, green, blue, orange, yellow or custom
 */
function ohSnap(text, color, icon) {
	var icon_markup = "",
		html,
		time = '3000',
		$container = $('#ohsnap');

	if (icon) {
		icon_markup = "<span class='" + icon + "'></span> ";
	}

	// Generate the HTML
	html = $('<div class="alert alert-' + color + ' animated fadeInRight">' + icon_markup + text + '</div>').fadeIn('fast');

	// Append the label to the container
	$container.append(html);

	// Remove the notification on click
	html.on('click', function() {
		$(this).addClass('fadeOutRight').one('webkitAnimationEnd animationend', function() {
			$(this).remove();
		});
	});

	// After 'time' seconds, the animation fades out
	setTimeout(function() {
		html.addClass('fadeOutRight').one('webkitAnimationEnd animationend', function() {
			$(this).remove();
		});
	}, time);
}
