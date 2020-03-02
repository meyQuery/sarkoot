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