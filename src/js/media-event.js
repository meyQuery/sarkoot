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
