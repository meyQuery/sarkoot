(function(){
	function jresp(context, res)
	{
		context.trigger('jresp', [res]);
		if(res.message)
		{
			if (toastr)
			{
				var toast = toastr[res.is_ok ? 'success' : 'error'](res.message_text || res.message, undefined, {
					"closeButton": true,
					"newestOnTop": true,
					"positionClass": "toast-bottom-right",
				});
			}
			else if (iziToast)
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