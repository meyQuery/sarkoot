(function(){
	var _globals = {
		title : function (value){
			$('title').html(value);
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
		if(!options.fake)
		{
			if(!options.ajax.complete)
			{
				options.ajax.complete = ajx_complete;
			}
			var beforeSend = options.ajax.beforeSend;
			options.ajax.beforeSend = function(jqXHR, settings)
			{
				ajax_data = this;
				ajax_send_url = this.url;
				var urlx = url.parse(ajax_send_url);
				if(urlx.get && urlx.get._)
				{
					delete urlx.get._;
				}
            	var get = url.buildget(urlx.get);
            	ajax_send_url = urlx.url.replace(/\?(.*)$/, get ? '?' + get : '');
				beforeSend ? beforeSend.call(this, jqXHR, settings) : null;
			}
			$.ajax(options.ajax);
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
			$(document).trigger('statio:global:done', [options.context]);
			options.context.trigger('statio:done');
		}

		function ajx_complete(jqXHR, textStatus)
		{
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
							options.replace
								? history.replaceState(options.data, options.title, ajax_send_url || options.url)
								: history.pushState(options.data, options.title, ajax_send_url || options.url);
						}
						catch (e) {
							console.error(e);
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
					options.globals[D](response.data[D]);
				}
			}
			if(response.body)
			{
				var changed = [];
				response.body.each(function(){
					var base = $(this).attr('data-xhr');
					if(base)
					{
						changed.push($("[data-xhr='"+base+"']"));
						$("[data-xhr='"+base+"']").html($(this).html());
					}
				});
				$(document).trigger('statio:global:renderResponse', [$(changed), options.context, response.data, response.body]);
				options.context.trigger('statio:renderResponse', [$(changed), response.data, response.body]);
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
	 	new Statio({
	 		url : location.href,
	 		replace : true
	 	});
	 };
})();