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