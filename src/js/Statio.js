(function(){
	var bodyStatio = null;
	var requesting = false;
	var historyBack = null;
	var _globals = {
		title : function (value){
			$('title').html(value);
		},
		state : function (value){
			new Statio({
				fake : true,
				url : value
			});
		},
		page : function(value){
			$('body').attr('data-page', value);
		},
		qSearch : function(value){
			var input = $('#quick_search');
			var page = input.attr('data-basePage');
			if (page != $('body').attr('data-page'))
			{
				input.attr('data-basePage', $('body').attr('data-page'));
				input.val('');
			}

			if (value) {
				input.parents('form').fadeIn('fast');
			}
			else
			{
				input.parents('form').fadeOut('fast');
			}
			var query = url.parse(location.href).get || {};
			query.q = query ? query.q : '';
			if (!input.is(':focus') && query.q != input.val()) {
				input.val(query.q);
			}
		}
	}

	var _ajax = {
		type : 'GET',
		cache : false
	}

	var _options = {
		object : null,
		title : null,
		ajax : _ajax,
	/**
	 * Send request and change url with response rendering
	 * @default both
	 * both: change url and render response
	 * url: Only send request and chage url without change rendering
	 * render: Only send request and render repsonse without change url
	 * @type {String}
	 */
	 type : 'both',
	/**
	 * dont send any request
	 * @type {Boolean}
	 */
	 fake : false,
	/**
	 * ajax response contetnt
	 * if {fake:true} or {response : notnull} response render this property
	 * @type {[type]}
	 */
	 response : null,
	/**
	 * replace state
	 * @type {Boolean}
	 */
	 replace : false,
	/**
	 * event context
	 * @type {DOM} {jQuery} {Selector string}
	 */
	 context : document
	}

	function statio(custom){
		if(typeof custom != 'object')
		{
			custom = {};
		}

		custom.ajax = $.extend({}, _ajax, custom.ajax);
		custom.ajax.url = custom.url;
		if (/^\#(.*)$/.test(custom.ajax.url)) return true;
		custom.globals = $.extend({}, _globals, custom.globals);
		var options = $.extend({}, _options, custom);

		var response = {
			body : options.response,
			data : {},
		};

		if(!(options.context instanceof jQuery))
		{
			options.context = $(options.context);
		}

		$(document).trigger('statio:global:init', [options.context]);
		options.context.trigger('statio:init');


		var ajax_data = null;
		var ajax_send_url = null;
		if (options.type != 'render')
		{
			historyBack = options.ajax.url;
		}
		if(!options.fake)
		{
			if(!options.ajax.complete)
			{
				options.ajax.complete = ajx_complete;
			}else{
				var complete = options.ajax.complete;
				options.ajax.complete = function(){
					ajx_complete.call(this, ...arguments);
					complete.call(this, ...arguments);
				}
			}
			var beforeSend = options.ajax.beforeSend;

			options.ajax.beforeSend = function(jqXHR, settings)
			{
				if(options.type != 'render' || options.ajax.type != 'GET'){
					NProgress.configure({ showSpinner: false });
					NProgress.start();
				}
				ajax_data = this;
				ajax_send_url = this.url;
				var urlx = url.parse(ajax_send_url);
				if(urlx.get && urlx.get._)
				{
					delete urlx.get._;
				}
				var get = url.buildget(urlx.get);
				ajax_send_url = urlx.url.replace(/\?([^#]*)(\#.*)?$/, get ? '?' + get + '$2' : '$2');
				beforeSend ? beforeSend.call(this, jqXHR, settings) : null;
			}
			if(options.fake == false && options.type != 'render'){
			try{
					requesting.abort();
				}catch(e){}
			}
			var requestDo = this.ajax = $.ajax(options.ajax);
			if(options.fake == false && options.type != 'render'){
				requesting = requestDo;
			}
		}
		else if(options.type != 'url' && response.body)
		{
			response_parse();
			render();
			$(document).trigger('statio:global:done', [options.context]);
			options.context.trigger('statio:done');
		}
		else
		{
			try {
				options.replace
					? history.replaceState(JSON.parse(JSON.stringify(options)), options.title, ajax_send_url || options.url)
					: history.pushState(JSON.parse(JSON.stringify(options)), options.title, ajax_send_url || options.url);
			}
			catch (e) {
				console.error(e);
			}
			$(document).trigger('statio:global:done', [options.context]);
			options.context.trigger('statio:done');
		}

		function ajx_complete(jqXHR, textStatus)
		{
			NProgress.done();
			if(jqXHR.responseJSON)
			{
				response.data = jqXHR.responseJSON;
				$(document).trigger('statio:global:jsonResponse', [options.context, jqXHR.responseJSON, jqXHR]);
				options.context.trigger('statio:jsonResponse', [jqXHR.responseJSON, jqXHR]);
				new JResp(options.context, response.data);
			}
			else
			{
				response.body = jqXHR.responseText;
				response_parse();
				if(textStatus == 'success')
				{
					if (options.type != 'render') {
						try {
							options.response = response;
							options.replace
								? history.replaceState(JSON.parse(JSON.stringify(options)), options.title, ajax_send_url || options.url)
								: history.pushState(JSON.parse(JSON.stringify(options)), options.title, ajax_send_url || options.url);
						}
						catch (e) {
							try{
								options.replace
									? history.replaceState(options.data, options.title, ajax_send_url || options.url)
									: history.pushState(options.data, options.title, ajax_send_url || options.url);

							}
							catch (e){
								console.error(e);
							}
						}
					}
					$(document).trigger('statio:global:success', [options.context, response.data, response.body, jqXHR]);
					options.context.trigger('statio:success', [response.data, response.body, jqXHR]);
					if(options.type != 'url')
					{
						render();
					}
				}
				else
				{
					$(document).trigger('statio:global:errorResponse', [options.context, response.data, response.body, jqXHR]);
					options.context.trigger('statio:errorResponse', [response.data, response.body, jqXHR]);
				}
			}
			$(document).trigger('statio:global:done', [options.context, response.data, response.body, jqXHR]);
			options.context.trigger('statio:done', [response.data, response.body, jqXHR]);
		}

		function response_parse(){
			if(typeof response.body == 'string')
			{
				try
				{
					var split     = response.body.split("\n");
					response.data = JSON.parse(split[0]);
					response.body = split.length > 1 ? $($.parseHTML(split.splice(1).join(""))) : null;
				}catch(e){
					response.body  = $($.parseHTML(response.body));
				}
			}
			else if(typeof response.body == 'object' && response.body != null)
			{
				if(response.body instanceof HTMLElement)
				{
					response.body  = $(response.body);
				}
				else if(response.body instanceof jQuery)
				{

				}
				else
				{
					response.data = response.body;
					response.body = null;
				}
			}
		}

		function render(){
			for(D in response.data)
			{
				if(options.globals[D])
				{
					options.globals[D](response.data[D], response.data, response.body);
				}
			}
			if(response.body)
			{
				var changed = [];
				response.body.each(function(){
					var base = $(this).attr('data-xhr');
					if(base)
					{
						changed.push(this);
						$("[data-xhr='"+base+"']").replaceWith(this);
						var fold = $(this).attr('data-xhr-fold');
						if (!fold)
						{
							$("[data-xhr='" + base + "']").addClass('statio-fold');
						}
						else if (fold.substr(0, 1) == '.')
						{
							$("[data-xhr='" + base + "']").addClass(fold.substr(1));
						}
					}
				});
				$(document).trigger('statio:global:renderResponse', [$(changed), options.context, response.data, response.body]);
				options.context.trigger('statio:renderResponse', [$(changed), response.data, response.body]);
				if (response && response.data && response.data.page)
				{
					if(bodyStatio){
						$('body').trigger('statio:' + bodyStatio + ':onunload', [$(changed), response.data, response.body]);
					}
					bodyStatio = response.data.page.replace(/[-]/g, ':');
					$('body').trigger('statio:' + bodyStatio, [$(changed), response.data, response.body]);
				}
			}
		}
		return this;
	}
	window.Statio = statio;
	/**
	 * for new chrome bug
	 */
	 new Statio({
	 	url : location.href,
	 	fake : true,
	 	replace : true
	 });

	/**
	 * popstate event
	 */
	 window.onpopstate = function(event){
		 var backHistoryParse = historyBack ? historyBack.match(/^([^#]*)(\#(.*))?$/) : null;
		 var HistoryParse = location.href ? location.href.match(/^([^#]*)(\#(.*))?$/) : null;
		 if (backHistoryParse[1] == HistoryParse[1] && backHistoryParse[3] != HistoryParse[3])
		 {
			 historyBack = location.href;
			 return false;
		 }

		 new Statio({
	 		url : location.href,
	 		replace : true
	 	});
	 };
})();