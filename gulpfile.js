'use strict';

var fs = require("fs");
var gulp = require('gulp');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var uglify = require('gulp-uglify');
var jshint = require('gulp-jshint');
var sourcemaps = require('gulp-sourcemaps');
var gutil = require('gulp-util');
var concat = require('gulp-concat');
var del = require('del');
var htmlreplace = require('gulp-html-replace');
var htmlmin = require('gulp-htmlmin');
var template = require('gulp-template');
var inlineSource = require('gulp-inline-source');
var requirejsOptimize = require('gulp-requirejs-optimize');

// constants
var SRC = './src';
var DIST = './dist';

gulp.task('default', [
    'clean',
    'images',
    'styles',
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


gulp.task('images', [
    'clean'
  ],
  function () {
    return gulp.src(SRC + '/images/*')
      .pipe(gulp.dest(DIST + '/images/'));
  });


gulp.task('styles', [
    'clean'
  ],
  function () {
    return gulp.src(SRC + '/styles/*')
      .pipe(gulp.dest(DIST + '/styles/'));
  });



gulp.task('js', [
    'clean'
  ],
  function (done) {

    var 
      lintPromise = new Promise(function (resolve, reject) {
        gulp.src([
          SRC + '/scripts/*.js', 
          '!' + SRC + '/scripts/require.js'
        ])
          .pipe(jshint({
            node: true,
            browser: true,
            camelcase: true,
            curly: true,
            immed: true,
            indent: 2,
            latedef: true,
            newcap: true,
            noarg: true,
            quotmark: "single",
            undef: true,
            unused: 'vars',
            strict: true,
            trailing: true,
            smarttabs: true,
            globals: {
              Promise: true,
              require: true,
              define: true,
              gapi: true
            }
          }))
          .pipe(jshint.reporter('default'))
          .on('end', function () {
            resolve();
          })
          .on('error', function (err) {
            reject(err);
          });
      }),
      mainPromise = new Promise(function (resolve, reject) {
        gulp.src(SRC + '/scripts/main.js')
          .pipe(requirejsOptimize())
          .pipe(gulp.dest(DIST + '/scripts/'))
          .on('end', function () {
            resolve();
          });
      }),
      requirePromise = new Promise(function (resolve, reject) {
        gulp.src(SRC + '/scripts/require.js')
          .pipe(gulp.dest(DIST + '/scripts/'))
          .on('end', function () {
            resolve();
          });
      });

    return lintPromise
      .then(function () {
        return Promise.all([
          mainPromise,
          requirePromise
        ]);
      })
      .then(function () {
        done();
      });

  });


gulp.task('html', [
    'images',
    'styles',
    'js'
  ], function () {
    return gulp.src(SRC + '/app.html')
      .pipe(inlineSource({
        rootpath: DIST,
      }))
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

