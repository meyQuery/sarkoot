$(document).ready(function () {
	$.ajaxSetup(
		{
			headers:
			{
				'X-CSRF-Token': $('meta[name="csrf-token"]').attr('content')
			}
		}
	);
	$(document).trigger('statio:global:renderResponse', [$(document)]);
});
$(document).on('statio:global:renderResponse', function (event, base, context) {
	base.each(function () {
		$('.input-avatar', this).change(function () {
			readURL(this);
		});
		$('.dropdown-menu.keep-open', this).on('click', function (event) {
			event.stopPropagation();
		});
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
			new Lijax(this);
		}).on('jresp', function (e, d) {
			$('.is-invalid', this).removeClass('is-invalid');
			$('.invalid-feedback', this).remove();
			if (d.errors) {
				for (var id in d.errors) {
					var elementBase = $('#' + id + ':not(.hide-input), [data-alias~=' + id + ']');
					elementBase.addClass('is-invalid');
					if (elementBase.is('.form-control-m'))
					{
						$('<div class="invalid-feedback">' + d.errors[id][0] + '</div>').insertAfter(elementBase.next('label'));
					}
					else
					{
						$('<div class="invalid-feedback">' + d.errors[id][0] + '</div>').insertAfter(elementBase);
					}
				}
			}
		});
		$(".select2-select", this).each(function () {
			var options = {
				width: '100%',
				amdLanguageBase: 'dist/vendors/select2-4.0.13/dist/js/i18n',
				language: 'fa',
				minimumInputLength: 0,
				allowClear: $(this).is('[data-allowClear]') || $(this).is('.has-clear'),
				dir: "rtl",
				tags: $(this).is('.tag-type'),
				templateResult: $(this).is('[data-type]') ? window['select2' + $(this).attr('data-type')] : undefined,
				dropdownParent: $('#' + $(this).attr('data-dropdownParent')).length ? $('#' + $(this).attr('data-dropdownParent')) : undefined
			};
			$(this).attr('data-mr-value', $('[name=' + $(this).attr('data-multi-round') + ']').val());
			$('[name=' + $(this).attr('data-multi-round') + ']').remove();
			if (options.allowClear) {
				options.placeholder = {};
				options.placeholder.text = $('option', this).first().text();
				options.placeholder.id = $('option', this).first().attr('value');
			}
			if ($(this).is('[data-url]')) {
				var title = $(this).attr('data-title') || 'title';
				var _self = this;
				options.ajax = {
					delay: 250,
					url: $(this).attr('data-url'),
					dataType: 'json',
					quietMillis: 250,
					data: function (params) {
						return {
							q: params.term || ''
						};
					},
					processResults: function (data) {
						data = data.data || data;
						var id_property = $(_self).attr('data-id') || 'id';
						var title_property = $(_self).attr('data-title') || 'title';
						var result = { results: [] };
						if ($(_self).is('[data-allowClear]')) {
							result.results.push({
								id: '',
								text: '-',
								all: null
							});
						}
						for (var i = 0; i < data.length; i++) {
							var sub_title_property = title_property;
							if (sub_title_property.indexOf(' ') >= 0) {
								var sub_title_properties = sub_title_property.split(' ');
								for (var is = 0; is < sub_title_properties.length; is++) {
									if (data[i][sub_title_properties[is]]) {
										sub_title_property = sub_title_properties[is];
										break;
									}

								}
							}
							result.results.push({
								id: data[i][id_property],
								text: data[i][sub_title_property],
								all: data[i]
							});
						}
						return result;
					},
					cache: false
				};
			}
			$(this).select2(options);
		});
	});
});

function select2users(data, option)
{
	if (data.all)
	{
		var span = $('<div class="d-flex align-items-center fs-12"><span class="media media-sm media-primary"><img alt="A"></span><div class="p-2"></div></div>');
		if (data.all.avatar.tiny || data.all.avatar.small)
		{
			var avatar = data.all.avatar.tiny || data.all.avatar.small;
			$('img', span).attr('src', avatar.url);
		}
		else
		{
			$('img', span).remove();
			$('.media', span).html('<span>' + (data.all.name ? data.all.name.substr(0, 1) : 'IR')   + '</span>');
		}
		$('div', span).html(data.all.name || data.all.id);
		return span;
	}
	return data.text;
}