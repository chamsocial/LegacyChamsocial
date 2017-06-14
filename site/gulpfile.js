'use strict';

var gulp         = require('gulp'),
    util         = require('gulp-util'),
    notify       = require("gulp-notify"),
    stylus       = require('gulp-stylus'),
    nib          = require('nib'),
    livereload   = require('gulp-livereload'),
    uglify       = require('gulp-uglifyjs'),
    nodemon      = require('gulp-nodemon'),
    ngAnnotate   = require('gulp-ng-annotate'),
    autoprefixer = require('gulp-autoprefixer'),
    sass         = require('gulp-sass'),
    sourcemaps   = require('gulp-sourcemaps'),
    extname      = require('gulp-extname'),
    rename       = require('gulp-rename'),
    cleanCSS     = require('gulp-clean-css')
;


let is_production = !!util.env.production;
gulp.task('set_prod', () => { is_production = true; });

var paths = {
  css: {
    dest: '../public/css',
    maps: './'
  }
};

//http://www.sitepoint.com/simple-gulpy-workflow-sass/
var autoprefixerOptions = {
  browsers: ['last 2 versions', '> 5%', 'Firefox ESR']
};
var sassOptions = {
  errLogToConsole: true,
  outputStyle: (is_production ? 'compressed': 'expanded')
};
gulp.task('sass', function () {
  //Minify just the fontello file
  gulp.src(paths.css.dest + '/fontello.css')
    .pipe(sourcemaps.init())
    .pipe(cleanCSS({compatibility: 'ie8'}))
    .pipe(sourcemaps.write(paths.css.maps))
    .pipe(rename('fontello.min.css'))
    .pipe(gulp.dest(paths.css.dest));
  gulp.src('./sass/**/*.scss')
    .pipe(sourcemaps.init())
    .pipe(sass(sassOptions).on('error', sass.logError))
    .pipe(autoprefixer(autoprefixerOptions))
    .pipe(sourcemaps.write(paths.css.maps))
    .pipe(gulp.dest(paths.css.dest));
});

gulp.task('uglify', function () {
  gulp.src('./js/**/*.js')
    .pipe(ngAnnotate().on('error', notify.onError({
      message: "Error: <%= error.message %>",
      title: "NgAnnotate"
    })))
    .pipe(
      uglify('app.min.js', {
        outSourceMap: true,
        compress: is_production,
        output: { beautify: !is_production }
      }).on('error', notify.onError({
        message: "Error: <%= error.message %>",
        title: "Uglify"
      }))
    )
    .pipe(gulp.dest('../public/js'));
  //angular-elastic doesn't include a minified version, so make one
  //TODO This isn't quite right: if enabled, the map file ends up with the wrong name
  gulp.src('../public/components/angular-elastic/elastic.js')
    .pipe(uglify({
      //outSourceMap: true,
      compress: is_production,
      output: {beautify: !is_production}
    }).on('error', notify.onError({
      message: "Error: <%= error.message %>",
      title: "Uglify"
    })))
    .pipe(extname({ext: '.min.js'}))
    .pipe(gulp.dest('../public/components/angular-elastic'));
});


// Rerun the task when a file changes
gulp.task('watch', function () {

  // Start livereload server
  livereload.listen();

  // Update CSS without page reload
  // gulp.watch('../public/css/stylus/**/*.styl', ['stylus']);
  gulp.watch('./sass/**/**.scss', ['sass']);

  // Minify Javascript
  gulp.watch('./js/**/*.js', ['uglify']);

  // Reload page on view change (pug files)
  gulp.watch('../views/**/*.pug').on('change', livereload.changed);
});


// The default task (called when you run `gulp` from cli)
gulp.task('default', ['uglify', 'sass']);
gulp.task('build-watch', ['uglify', 'sass', 'watch']);

gulp.task('prod', ['set_prod', 'sass', 'uglify']);
