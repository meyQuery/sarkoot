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