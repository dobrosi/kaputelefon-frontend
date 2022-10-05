var gulp = require('gulp');
var inlinesource = require('gulp-inline-source');
 
gulp.task('inlinesource', function () {
	    return gulp.src('src/*.html')
	        .pipe(inlinesource())
	        .pipe(gulp.dest('target'));
});
