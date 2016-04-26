'use strict';

var fs = require("fs");
var gulp = require('gulp');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var gutil = require('gulp-util');
var concat = require('gulp-concat');
var del = require('del');
var htmlreplace = require('gulp-html-replace');
var htmlmin = require('gulp-htmlmin');
var template = require('gulp-template');
var inlineSource = require('gulp-inline-source');

// constants
var SRC = './src';
var DIST = './dist';

gulp.task('default', [
    'clean',
    'js',
    'html',
    'xml'
  ], function() {
    //gutil.log('Starting Default...');

    //gutil.log('Finished Default.');
  });


gulp.task('clean', [],
  function () {
    return del([
      'dist/**/*'
    ]);
  });


gulp.task('js', [
    'clean'
  ],
  function () {
    // set up the browserify instance on a task basis
    // var b = browserify({
    //   entries: SRC + '/scripts/main.js',
    //   debug: true
    // });

    // return b.bundle()
    //   .pipe(source('main.js'))
    //   .pipe(buffer())
    //   .pipe(sourcemaps.init({loadMaps: true}))
    //   // Add transformation tasks to the pipeline here.
    //   .pipe(uglify())
    //   .on('error', gutil.log)
    //   .pipe(sourcemaps.write('./'))
    //   .pipe(gulp.dest(DIST + '/scripts/'));

    return gulp.src(SRC + '/scripts/**/*')
      .pipe(uglify())
      .pipe(gulp.dest(DIST));
  });


gulp.task('html', [
    'js'
  ], function () {
    return gulp.src(SRC + '/app.html')
      .pipe(inlineSource({}))
      .pipe(htmlmin({collapseWhitespace: true}))
      .pipe(gulp.dest(DIST));
  });


gulp.task('xml', [
    'html'
  ], function () {
    var appHtml = fs.readFileSync(DIST + '/app.html', 'utf8');

    return gulp.src(SRC + '/app.xml')
      .pipe(template({
        'app_html': appHtml
      }))
      .pipe(gulp.dest(DIST));
  });

