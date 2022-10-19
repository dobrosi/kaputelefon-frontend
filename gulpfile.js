var gulp = require('gulp');
var inlinesource = require('gulp-inline-source');
var inlineFonts = require('gulp-inline-fonts');

gulp.task('icons', function() {
    return gulp.src(['src/font/*'])
        .pipe(inlineFonts({ name: 'Font Awesome 6 Free' }))
        .pipe(gulp.dest('target/font'));
});

gulp.task('inlinesource', function () {
	    return gulp.src('src/*.html')
	        .pipe(inlinesource())
	        .pipe(gulp.dest('target'));
});
