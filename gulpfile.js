var gulp = require('gulp'),
	rimraf = require('rimraf'),
	usemin = require('gulp-usemin'),
	imagemin = require('gulp-imagemin'),
	refresh = require('gulp-livereload'),
	gutil = require('gulp-util'),
	jshint = require('gulp-jshint'),
	express = require('express'),
	lr = require('tiny-lr'),
	open = require('open'),
	server = lr();

var src = {
	folder:'./src',
	js:'src/assets/js/**',
	css:'src/assets/css/**',
	img:'src/assets/img/**',
	data:'src/assets/data/**',
	index:'src/index.html'
};

var dest = {
	folder:'./dist',
	js:'dist/assets/js',
	css:'dist/assets/css',
	img:'dist/assets/img',
	data:'dist/assets/data'
};

// start a dev server
gulp.task('server', function() {
	var app = express();
	app.use(express.static(src.folder));
	app.use('/bower_components', express.static(__dirname + '/bower_components'));
	app.use(express.bodyParser());
    app.listen(8080, function() {
		gutil.log('Listening on 8080');
	});
});

gulp.task('open', function() {
	open('http://localhost:8080/');
});

// copy json data
gulp.task('data', function() {
	gulp.src(src.data)
		.pipe(gulp.dest(dest.data))
		.pipe(refresh(server));
});

// minify css, js, html
gulp.task('usemin', function(){
	gulp.src(src.index)
		.pipe(usemin())
		.pipe(gulp.dest(dest.folder))
		.pipe(refresh(server));
});

// minify images
gulp.task('img', function() {
	gulp.src(src.img)
		.pipe(imagemin())
		.pipe(gulp.dest(dest.img))
		.pipe(refresh(server));
});

// livereload server
gulp.task('livereload', function(){  
	server.listen(35729, function(err){
		if(err) return gutil.log(gutil.colors.bold.red(err));
	});
});

// jshint
gulp.task('lint', function() {
	gulp.src(src.js)
		.pipe(jshint())
		.pipe(jshint.reporter('default'));
});

// default task
gulp.task('default', function() {
	rimraf(dest.folder, function() {
		gulp.run('server', 'livereload', 'open', 'data', 'img', 'usemin');
	});

	gulp.watch(src.data, function() {
		gulp.run('data');
	});
	gulp.watch([src.js, src.css, src.index], function() {
		gulp.run('usemin');
	});
	gulp.watch(src.img, function() {
		gulp.run('img');
	});
});