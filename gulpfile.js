const { src, dest, watch, parallel } = require('gulp');
const sass = require('gulp-sass');
const minifyCSS = require('gulp-csso');
const minify = require('gulp-minify');
const concat = require('gulp-concat');

function css() {
    return src('src/scss/sarkoot.scss')
        .pipe(sass())
        .pipe(minifyCSS())
        .pipe(dest('dist/css'))
}

function js() {
    return src('src/js/**/*.js', {sourcemaps: true})
        .pipe(concat('sarkoot.js'))
        .pipe(minify({
            ext: {
                min: '.min.js'
            },
        }))
        .pipe(dest('dist/js', { sourcemaps: false }))
}

function watchFile() {
    watch('src/scss/**/*.scss', css);
    watch('src/js/**/*.js', js);
}

exports.js = js;
exports.css = css;
exports.watchFile = watchFile;
exports.default = parallel(js, css, watchFile);