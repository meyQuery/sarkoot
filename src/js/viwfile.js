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