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
				iziToast[res.is_ok ? 'success' : 'error']({ message: message});
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