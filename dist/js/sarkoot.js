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
				iziToast[res.is_ok ? 'success' : 'error']({ message: res.message_text || res.message});
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
					url : res.redirect
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
        else
        {
            fire = $(context).attr('data-lijax').split(' ') || ['change'];
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
            var name = $(context).attr('name') || $(context).attr('data-name');
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
                        data[name] = /\[.*\]$/.test(name) ? Data.getAll(name) : Data.get(name);
                    });
                }
                state = false;
                $(context).addClass('lijax-sending');
                $('input, select, textarea, button', context).not(':disabled').addClass('lijax-disable').attr('disabled', 'disabled');
                $(context).on('statio:done', function () {
                    $('.lijax-disable', this).removeClass('lijax-disable').removeAttr('disabled')
                    $(this).removeClass('lijax-sending');
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
                var data = {};
                data[name] = value;
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
            new Statio({
                type : state ? 'both' : 'render',
                context: context,
                ajax : {
					contentType: $(context).is('form') && ($(context).attr('enctype') == 'multipart/form-data' || $('input:file', context).length) ? false : 'application/x-www-form-urlencoded; charset=UTF-8',
					processData: ($(context).is('form') && ($(context).attr('enctype') == 'multipart/form-data' || $('input:file', context).length)) ? false : true,
                    cache       : false,
                    method : method,
                    data : data,
                    headers: headers
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

if (window.am4core)
{
    am4core.ready(function () {

        // Themes begin
        am4core.useTheme(am4themes_amcharts);
        // Themes end

        // Create chart instance
        var chart = am4core.create("chartdiv", am4charts.XYChart);

        chart.rtl = true;

        // Add data
        chart.data = [{
            "country": "USA",
            "visits": 2025
        }, {
            "country": "China",
            "visits": 1882
        }, {
            "country": "Japan",
            "visits": 1809
        }, {
            "country": "Germany",
            "visits": 1322
        }, {
            "country": "UK",
            "visits": 1122
        }, {
            "country": "France",
            "visits": 1114
        }, {
            "country": "India",
            "visits": 984
        }, {
            "country": "Spain",
            "visits": 711
        }, {
            "country": "Netherlands",
            "visits": 665
        }, {
            "country": "Russia",
            "visits": 580
        }, {
            "country": "South Korea",
            "visits": 443
        }, {
            "country": "Canada",
            "visits": 441
        }, {
            "country": "Brazil",
            "visits": 395
        }];

        // Create axes

        var categoryAxis = chart.xAxes.push(new am4charts.CategoryAxis());
        categoryAxis.dataFields.category = "country";
        categoryAxis.renderer.grid.template.location = 0;
        categoryAxis.renderer.minGridDistance = 30;

        categoryAxis.renderer.labels.template.adapter.add("dy", function (dy, target) {
            if (target.dataItem && target.dataItem.index & 2 == 2) {
                return dy + 25;
            }
            return dy;
        });

        var valueAxis = chart.yAxes.push(new am4charts.ValueAxis());

        // Create series
        var series = chart.series.push(new am4charts.ColumnSeries());
        series.dataFields.valueY = "visits";
        series.dataFields.categoryX = "country";
        series.name = "Visits";
        series.columns.template.tooltipText = "{categoryX}: [bold]{valueY}[/]";
        series.columns.template.fillOpacity = .8;

        var columnTemplate = series.columns.template;
        columnTemplate.strokeWidth = 2;
        columnTemplate.strokeOpacity = 1;

    });
}

$(document).ready(function() {
    if ($.fn.select2)
    {
        $('.select2').select2();
    }
});

function readURL(input) {
    if (input.files && input.files[0]) {
        var reader = new FileReader();

        reader.onload = function(e) {
            $(input).next('label').children('img').attr('src', e.target.result);
        }

        reader.readAsDataURL(input.files[0]);
    }
  }

$('.input-avatar').change(function() {
    readURL(this);
});

var datepicker = function (elementID, opt) {

    // check arguments
    if (typeof elementID !== "string" || elementID.length === 0) {
        console.error("datepicker error: input ID is not string or is empty");
        return;
    }
    var options = opt || {};

    // variables
    var isCalClicked = false;
    var isSynced = false;

    var dayOfWeek;

    var selectedYear;
    var selectedMonth;
    var selectedDay;

    var currentYear;
    var currentMonth;
    var currentDay;

    var todaysYear;
    var todaysMonth;
    var todaysDay;

    var dayOfWeekJ;

    var numberOfDays;

    var todayG;
    var todaysJ;

    // consts
    var MONTH_NAMES = {
        "1": "فروردین"
        , "2": "اردیبهشت"
        , "3": "خرداد"
        , "4": "تیر"
        , "5": "مرداد"
        , "6": "شهریور"
        , "7": "مهر"
        , "8": "آبان"
        , "9": "آذر"
        , "10": "دی"
        , "11": "بهمن"
        , "12": "اسفند"
    }
    var DAY_NAMES = {
        "شنبه": "ش"
        , "یکشنبه": "ی"
        , "دوشنبه": "د"
        , "سه شنبه": "س"
        , "چهارشنبه": "چ"
        , "پنج شنبه": "پ"
        , "جمعه": "ج"
    };
    var FA_NUMS = ['٠', '١', '٢', '٣', '۴', '۵', '۶', '٧', '٨', '٩', '١٠', '١١', '١٢', '١٣', '١۴', '١۵', '١۶', '١٧', '١٨', '١٩', '٢٠', '٢١', '٢٢', '٢٣', '٢۴', '٢۵', '٢۶', '٢٧', '٢٨', '٢٩', '٣٠', '٣١', '٣٢'];

    // set options
    options.placeholder = options.placeholder !== undefined ? options.placeholder : "";
    options.twodigit = options.twodigit !== undefined ? options.twodigit : true;
    options.closeAfterSelect = options.closeAfterSelect !== undefined ? options.closeAfterSelect : true;
    options.nextButtonIcon = options.nextButtonIcon !== undefined ? options.nextButtonIcon : false;
    options.previousButtonIcon = options.previousButtonIcon !== undefined ? options.previousButtonIcon : false;
    options.buttonsColor = options.buttonsColor !== undefined ? options.buttonsColor : false;
    options.forceFarsiDigits = options.forceFarsiDigits !== undefined ? options.forceFarsiDigits : false;
    options.markToday = options.markToday !== undefined ? options.markToday : false;
    options.markHolidays = options.markHolidays !== undefined ? options.markHolidays : false;
    options.highlightSelectedDay = options.highlightSelectedDay !== undefined ? options.highlightSelectedDay : false;
    options.sync = options.sync !== undefined ? options.sync : false;
    options.gotoToday = options.gotoToday !== undefined ? options.gotoToday : false;

    // create DOM
    var inputElement = $("#" + elementID);

    if (inputElement.attr("placeholder") === undefined) {
        inputElement.attr("placeholder", options.placeholder);
    }

    // create parent div
    inputElement.wrap("<div id='bd-root-" + elementID + "' style='position: relative;'></div>");

    // create main div for calendar, below input element
    inputElement.after("<div id='bd-main-" + elementID + "' class='bd-main bd-hide' style='position: absolute; direction: rtl;'></div>");
    var mainDiv = $("#bd-main-" + elementID);

    // create calendar div inside main div
    mainDiv.append("<div class='bd-calendar'></div>");
    var calendarDiv = mainDiv.find('.bd-calendar');

    // create title div and table inside calendar div
    calendarDiv.append("<div class='bd-title'></div>");
    var titleDiv = calendarDiv.find('.bd-title');
    calendarDiv.append("<table class='bd-table' dir='rtl' cellspacing='0' cellpadding='0'></table>");

    // create month and year drop downs and next/prev month buttons inside title div
    titleDiv.append("<button id='bd-next-" + elementID + "' class='bd-next' type='button' title='ماه بعدی' data-toggle='tooltip'><span>بعدی</span></button>");
    var nextMonth = $("#bd-next-" + elementID);
    if (options.nextButtonIcon) {
        nextMonth.find("span").css("display", "none");
        if (options.nextButtonIcon.indexOf(".") !== -1) {
            // image
            nextMonth.css("background-image", "url(" + options.nextButtonIcon + ")");
        } else {
            // css class
            nextMonth.addClass(options.nextButtonIcon);
        }
    }

    titleDiv.append("<div class='bd-dropdown'></div><div class='bd-dropdown'></div>");

    titleDiv.find('.bd-dropdown:nth-child(2)').append("<select id='bd-month-" + elementID + "' class='bd-month'></select>");
    var monthDropdown = $("#bd-month-" + elementID);
    $.each(MONTH_NAMES, function (key, value) {
        monthDropdown.append($("<option></option>").attr("value", key).text(value));
    });

    titleDiv.find('.bd-dropdown:nth-child(3)').append("<select id='bd-year-" + elementID + "' class='bd-year'></select>");
    var yearDropdown = $("#bd-year-" + elementID);

    titleDiv.append("<button id='bd-prev-" + elementID + "' class='bd-prev' type='button' title='ماه قبلی' data-toggle='tooltip'><span>قبلی</span></button>");
    var prevMonth = $("#bd-prev-" + elementID);
    if (options.nextButtonIcon) {
        prevMonth.find("span").css("display", "none");
        if (options.previousButtonIcon.indexOf(".") !== -1) {
            // image
            prevMonth.css("background-image", "url(" + options.previousButtonIcon + ")");
        } else {
            // css class
            prevMonth.addClass(options.previousButtonIcon);
        }
    }

    if (options.buttonsColor) {
        nextMonth.css("color", options.buttonsColor);
        nextMonth.find("span").css("color", options.buttonsColor);
        prevMonth.css("color", options.buttonsColor);
        prevMonth.find("span").css("color", options.buttonsColor);
    }

    // create table header and body
    calendarDiv.find('.bd-table').append("<thead><tr></tr></thead>");
    $.each(DAY_NAMES, function (key, value) {
        calendarDiv.find('.bd-table thead tr').append($("<th></th>").text(value));
    });

    calendarDiv.find('.bd-table').append("<tbody id='bd-table-days-" + elementID + "' class='bd-table-days'></tbody>");
    var daysTable = $("#bd-table-days-" + elementID);

    // create go to todays button
    if (options.gotoToday) {
        calendarDiv.append("<div class='bd-goto-today'>برو به امروز</div>");
        var gotoToday = calendarDiv.find(".bd-goto-today");
    }

    // opening and closing functionality
    inputElement.on("focus", function () {
        mainDiv.removeClass("bd-hide");
        if (options.sync && isSynced === false) {
            syncCalendar();
            isSynced = true;
        }
        mainDiv;
    }).on('blur', function () {
        if (isCalClicked == false) {
            mainDiv.addClass("bd-hide");
            isSynced = false;
        } else {
            isCalClicked = false;
            inputElement.focus();
            event.preventDefault();
        }
    });

    mainDiv.on('mousedown', function (event) {
        isCalClicked = true;
    });

    // dropdown events
    monthDropdown.on('change', function () {
        selectedMonth = parseInt(this.value);
        numberOfDays = monthDays(selectedYear, selectedMonth);
        dayOfWeekJ = findFirstDayOfMonth(selectedYear, selectedMonth);
        drawDays(numberOfDays, dayOfWeekJ);
    });
    yearDropdown.on('change', function () {
        selectedYear = parseInt(this.value);
        numberOfDays = monthDays(selectedYear, selectedMonth);
        dayOfWeekJ = findFirstDayOfMonth(selectedYear, selectedMonth);
        drawDays(numberOfDays, dayOfWeekJ);
    });

    // Georgian to Jalali converter (minified)
    // source is unknown. contact if you know the code owner.
    function gregorianToJalali(a, r, s) { a = parseInt(a), r = parseInt(r), s = parseInt(s); for (var n = a - 1600, e = r - 1, t = s - 1, p = 365 * n + parseInt((n + 3) / 4) - parseInt((n + 99) / 100) + parseInt((n + 399) / 400), I = 0; e > I; ++I) p += g_days[I]; e > 1 && (n % 4 == 0 && n % 100 != 0 || n % 400 == 0) && ++p, p += t; var v = p - 79, d = parseInt(v / 12053); v %= 12053; var o = 979 + 33 * d + 4 * parseInt(v / 1461); v %= 1461, v >= 366 && (o += parseInt((v - 1) / 365), v = (v - 1) % 365); for (var I = 0; 11 > I && v >= j_days[I]; ++I) v -= j_days[I]; var y = I + 1, _ = v + 1; return [o, y, _] } var g_days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31], j_days = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];
    // Jalali to Georgian converter (minified)
    // source is unknown. contact if you know the code owner.
    function toJalaali(d, i, a) { return d2j(g2d(d, i, a)) } function toGregorian(d, i, a) { return d2g(j2d(d, i, a)) } function isValidJalaaliDate(d, i, a) { return d >= -61 && 3177 >= d && i >= 1 && 12 >= i && a >= 1 && a <= jalaaliMonthLength(d, i) } function isLeapJalaaliYear(d) { return 0 === jalCal(d).leap } function jalaaliMonthLength(d, i) { return 6 >= i ? 31 : 11 >= i ? 30 : isLeapJalaaliYear(d) ? 30 : 29 } function jalCal(d) { var i, a, n, r, t, o, v, e = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178], l = e.length, u = d + 621, m = -14, g = e[0]; if (g > d || d >= e[l - 1]) throw new Error("Invalid Jalaali year " + d); for (v = 1; l > v && (i = e[v], a = i - g, !(i > d)); v += 1) m = m + 8 * div(a, 33) + div(mod(a, 33), 4), g = i; return o = d - g, m = m + 8 * div(o, 33) + div(mod(o, 33) + 3, 4), 4 === mod(a, 33) && a - o === 4 && (m += 1), r = div(u, 4) - div(3 * (div(u, 100) + 1), 4) - 150, t = 20 + m - r, 6 > a - o && (o = o - a + 33 * div(a + 4, 33)), n = mod(mod(o + 1, 33) - 1, 4), -1 === n && (n = 4), { leap: n, gy: u, march: t } } function j2d(d, i, a) { var n = jalCal(d); return g2d(n.gy, 3, n.march) + 31 * (i - 1) - div(i, 7) * (i - 7) + a - 1 } function d2j(d) { var i, a, n, r = d2g(d).gy, t = r - 621, o = jalCal(t), v = g2d(r, 3, o.march); if (n = d - v, n >= 0) { if (185 >= n) return a = 1 + div(n, 31), i = mod(n, 31) + 1, { jy: t, jm: a, jd: i }; n -= 186 } else t -= 1, n += 179, 1 === o.leap && (n += 1); return a = 7 + div(n, 30), i = mod(n, 30) + 1, { jy: t, jm: a, jd: i } } function g2d(d, i, a) { var n = div(1461 * (d + div(i - 8, 6) + 100100), 4) + div(153 * mod(i + 9, 12) + 2, 5) + a - 34840408; return n = n - div(3 * div(d + 100100 + div(i - 8, 6), 100), 4) + 752 } function d2g(d) { var i, a, n, r, t; return i = 4 * d + 139361631, i = i + 4 * div(3 * div(4 * d + 183187720, 146097), 4) - 3908, a = 5 * div(mod(i, 1461), 4) + 308, n = div(mod(a, 153), 5) + 1, r = mod(div(a, 153), 12) + 1, t = div(i, 1461) - 100100 + div(8 - r, 6), { gy: t, gm: r, gd: n } } function div(d, i) { return ~~(d / i) } function mod(d, i) { return d - ~~(d / i) * i }

    var syncCalendar = function () {
        var inputValue = fixDate(inputElement.val());
        if (inputValue === "")
            return;

        inputValue = inputValue.split("/");
        monthDropdown.val(parseInt(inputValue[1]));
        monthDropdown.trigger("change");
        yearDropdown.val(parseInt(inputValue[0]));
        yearDropdown.trigger("change");

        if (options.highlightSelectedDay) {
            mainDiv.find(".bd-selected-day").removeClass("bd-selected-day");
            mainDiv.find(".day-" + parseInt(inputValue[2])).addClass("bd-selected-day");
        }
    }

    var fixDate = function (date) {
        if (date === "")
            return "";

        date = date.split("/");
        // if (date[0].length === 2) {
        //     date[0] = "13" + date[0];
        // }
        if (date[1].length < 2) {
            if (date[1] < 10) {
                date[1] = "0" + date[1];
            }
        }
        if (date[2].length < 2) {
            if (date[2] < 10) {
                date[2] = "0" + date[2];
            }
        }
        date = date.join("/");
        return date;
    }

    var convertToJWeek = function (dayOfWeekG) {
        var dayOfWeekJ;
        if (dayOfWeekG < 6) {
            dayOfWeekJ = dayOfWeekG + 1;
        } else {
            dayOfWeekJ = 0;
        }
        return dayOfWeekJ;
    }

    var makeYearList = function (thisYear) {
        yearDropdown.find('option').remove();
        for (i = 0; i < 101; i++) {
            var tempYear = ((thisYear - 95) + i) + '';
            if (options.forceFarsiDigits) {
                for (var j = 0; j < 10; j++) {
                    var rgx = new RegExp(j, 'g');
                    tempYear = tempYear.replace(rgx, FA_NUMS[j]);
                }
            }
            yearDropdown.append($('<option>', {
                value: (thisYear - 95) + i,
                text: tempYear
            }));
        }
    }

    // isleap calculator, supported year: 1243 - 1473
    var isLeapYear = function (year) {
        var mod;
        if (year < 1343 && year > 1243) {
            mod = year % 33;
            if (mod == 1 || mod == 5 || mod == 9 || mod == 13 || mod == 17 || mod == 22 || mod == 26 || mod == 30) {
                return true;
            } else {
                return false;
            }
        } else if (year < 1473 && year > 1342) {
            mod = year % 17;
            if (mod == 1 || mod == 5 || mod == 9 || mod == 13 || mod == 18 || mod == 22 || mod == 26 || mod == 30) {
                return true;
            } else {
                return false
            }
        } else {
            return "unknown";
        }
    }

    var monthDays = function (year, month) {
        if (month < 7) {
            return 31;
        } else if (month < 12) {
            return 30;
        } else {
            if (isLeapYear(year)) {
                return 30;
            } else {
                return 29;
            }
        }
    }

    // make first page of calendar
    todayG = new Date();

    todaysJ = gregorianToJalali(todayG.getFullYear(), todayG.getMonth() + 1, todayG.getDate());
    var selectedDateJ = [];
    for (i = 0; i < 3; i++) {
        selectedDateJ[i] = todaysJ[i];
    }

    todaysYear = todaysJ[0];
    todaysMonth = todaysJ[1];
    todaysDay = todaysJ[2];

    selectedYear = selectedDateJ[0];
    selectedMonth = selectedDateJ[1];
    selectedDay = selectedDateJ[2];

    monthDropdown.val(selectedMonth);
    makeYearList(selectedYear);
    yearDropdown.val(selectedYear);

    numberOfDays = monthDays(selectedYear, selectedMonth);

    // find first day of month in week
    var findFirstDayOfMonth = function (selectedYear, selectedMonth) {
        var firstDayOfMonthG = toGregorian(selectedYear, selectedMonth, 1);
        firstDayOfMonthG = new Date(firstDayOfMonthG.gy + "/" + firstDayOfMonthG.gm + "/" + firstDayOfMonthG.gd);
        return convertToJWeek(firstDayOfMonthG.getDay());
    }
    dayOfWeekJ = findFirstDayOfMonth(selectedYear, selectedMonth);

    // draw days on calendar
    var drawDays = function (numberOfDays, dayOfWeekJ) {
        daysTable.empty();
        var dayIndex = 1;
        var rowIndex = 1;
        while (dayIndex <= numberOfDays) {
            daysTable.append($('<tr>', {
                class: "tr-" + rowIndex
            }));
            for (i = 0; i < 7; i++) {
                if (dayIndex == 1) {
                    var j = 0;
                    while (j < dayOfWeekJ) {
                        $("#bd-table-days-" + elementID + " .tr-1").append($('<td>', {
                            class: "bd-empty-cell"
                        })
                        );
                        j++;
                        i++;
                    }
                }
                if (i < 7 && dayIndex <= numberOfDays) {
                    var tempTD = '<td>' +
                        '<button class="day day-' + dayIndex + '" type="button">' + (options.forceFarsiDigits ? FA_NUMS[dayIndex] : dayIndex) + '</button>' +
                        '</td>';

                    // mark todays day by adding .bd-today class
                    if (options.markToday) {
                        if (dayIndex == todaysDay && todaysMonth == selectedMonth && todaysYear == selectedYear) {
                            var idx = tempTD.indexOf('day day-');
                            tempTD = tempTD.slice(0, idx) + ' bd-today ' + tempTD.slice(idx);
                        }
                    }

                    // mark holidays by adding .bd-holiday class
                    if (options.markHolidays) {
                        if (i == 6) {
                            var idx = tempTD.indexOf('day day-');
                            tempTD = tempTD.slice(0, idx) + ' bd-holiday ' + tempTD.slice(idx);
                        }
                    }

                    $("#bd-table-days-" + elementID + " .tr-" + rowIndex).append(tempTD);

                    dayIndex++;
                }
            }
            rowIndex++;
        }

        if (options.highlightSelectedDay) {
            var inputValue = inputElement.val();
            inputValue = inputValue.split("/");
            if (inputValue[0] == selectedYear && inputValue[1] == selectedMonth) {
                mainDiv.find(".bd-selected-day").removeClass("bd-selected-day");
                mainDiv.find(".day-" + parseInt(inputValue[2])).addClass("bd-selected-day");
            }
        }

    }

    inputElement.parent().on("click", "button.day", function () {
        var datestr = selectedYear + "/" + selectedMonth + "/" + $(this).attr('class').split(" ")[$(this).attr('class').split(" ").indexOf('day') + 1].split("-")[1];
        if (options.twodigit) {
            datestr = fixDate(datestr);
        }
        inputElement.val(datestr);
        inputElement.trigger("change");
        if (options.closeAfterSelect) {
            isCalClicked = false;
            inputElement.trigger("blur");
        }

        if (options.highlightSelectedDay) {
            mainDiv.find(".bd-selected-day").removeClass("bd-selected-day");
            $(this).addClass("bd-selected-day");
        }
    });

    nextMonth.on("click", function () {
        //console.log("month: " + selectedMonth + ", year: " + selectedYear);
        if (monthDropdown.val() < 12) {
            monthDropdown.val(parseInt(monthDropdown.val()) + 1);
            monthDropdown.trigger("change");
        } else {
            monthDropdown.val(1);
            monthDropdown.trigger("change");
            yearDropdown.val(parseInt(yearDropdown.val()) + 1);
            yearDropdown.trigger("change");
        }
    });

    prevMonth.on("click", function () {
        if (monthDropdown.val() > 1) {
            monthDropdown.val(parseInt(monthDropdown.val()) - 1);
            monthDropdown.trigger("change");
        } else {
            monthDropdown.val(12);
            monthDropdown.trigger("change");
            yearDropdown.val(parseInt(yearDropdown.val()) - 1);
            yearDropdown.trigger("change");
        }
    });

    if (options.gotoToday) {
        gotoToday.on("click", function () {
            monthDropdown.val(todaysMonth);
            monthDropdown.trigger("change");
            yearDropdown.val(todaysYear);
            yearDropdown.trigger("change");
        });
    }

    drawDays(numberOfDays, dayOfWeekJ);

    // enable bootstrap tooltip if bootstrap is loaded
    if (typeof $().modal == 'function') {
        $('[data-toggle="tooltip"]').tooltip();
    }

}

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
					$('#' + id + ', [data-alias~=' + id + ']').addClass('is-invalid');
					$('<div class="invalid-feedback">' + d.errors[id][0] + '</div>').insertAfter($('#' + id + ', [data-alias~=' + id + ']'));
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