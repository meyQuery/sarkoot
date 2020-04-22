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