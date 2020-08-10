$(document).ready(function () {
	if (window['i18n'] && window.lang && window.lang[$('html').attr('lang')])
	{
		i18n.translator.add(window.lang[$('html').attr('lang')]);
	}
	$.ajaxSetup(
		{
			headers:
			{
				'X-CSRF-Token': $('meta[name="csrf-token"]').attr('content')
			}
		}
	);
	$(document).trigger('statio:global:renderResponse', [$(document)]);
	var dataPage = $('body[data-page]').attr('data-page');
	$('body').trigger('statio:' + dataPage.replace(/[-]/g, ':'), [$('body')]);
});


$(document).on('statio:global:renderResponse', function (event, base, context) {
	base.each(function () {
		$('.input-avatar', this).hajmad();
		$('.dropdown-menu.keep-open', this).on('click', function (event) {
			event.stopPropagation();
		});
		$('[data-Lijax], .lijax', this).each(function () {
			new Lijax(this);
		});
		$("a", this).not('.direct, [data-direct], [target=_blank], .lijax, [data-lijax]').on('click', function () {
			if (/^\#(.*)$/.test($(this).attr('href'))){
				return true;
			}
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
					var elementBase = $('#' + id + ':not(.hide-input), [data-alias~=' + id + '], [name=' + id +']:not(.hide-input)', this);
					elementBase.addClass('is-invalid');
					elementBase.each(function(){
						if ($(this).is('.form-control-m'))
						{
							$('<div class="invalid-feedback">' + d.errors[id][0] + '</div>').insertAfter($(this).next('label'));
						}
						else
						{
							$('<div class="invalid-feedback">' + d.errors[id][0] + '</div>').insertAfter($(this));
						}
					});
				}
			}
		});
		$(".select2-select", this).each(function () {
			select2element.call(this);
		});
		$('.select2-select[data-relation]', this).on('select2:select', function (e) {
			var relation_ids = $(this).attr('data-relation');
			var f_id = $(this).val();
			relation_ids.split(' ').forEach(function (relation_id){
				var relation = $('#' + relation_id);
				var url = unescape(relation.attr('data-url-pattern')).replace('%%', f_id);
				relation.attr('data-url', url);
				relation.val(null).trigger("change");
				relation.select2('destroy');
				select2element.call(relation[0]);
			});
		});
		$('.date-picker', this).each(function(){
			var val = $(this).val();
			var _self = this;
			$(this).persianDatepicker({
				format: $(this).attr('data-picker-format') || "YYYY/M/D H:m",
				minDate: $(this).attr('data-picker-minDate') * 1000,
				maxDate: $(this).attr('data-picker-maxDate') * 1000,
				altFieldFormatter : function (unix) {
					$('#' + $(_self).attr('data-picker-alt')).trigger('change', [_self, unix]);
					return unix / 1000;
				},
				altFormat: "unix",
				altField: '#' + $(this).attr('data-picker-alt'),
				calendar: {
					persian: {
						locale: "fa",
						showHint: false,
						leapYearMode: "algorithmic"
					}
				},
				navigator: {
					enabled: true,
					scroll: {
						enabled: true
					}
				},
				toolbox: {
					calendarSwitch: {
						enabled: false
					},
					submitButton: {
						enabled: true
					}
				},
				timePicker: {
					enabled: true,
					second: {
						enabled: false
					}
				},
				responsive: true
			});
			if (val)
			{
				var date = new persianDate(val * 1000);
				$(this).val(date.format('YYYY/M/D H:m'));
			}
		});
	});
});

function select2element()
{
	var options = {
		width: '100%',
		amdLanguageBase: 'dist/vendors/select2-4.0.13/dist/js/i18n',
		language: 'fa',
		minimumInputLength: 0,
		allowClear: $(this).is('[data-allowClear]') || $(this).is('.has-clear'),
		dir: "rtl",
		tags: $(this).is('.tag-type'),
		templateResult: $(this).is('[data-template]') ? window['select2result_' + $(this).attr('data-template')].bind(this) : undefined,
		templateSelection: $(this).is('[data-template]') ? window['select2result_' + $(this).attr('data-template')].bind(this) : undefined,
		dropdownParent: $('#' + $(this).attr('data-dropdownParent')).length ? $('#' + $(this).attr('data-dropdownParent')) : undefined
	};
	options.placeholder = {};
	options.placeholder.text = $(this).attr('data-placeholder') || '...';
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
					result.results.push({
						id: select2find_data(data[i], id_property),
						text: select2find_data(data[i], title_property),
						all: data[i]
					});
				}
				return result;
			},
			cache: false
		};
	}
	$(this).select2(options);
}

function select2find_data(record, key)
{
	function find(key)
	{
		var nested = key.split('.');
		var find = record;
		for (k in nested)
		{
			if (find[nested[k]])
			{
				find = find[nested[k]];
			}
			else
			{
				return null;
			}
		}
		return find;
	}
	if (key.indexOf(' ') >= 0) {
		var keys = key.split(' ');
		for (var is = 0; is < keys.length; is++) {
			var find_data = find(keys[is]);
			if (find_data) {
				return find_data;
				break;
			}

		}
	}
	else {
		return find(key);
	}
	return null;
}

function select2result_users(data, option)
{
	if (!data.all && data.element) {
		data.all = JSON.parse($(data.element).attr('data-json'));
		$(data.element).attr('data-json', '');
	}
	if (data.all)
	{
		var span = $('<div class="d-flex align-items-center fs-12 d-inline-block"><span class="media media-sm media-primary"><img alt="A"></span><div class="pr-1"><div class="font-weight-bold data-name"></div><div class="fs-10 data-id"></div></div></div>');
		var avatar = select2find_data(data.all, $(this).attr('data-avatar') || 'avatar.tiny.url avatar.small.url');
		var text = $(this).attr('data-title') ? select2find_data(data.all, $(this).attr('data-title')) : data.text;
		if (avatar)
		{
			$('img', span).attr('src', avatar);
		}
		else
		{
			$('img', span).remove();
			$('.media', span).html('<span>' + (text ? text.substr(0, 1) : 'IR')   + '</span>');
		}
		$('div.data-name', span).html(text || 'بی‌نام');
		$('div.data-id', span).html(data.id);
		return span;
	}
	return data.text;
}

$(window).on('hashchange', function(){
	var selectedTab = location.hash;
	var tabNav = $('[data-toggle=tab][href$="' + selectedTab + '"]');
	if (tabNav.length)
	{
		tabNav.trigger('click');
	}
});