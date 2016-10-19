// Build new BigSemantics

var gulp = require('gulp');
var ts = require('gulp-typescript');
var browserify = require('gulp-browserify');
var rename = require('gulp-rename');

var tsProject = ts.createProject('tsconfig.json');

gulp.task('tsc', function() {
  return tsProject.src().pipe(tsProject()).js.pipe(gulp.dest('build'));
});

gulp.task('browserify', [ 'tsc' ], function() {
  gulp.src('build/core/index.js').pipe(browserify({
    standalone: 'bigsemantics',
  })).pipe(rename('bigsemantics-core.js')).pipe(gulp.dest('browserified'));
});

gulp.task('default', ['tsc', 'browserify']);
