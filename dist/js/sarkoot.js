(function(){
	function jresp(context, res)
	{
		context.trigger('jresp', [res]);
		if (res.message && !context.is('.d-notification'))
		{
			if (window.toastr)
			{
				var toast = toastr[res.is_ok ? 'success' : 'error'](res.message_text || res.message, undefined, {
					"closeButton": true,
					"newestOnTop": true,
					"positionClass": "toast-bottom-right",
				});
			}
			else if (window.iziToast)
			{
				var message = res.message_text || res.message;
				if (res.errors)
				{
					var count = 0;
					for (err in res.errors) ++count;
					if (count === 1 && res.errors[err].length == 1)
					{
						message = res.errors[err][0];
					}
				}
				iziToast[res.is_ok ? 'show' : 'error']({
					message: message,
					rtl: $('body').is('.rtl'),
					closeOnClick : true,
				});
			}
		}
		if(res.redirect)
		{
			if(res.direct)
			{
				location.href = res.redirect;
			}
			else
			{
				new Statio({
					url : res.redirect,
					replace : res.replace,
					type : ['render', 'url'].indexOf(res.lijax_type) >= 0 ? res.lijax_type : 'both'
				});
			}
		}
	}
	window.JResp = jresp;
})();
(function(){
	function lijax(context, onFire)
	{
        var back_value = $(context).val() || $(context).attr('data-value');
        if($(context).is(':checkbox'))
        {
            back_value = $(context).is(':checked') ? 1 : 0;
        }
        var Timeout = null;
        var fire = null;
        if($(context).is('form') && !$(context).attr('data-lijax'))
        {
            fire = ['submit'];
        }
        else if($(context).is('input, select, textarea'))
        {
            fire = $(context).attr('data-lijax') ? $(context).attr('data-lijax').split(' ') : ['change'];
        }
        else{
            fire = $(context).attr('data-lijax') ? $(context).attr('data-lijax').split(' ') : ['click'];
        }
        for (var i = 0; i < fire.length; i++) {
            if(/^\d+$/.test(fire[i]))
            {
                var Time = fire[i];
                $(context).on('keyup', function(){
                    if(Timeout) clearTimeout(Timeout);
                    Timeout = setTimeout(send, Time);
                });
            }
            else
            {
                $(context).on(fire[i], send);
            }
        }

        function send()
        {
            var href = url.parse(location.href);
            var name = $(context).attr('data-name') || $(context).attr('name');
            if(href.get && href.get[name])
            {
                delete href.get[name];
            }
            var get = url.buildget(href.get);
            href = href.url.replace(/\?(.*)$/, get ? '?' + get : '');
            var action = $(context).attr('href') || $(context).attr('action') || $(context).attr('data-action') || href;
            var method = $(context).attr('data-method') || $(context).attr('method') || 'GET';
            var state = $(context).attr('data-state');
            var value = undefined;
            $(context).addClass('lijax-sending');
            $(context).on('statio:done', function () {
                $(this).removeClass('lijax-sending');
            });
            if($(context).is('form'))
            {
                var Data = new FormData(context);
                var data = {};
				if ($(context).attr('enctype') == 'multipart/form-data' || $('input:file', context).length)
                {
                    data = Data;
                }
                else
                {
                    Data.forEach(function (value, name) {
                        data[name] = /\[\]$/.test(name) ? Data.getAll(name) : Data.get(name);
                    });
                }
                state = false;
                $('input, select, textarea, button', context).not(':disabled').addClass('lijax-disable').attr('disabled', 'disabled');
                $(context).on('statio:done', function () {
                    $('.lijax-disable', this).removeClass('lijax-disable').removeAttr('disabled')
                });
            }
            else
            {
                value = $(context).val() || $(context).attr('data-value') || null;
                if($(context).is(':checkbox'))
                {
                    value = $(context).is(':checked') ? 1 : 0;
                }
                if(back_value == value && $(context).is('input, textarea, select') && !onFire) return;
                back_value = value;
                if($(context).is(':file')){
                    var data = new FormData();
                    data.append(name, context.files[0]);
                }else{
                    var data = {};
                    if(name)
                    {
                        data[name] = value;
                    }
                    if($(context).attr('data-merge')){
                        var merge = JSON.parse($(context).attr('data-merge'));
                        console.log($.extend(data, merge));
                    }
                }
            }
            if ($(context).attr('data-query'))
            {
                var action_query = url.parse(action);
                var data_query = url.parse('?' + $(context).attr('data-query'));
                action_query.get = $.extend(null, (action_query.get || {}), data_query.get);
                action = url.build(action_query);
            }
            var headers = {};
            if ($(context).attr('data-xhrBase'))
            {
                headers = {
                    'Data-xhr-base': $(context).attr('data-xhrBase')
                };
            }
            var preload = $('#' + $(context).attr('data-lijax-preload')).eq(0);
            var success = $('#' + $(context).attr('data-lijax-success')).eq(0);
            $(context).on('statio:jsonResponse', function (event, data, jqXHR) {
                if (preload && jqXHR.status != 202) {
                    $(this).removeClass('lijax-preload');
                    if (success && ['Created', 'OK'].indexOf(jqXHR.statusText) >= 0) {
                        preload.hide();
                        success.hide().removeClass('d-none').fadeIn('fast');
                    }
                    else
                    {
                        preload.hide();
                        $(context).fadeIn('fast');
                    }
                }
            });
            var remove_query = $(context).attr('data-remove-query');
            if(remove_query){
                var a_url = url.parse(action);
                var queries = remove_query.split(' ');
                if(a_url.get){
                    for(var i = 0; i < queries.length; i++){
                        if(a_url.get[queries[i]]){
                            delete a_url.get[queries[i]];
                        }
                    }
                }
                var s_queries = [];
                for(var index in (a_url.get || {})){
                    s_queries.push(index +'='+a_url.get[index]);
                }
                a_url.query = s_queries.join('&');
                action = url.build(a_url);
            }
            var uploadFile = $(context).is(':file') || ($(context).is('form') && ($(context).attr('enctype') == 'multipart/form-data' || $('input:file', context).length))  ? true : false;
            $(context).trigger('lijax:data', [data]);
            new Statio({
                type : state ? 'both' : 'render',
                context: context,
                ajax : {
					contentType:  uploadFile ? false : 'application/x-www-form-urlencoded; charset=UTF-8',
					processData: uploadFile ? false : true,
                    cache       : false,
                    method : method,
                    data : data,
                    headers: headers,
                    beforeSend : function(){
                        if ($(context).is('[data-lijax-preload]'))
                        {
                            $(context).addClass('lijax-preload').hide();
                            preload.hide().removeClass('d-none').fadeIn('fast');
                        }
                    }
                },
                url : action
            });
            return false;
        }
        if (onFire)
        {
            send();
        }
    }
    window.Lijax = lijax;
})();
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

// Copyright 2013-2014 Kevin Cox

/*******************************************************************************
*                                                                              *
*  This software is provided 'as-is', without any express or implied           *
*  warranty. In no event will the authors be held liable for any damages       *
*  arising from the use of this software.                                      *
*                                                                              *
*  Permission is granted to anyone to use this software for any purpose,       *
*  including commercial applications, and to alter it and redistribute it      *
*  freely, subject to the following restrictions:                              *
*                                                                              *
*  1. The origin of this software must not be misrepresented; you must not     *
*     claim that you wrote the original software. If you use this software in  *
*     a product, an acknowledgment in the product documentation would be       *
*     appreciated but is not required.                                         *
*                                                                              *
*  2. Altered source versions must be plainly marked as such, and must not be  *
*     misrepresented as being the original software.                           *
*                                                                              *
*  3. This notice may not be removed or altered from any source distribution.  *
*                                                                              *
*******************************************************************************/

+function(){
"use strict";

var array = /\[([^\[]*)\]$/;

/// URL Regex.
/**
 * This regex splits the URL into parts.  The capture groups catch the important
 * bits.
 *
 * Each section is optional, so to work on any part find the correct top level
 * `(...)?` and mess around with it.
 */
var regex = /^(?:([a-z]*):)?(?:\/\/)?(?:([^:@]*)(?::([^@]*))?@)?([0-9a-z-._]+)?(?::([0-9]*))?(\/[^?#]*)?(?:\?([^#]*))?(?:#(.*))?$/i;
//               1 - scheme              2 - user    3 = pass    4 - host           5 - port  6 - path        7 - query    8 - hash

var noslash = ["mailto","bitcoin"];

var self = {
	/** Parse a query string.
	 *
	 * This function parses a query string (sometimes called the search
	 * string).  It takes a query string and returns a map of the results.
	 *
	 * Keys are considered to be everything up to the first '=' and values are
	 * everything afterwords.  Since URL-decoding is done after parsing, keys
	 * and values can have any values, however, '=' have to be encoded in keys
	 * while '?' and '&' have to be encoded anywhere (as they delimit the
	 * kv-pairs).
	 *
	 * Keys and values will always be strings, except if there is a key with no
	 * '=' in which case it will be considered a flag and will be set to true.
	 * Later values will override earlier values.
	 *
	 * Array keys are also supported.  By default keys in the form of `name[i]`
	 * will be returned like that as strings.  However, if you set the `array`
	 * flag in the options object they will be parsed into arrays.  Note that
	 * although the object returned is an `Array` object all keys will be
	 * written to it.  This means that if you have a key such as `k[forEach]`
	 * it will overwrite the `forEach` function on that array.  Also note that
	 * string properties always take precedence over array properties,
	 * irrespective of where they are in the query string.
	 *
	 *   url.get("array[1]=test&array[foo]=bar",{array:true}).array[1]  === "test"
	 *   url.get("array[1]=test&array[foo]=bar",{array:true}).array.foo === "bar"
	 *   url.get("array=notanarray&array[0]=1",{array:true}).array      === "notanarray"
	 *
	 * If array parsing is enabled keys in the form of `name[]` will
	 * automatically be given the next available index.  Note that this can be
	 * overwritten with later values in the query string.  For this reason is
	 * is best not to mix the two formats, although it is safe (and often
	 * useful) to add an automatic index argument to the end of a query string.
	 *
	 *   url.get("a[]=0&a[]=1&a[0]=2", {array:true})  -> {a:["2","1"]};
	 *   url.get("a[0]=0&a[1]=1&a[]=2", {array:true}) -> {a:["0","1","2"]};
	 *
	 * @param{string} q The query string (the part after the '?').
	 * @param{{full:boolean,array:boolean}=} opt Options.
	 *
	 * - full: If set `q` will be treated as a full url and `q` will be built.
	 *   by calling #parse to retrieve the query portion.
	 * - array: If set keys in the form of `key[i]` will be treated
	 *   as arrays/maps.
	 *
	 * @return{!Object.<string, string|Array>} The parsed result.
	 */
	"get": function(q, opt){
		q = q || "";
		if ( typeof opt          == "undefined" ) opt = {};
		if ( typeof opt["full"]  == "undefined" ) opt["full"] = false;
		if ( typeof opt["array"] == "undefined" ) opt["array"] = false;

		if ( opt["full"] === true )
		{
			q = self["parse"](q, {"get":false})["query"] || "";
		}

		var o = {};

		var c = q.split("&");
		for (var i = 0; i < c.length; i++)
		{
			if (!c[i].length) continue;

			var d = c[i].indexOf("=");
			var k = c[i], v = true;
			if ( d >= 0 )
			{
				k = c[i].substr(0, d);
				v = c[i].substr(d+1);

				v = decodeURIComponent(v);
			}

			if (opt["array"])
			{
				var inds = [];
				var ind;
				var curo = o;
				var curk = k;
				while (ind = curk.match(array)) // Array!
				{
					curk = curk.substr(0, ind.index);
					inds.unshift(decodeURIComponent(ind[1]));
				}
				curk = decodeURIComponent(curk);
				if (inds.some(function(i)
				{
					if ( typeof curo[curk] == "undefined" ) curo[curk] = [];
					if (!Array.isArray(curo[curk]))
					{
						//console.log("url.get: Array property "+curk+" already exists as string!");
						return true;
					}

					curo = curo[curk];

					if ( i === "" ) i = curo.length;

					curk = i;
				})) continue;
				curo[curk] = v;
				continue;
			}

			k = decodeURIComponent(k);

			//typeof o[k] == "undefined" || console.log("Property "+k+" already exists!");
			o[k] = v;
		}

		return o;
	},

	/** Build a get query from an object.
	 *
	 * This constructs a query string from the kv pairs in `data`.  Calling
	 * #get on the string returned should return an object identical to the one
	 * passed in except all non-boolean scalar types become strings and all
	 * object types become arrays (non-integer keys are still present, see
	 * #get's documentation for more details).
	 *
	 * This always uses array syntax for describing arrays.  If you want to
	 * serialize them differently (like having the value be a JSON array and
	 * have a plain key) you will need to do that before passing it in.
	 *
	 * All keys and values are supported (binary data anyone?) as they are
	 * properly URL-encoded and #get properly decodes.
	 *
	 * @param{Object} data The kv pairs.
	 * @param{string} prefix The properly encoded array key to put the
	 *   properties.  Mainly intended for internal use.
	 * @return{string} A URL-safe string.
	 */
	"buildget": function(data, prefix){
		var itms = [];
		for ( var k in data )
		{
			var ek = encodeURIComponent(k);
			if ( typeof prefix != "undefined" )
				ek = prefix+"["+ek+"]";

			var v = data[k];

			switch (typeof v)
			{
				case 'boolean':
					if(v) itms.push(ek);
					break;
				case 'number':
					v = v.toString();
				case 'string':
					itms.push(ek+"="+encodeURIComponent(v));
					break;
				case 'object':
					itms.push(self["buildget"](v, ek));
					break;
			}
		}
		return itms.join("&");
	},

	/** Parse a URL
	 *
	 * This breaks up a URL into components.  It attempts to be very liberal
	 * and returns the best result in most cases.  This means that you can
	 * often pass in part of a URL and get correct categories back.  Notably,
	 * this works for emails and Jabber IDs, as well as adding a '?' to the
	 * beginning of a string will parse the whole thing as a query string.  If
	 * an item is not found the property will be undefined.  In some cases an
	 * empty string will be returned if the surrounding syntax but the actual
	 * value is empty (example: "://example.com" will give a empty string for
	 * scheme.)  Notably the host name will always be set to something.
	 *
	 * Returned properties.
	 *
	 * - **scheme:** The url scheme. (ex: "mailto" or "https")
	 * - **user:** The username.
	 * - **pass:** The password.
	 * - **host:** The hostname. (ex: "localhost", "123.456.7.8" or "example.com")
	 * - **port:** The port, as a number. (ex: 1337)
	 * - **path:** The path. (ex: "/" or "/about.html")
	 * - **query:** "The query string. (ex: "foo=bar&v=17&format=json")
	 * - **get:** The query string parsed with get.  If `opt.get` is `false` this
	 *   will be absent
	 * - **hash:** The value after the hash. (ex: "myanchor")
	 *   be undefined even if `query` is set.
	 *
	 * @param{string} url The URL to parse.
	 * @param{{get:Object}=} opt Options:
	 *
	 * - get: An options argument to be passed to #get or false to not call #get.
	 *    **DO NOT** set `full`.
	 *
	 * @return{!Object} An object with the parsed values.
	 */
	"parse": function(url, opt) {

		if ( typeof opt == "undefined" ) opt = {};

		var md = url.match(regex) || [];

		var r = {
			"url":    url,

			"scheme": md[1],
			"user":   md[2],
			"pass":   md[3],
			"host":   md[4],
			"port":   md[5] && +md[5],
			"path":   md[6],
			"query":  md[7],
			"hash":   md[8],
		};

		if ( opt.get !== false )
			r["get"] = r["query"] && self["get"](r["query"], opt.get);

		return r;
	},

	/** Build a URL from components.
	 *
	 * This pieces together a url from the properties of the passed in object.
	 * In general passing the result of `parse()` should return the URL.  There
	 * may differences in the get string as the keys and values might be more
	 * encoded then they were originally were.  However, calling `get()` on the
	 * two values should yield the same result.
	 *
	 * Here is how the parameters are used.
	 *
	 *  - url: Used only if no other values are provided.  If that is the case
	 *     `url` will be returned verbatim.
	 *  - scheme: Used if defined.
	 *  - user: Used if defined.
	 *  - pass: Used if defined.
	 *  - host: Used if defined.
	 *  - path: Used if defined.
	 *  - query: Used only if `get` is not provided and non-empty.
	 *  - get: Used if non-empty.  Passed to #buildget and the result is used
	 *    as the query string.
	 *  - hash: Used if defined.
	 *
	 * These are the options that are valid on the options object.
	 *
	 *  - useemptyget: If truthy, a question mark will be appended for empty get
	 *    strings.  This notably makes `build()` and `parse()` fully symmetric.
	 *
	 * @param{Object} data The pieces of the URL.
	 * @param{Object} opt Options for building the url.
	 * @return{string} The URL.
	 */
	"build": function(data, opt){
		opt = opt || {};

		var r = "";

		if ( typeof data["scheme"] != "undefined" )
		{
			r += data["scheme"];
			r += (noslash.indexOf(data["scheme"])>=0)?":":"://";
		}
		if ( typeof data["user"] != "undefined" )
		{
			r += data["user"];
			if ( typeof data["pass"] == "undefined" )
			{
				r += "@";
			}
		}
		if ( typeof data["pass"] != "undefined" ) r += ":" + data["pass"] + "@";
		if ( typeof data["host"] != "undefined" ) r += data["host"];
		if ( typeof data["port"] != "undefined" ) r += ":" + data["port"];
		if ( typeof data["path"] != "undefined" ) r += data["path"];

		if (opt["useemptyget"])
		{
			if      ( typeof data["get"]   != "undefined" ) r += "?" + self["buildget"](data["get"]);
			else if ( typeof data["query"] != "undefined" ) r += "?" + data["query"];
		}
		else
		{
			// If .get use it.  If .get leads to empty, use .query.
			var q = data["get"] && self["buildget"](data["get"]) || data["query"];
			if (q) r += "?" + q;
		}

		if ( typeof data["hash"] != "undefined" ) r += "#" + data["hash"];

		return r || data["url"] || "";
	},
};

if ( typeof define != "undefined" && define["amd"] ) define(self);
else if ( typeof module != "undefined" ) module['exports'] = self;
else window["url"] = self;

}();
const aside = document.querySelector('#aside');
const asideBtn = document.querySelector('#aside-btn');
function handleAside(event) {
    aside.classList.add('open');
}
if (asideBtn)
{
    asideBtn.addEventListener('click', handleAside);
}

const profile = document.querySelector('.profile');

if (profile)
{
    const dropdown = document.querySelector('.profile-dropdown');

    function handleProfileClick(event) {
        dropdown.classList.add('open');
    }
    profile.addEventListener('click', handleProfileClick);
    window.addEventListener('click', function(event) {
        if (!event.target.closest('.profile-div')) {
            dropdown.classList.remove('open');
        }
        if (!event.target.closest('#aside') && !event.target.closest('#aside-btn')) {
            aside.classList.remove('open');
        }
    });
}


$(document).ready(function() {
    if ($.fn.select2)
    {
        $('.select2').select2();
    }
});
(function(){
	$.fn.hajmad = function(){
		$(this).each(function(){
			var _self = this;
			var label = $(this).next('label');
			var target = label.children('img');
			var remove_button = label.next('button');
			var default_image = target.attr('src');
			$(this).change(function () {
				if (this.files && this.files[0] && this.files[0].type.substr(0, 6) == 'image/')
				{
					var reader = new FileReader();
					reader.onload = function (e) {
						target.attr('src', reader.result);
					}
					reader.readAsDataURL(this.files[0]);
				}
				remove_button.removeClass('d-none');
			});
			remove_button.on('click', function () {
				_self.value = null;
				target.attr('src', default_image);
				$(this).addClass('d-none');
			});
		})
	}
})(jQuery);
var media_xm = window.matchMedia("(max-width: 575.98px)");
var media_sm = window.matchMedia("(min-width: 576px) and (max-width: 767.98px)");
var media_md = window.matchMedia("(min-width: 768px) and (max-width: 991.98px)");
var media_lg = window.matchMedia("(min-width: 992px) and (max-width: 1199.98px)");
var media_xl = window.matchMedia("(min-width: 1200px)");


function event_media_xm(media){
	if(media.matches) return $(document).trigger('media:xm', [media]);
	else return $(document).trigger('media:xm:exit', [media]);
}
function event_media_sm(media){
	if(media.matches) return $(document).trigger('media:sm', [media]);
	else return $(document).trigger('media:sm:exit', [media]);
}
function event_media_md(media){
	if(media.matches) return $(document).trigger('media:md', [media]);
	else return $(document).trigger('media:md:exit', [media]);
}
function event_media_lg(media){
	if(media.matches) return $(document).trigger('media:lg', [media]);
	else return $(document).trigger('media:lg:exit', [media]);
}
function event_media_xl(media){
	if(media.matches) return $(document).trigger('media:xl', [media]);
	else return $(document).trigger('media:xl:exit', [media]);
}

$(document).ready(function(){
	event_media_xm(media_xm);
	media_xm.addListener(event_media_xm);

	event_media_sm(media_sm);
	media_sm.addListener(event_media_sm);

	event_media_md(media_md);
	media_md.addListener(event_media_md);

	event_media_lg(media_lg);
	media_lg.addListener(event_media_lg);

	event_media_xl(media_xl);
	media_xl.addListener(event_media_xl);
})

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
		// $('.input-avatar', this).hajmad();
		$('.dropdown-menu.keep-open', this).on('click', function (event) {
			event.stopPropagation();
		});
		$('[data-Lijax], .lijax', this).each(function () {
			new Lijax(this);
		});
		$("a", this).not('.direct, [data-direct], [target=_blank], .lijax, [data-lijax]').on('click', function (e) {
			if (/^\#(.*)$/.test($(this).attr('href'))){
				return true;
			}
			new Statio({
				url: $(this).attr('href'),
				type: $(this).is('.action') ? 'render' : 'both',
				context: $(this),
			});
			e.preventDefault();
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
		// $(".select2-select", this).each(function () {
		// 	select2element.call(this);
		// });
		// $('.select2-select[data-relation]', this).on('select2:select', function (e) {
		// 	var relation_ids = $(this).attr('data-relation');
		// 	var f_id = $(this).val();
		// 	relation_ids.split(' ').forEach(function (relation_id){
		// 		var relation = $('#' + relation_id);
		// 		if (!relation.length) return;
		// 		var url = unescape(relation.attr('data-url-pattern')).replace('%%', f_id);
		// 		relation.attr('data-url', url);
		// 		relation.val(null).trigger("change");
		// 		relation.select2('destroy');
		// 		select2element.call(relation[0]);
		// 	});
		// });
		$('.date-picker', this).each(function(){
			var val = $(this).val();
			var _self = this;
			var format = $(this).attr('dpicker-format') || "YYYY/M/D H:m";
			$(this).persianDatepicker({
				format: format,
				minDate: $(this).attr('data-picker-minDate') ? $(this).attr('data-picker-minDate') * 1000 : undefined,
				maxDate: $(this).attr('data-picker-maxDate') ? $(this).attr('data-picker-maxDate') * 1000 : undefined,
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
					enabled: $(this).is('[dpicker-time]'),
					second: {
						enabled: false
					}
				},
				responsive: true
			});
			if (val)
			{
				var date = new persianDate(val * 1000);
				$(this).val(date.format(format));
				$('#' + $(this).attr('data-picker-alt')).val(val);
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
	if(window.tabs && window.tabs.toggle){
		window.tabs.toggle(selectedTab);
	}
});
function responsive_menu() {
    $('#menu').removeClass('d-none').addClass('d-flex');
    // $('#desktop').removeClass('d-none');
    $('body').addClass('responsive-menu');
    $('#btn-menu').find($(".fas")).removeClass('fa-bars').addClass('fa-arrow-right');
    $(this).off('click.responsive-menu');
    $(this).on('click.close-responsive-menu', function() {
        $(this).off('click.close-responsive-menu');
        $(this).on('click.responsive-menu', responsive_menu);
        $('#menu').addClass('d-none').removeClass('d-flex');
        // $('#desktop').addClass('d-none');
        $('body').removeClass('responsive-menu');
        $('#btn-menu').find($(".fas")).removeClass('fa-arrow-right').addClass('fa-bars');
    });
}

$(document).on('media:xm media:sm', function(event, media) {
    $("body:not(.responsive-menu) #btn-menu").on('click.responsive-menu', responsive_menu);

    var menu = $('#menu');
    var desktop = $('#desktop');
    var btn_menu = $('#btn-menu');
    $(document).mouseup(function(e) {
        if (
            (!menu.is(e.target) && menu.has(e.target).length === 0)
            && (!desktop.is(e.target) && desktop.has(e.target).length === 0)
            && (!btn_menu.is(e.target) && btn_menu.has(e.target).length === 0)
            )
        {
            $("body.responsive-menu #btn-menu").trigger('click.close-responsive-menu');
        }
    });

    // $("body").swipe({
    //     swipe: function(event, direction, distance, duration, fingerCount, fingerData) {
    //         if (direction == 'left') {
    //             $("body:not(.responsive-menu) #btn-menu").trigger('click.responsive-menu');
    //         }

    //         if (direction == 'right') {
    //             $("body.responsive-menu #btn-menu").trigger('click.close-responsive-menu');
    //         }

    //         if (direction == 'up' || direction == 'down') {
    //             if (!menu.is(event.target) && menu.has(event.target).length === 0) {
    //                 $("body.responsive-menu #btn-menu").trigger('click.close-responsive-menu');
    //             }
    //         }
    //     }
    // });
});

$(document).on('media:md media:lg media:xl', function(event, media) {
    $("body.responsive-menu #btn-menu").trigger('click.close-responsive-menu');
    $("#btn-menu").off('click.responsive-menu');
    // $("#btn-menu").off('click.close-responsive-menu');
    // $('#menu').addClass('d-none').removeClass('d-flex');
    // $('#desktop').addClass('d-none');
    // $('body').removeClass('responsive-menu');
    // $('#btn-menu').find($(".fas")).removeClass('fa-arrow-right').addClass('fa-bars');
});
(function () {
	function ViwFile()
	{
		$('.custom-file-input', this).on('change', function(){
			if (!window.File && !window.FileReader && !window.FileList && !window.Blob) {
				console.error('FileReader unsupported!');
				return false;
			}
			var file_index = 0;
			var file;
			$(this).next().html('');
			var files = [];
			while (file = this.files.item(file_index++))
			{
				files.push(file.name);
			}
			$(this).next().html(files.join(' : '));
		});
	}
	$(document).on('statio:global:renderResponse', function (event, base, contex) {
		base.each(function () {
			ViwFile.call(this);
		});
	});
	ViwFile.call(document);
})();