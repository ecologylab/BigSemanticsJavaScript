// Build new BigSemantics

var gulp = require('gulp');
var del = require('del');
var ts = require('gulp-typescript');
var browserify = require('gulp-browserify');
var rename = require('gulp-rename');

var tsProject = ts.createProject('tsconfig.json');

gulp.task('tsc', function() {
  return tsProject.src().pipe(tsProject()).js.pipe(gulp.dest('build'));
});

gulp.task('browserify', [ 'tsc' ], function() {
  gulp.src('build/index.js').pipe(browserify({
    standalone: 'bigsemantics',
  })).pipe(rename('bigsemantics-core.js')).pipe(gulp.dest('build'));
});

gulp.task('clean', function() {
  del.sync(['build']);
})

gulp.task('default', ['tsc', 'browserify']);
