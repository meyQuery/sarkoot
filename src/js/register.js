$(document).ready(function () {
	$(document).trigger('statio:global:renderResponse', [$(document)]);
});
$(document).on('statio:global:renderResponse', function () {
	$('[data-Lijax], .lijax', this).each(function () {
		new Lijax(this);
	});
	$("a", this).not('.direct, [data-direct], [target=_blank], .lijax, [data-lijax]').on('click', function () {
		new Statio({
			url: $(this).attr('href'),
			type: $(this).is('.action') ? 'render' : 'both',
			context: $(this),
		});
		return false;
	});

	$('form[action]', this).not('.direct, [data-direct], [target=_blank], .lijax').each(function () {
		console.log(this);
		new Lijax(this);
	}).on('jresp', function (e, d) {
		$('.is-invalid', this).removeClass('is-invalid');
		$('.invalid-feedback', this).remove();
		if (d.errors) {
			for (var id in d.errors) {
				$('#' + id + ', [data-alias~=' + id + ']').addClass('is-invalid');
				$('<div class="invalid-feedback">' + d.errors[id][0] + '</div>').insertAfter($('#' + id + ', [data-alias~=' + id + ']'));
			}
		}
	});
});