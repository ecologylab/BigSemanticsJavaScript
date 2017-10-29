// Build new BigSemantics

var argv = require('yargs').argv;
var gulp = require('gulp');
var typescript = require('gulp-typescript');
var sourcemaps = require('gulp-sourcemaps');
var browserify = require('browserify');
var uglify = require('gulp-uglify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var gutil = require('gulp-util');
var del = require('del');

var env = argv.env || process.env.NODE_ENV || 'dev';
var isDev = env === 'dev';
console.log("Environment (specify with NODE_ENV or --env when calling gulp): " + env);

var tsProject = typescript.createProject('tsconfig.json');

gulp.task('compile', function() {
  var stream = tsProject.src();
  if (isDev) {
    stream = stream.pipe(sourcemaps.init());
  }
  stream = stream.pipe(tsProject());
  if (isDev) {
    stream = stream.pipe(sourcemaps.write());
  }
  return stream.pipe(gulp.dest('build'));
});

gulp.task('bundle', [ 'compile' ], function() {
  var mainFile = 'build/bigsemantics-core.js';
  var bundleFileName = 'bigsemantics-core.bundle.js';

  var stream = browserify({
    entries: mainFile,
    standalone: 'bigsemantics',
    debug: isDev,
  }).transform('babelify', {
    presets: [
      [
        'env',
        {
          targets: {
            browsers: 'last 2 Chrome versions'
          }
        }
      ]
    ],
  }).bundle().pipe(source(bundleFileName)).pipe(buffer());
  if (!isDev) {
    stream = stream.pipe(sourcemaps.init({
      loadMaps: true,
    })).pipe(uglify());
  }
  return stream.on('error', gutil.log).pipe(gulp.dest('build'));
});

gulp.task('clean', function() {
  del.sync(['build']);
});

gulp.task('default', [ 'bundle' ]);
