var
	// package vars
	pkg = require("./package.json");

	//Define Gulp
	gulp = require("gulp");

	// load all plugins in "devDependencies" into the variable $
	$ = require("gulp-load-plugins")({
		pattern: ["*"],
		scope: ["devDependencies"],
		camelize: true,
	});

var banner = [
	"/**",
	" * @project             <%= pkg.name %>",
	" * @description         <%= pkg.description %>",
	" * @url                 <%= pkg.urls.live %>",
	" * @build               " + $.moment().format("llll") + " ET",
	" * @author              <%= pkg.author %>",
	" * @contact             <%= pkg.contact %>",
	" * @copyright           Copyright (c) " + $.moment().format("YYYY") + ", <%= pkg.copyright %>",
	" *",
	" */",
	""
].join("\n");

	onError = function (err) {
		gutil.beep();
		gutil.log(gutil.colors.red(err));
		this.emit('end');
		this.destroy();
	};


/* ==========================================================================
	STYLES
========================================================================== */
gulp.task('styles', function() {
	var processes = [
		$.tailwindcss('tailwind.js'),
		$.autoprefixer(pkg.autoprefixer),
		$.postcssSorting({
			"properties-order": "alphabetical",
		})

	];

	return gulp
		.src(pkg.paths.src.sass+'/**/*.scss')
		//Any Errors
		.pipe($.plumber({
			errorHandler: onError
		}))

		// .pipe(sourcemaps.init({loadMaps: true}))
		.pipe($.sass())
		.pipe($.notify({
			message: "<%= file.relative %> Compiled"
		}))

		.pipe($.postcss(processes))
		.pipe($.notify({
			message: "<%= file.relative %> POST CSS"
		}))

		.pipe($.header(banner, {pkg: pkg}))
		.pipe(gulp.dest(pkg.paths.dist.css))
		.pipe($.postcss(
			[$.cssnano({preset: 'advanced'})]
		))
		 .pipe($.rename({
			suffix: '.min'
		}))
		.pipe($.notify({
			message: "<%= file.relative %> Minified"
		}))
		// .pipe(sourcemaps.write('./'))
		.pipe($.size({gzip: false, showFiles: true, }))
		.pipe($.size({gzip: true, showFiles: true, }))

		.pipe(gulp.dest(pkg.paths.dist.css))

		//Now Pipe into the Live Project
		.pipe($.browserSync.stream());
});




/* ==========================================================================
	SCRIPTS
========================================================================== */
gulp.task('scripts', function() {
		// Concatenate and Minify the main production file
		gulp.src(pkg.paths.src.js+'production.mix.js')

		// //Any Errors
		.pipe($.plumber({
			errorHandler: onError
		}))

		.pipe($.header(banner, {pkg: pkg}))
		.pipe($.include())
		.pipe($.rename('production.js'))
		.pipe(gulp.dest(pkg.paths.dist.js))
		.pipe($.notify({
			message: "JS Concatenated - <%= file.relative %>"
		}))
		.pipe($.uglify())
		.pipe($.rename('production.min.js'))
		.pipe(gulp.dest(pkg.paths.dist.js))
		.pipe($.notify({
			message: "JS Minified - <%= file.relative %>"
		}))

		//Minify ALL JS Files
		gulp.src([pkg.paths.src.js+'/**/*.js', '!'+pkg.paths.src.js+'production.*'])

		.pipe($.changed(pkg.paths.dist.js, {extension: '.min.js'}))

		// //Any Errors
		.pipe($.plumber({
			errorHandler: onError
		}))

		.pipe($.uglify())
		.pipe($.rename({
			suffix: '.min'
		}))
		.pipe(gulp.dest(pkg.paths.dist.js))
		.pipe($.notify({
			message: "JS Minified - <%= file.relative %>"
		}))

		.pipe($.browserSync.stream())
});


/* ==========================================================================
	IMAGES
========================================================================== */
// gulp.task('images', function() {
// 	// gulp.src(pkg.paths.src.img+'/**/*.+(png|gif|jpg|jpeg)')
// 	// .pipe(imageOptim.optimize())

// 	gulp.src(pkg.paths.src.img+'/*.svg')
// 	.pipe(changed(pkg.paths.dist.img))
// 	.pipe(svgmin())
// 	.pipe(notify({
// 		message: "<%= file.relative %> Optimised"
// 	}))

// 	.pipe(gulp.dest(pkg.paths.dist.img))
// });


/* ==========================================================================
	SVG IMAGES
========================================================================== */
gulp.task('svg', function() {

	gulp.src(pkg.paths.src.svg+'/*.svg')
	// .pipe(changed(pkg.paths.dist.svg))
	.pipe($.svgmin())
	.pipe(gulp.dest(pkg.paths.dist.svg))
	.pipe($.notify({
		message: "<%= file.relative %> Optimised"
	}))
});

/* ==========================================================================
	WATCH
========================================================================== */
gulp.task('watch', function() {
	gulp.watch(pkg.paths.src.sass+'/**/*', ['styles'])
	gulp.watch(pkg.paths.src.js+'/**/*', ['scripts'], $.browserSync.reload);
	gulp.watch(pkg.paths.src.svg+'/**/*', ['svg']).on('change', $.browserSync.reload);
	// gulp.watch(pkg.paths.src.img+'/**/*', ['images']).on('change', browserSync.reload);

	gulp.watch([
			'**/*.+(php|html)'
			// 'craft/templates/**/*.+(php|html|twig)',
		]).on('change', $.browserSync.reload);
});

/* ==========================================================================
	BROWSERSYNC
========================================================================== */
gulp.task('browserSync', function() {
	// Create a new static server
	$.browserSync.init({
		proxy: pkg.urls.local,
		port: 8080,
		notify: false,
		online: true,
		ghostMode: { location: true }
	});
});


/* ==========================================================================
	COMPILE TODO LIST TASKS
========================================================================== */
gulp.task('todo', function() {
	return gulp
		.src([
			pkg.paths.src.js+'/functions.js',
			pkg.paths.src.sass+'/**/*.scss',
			'!cms/core/**/*',
			'!cms/addons/**/*',
			'!vendor/**/*',
			'**/*.+(php|html)'
		])

		.pipe($.todo({
			withInlineFiles: true}
		))

		 //output todo.md as markdown
		.pipe(gulp.dest('./'))
		.pipe(todo.reporter('json', {
			fileName: 'TODO.json',
			withInlineFiles: true
		}))

		 //output todo.json as json
		.pipe(gulp.dest('./'))
});


/* ==========================================================================
	GULP TASKS
========================================================================== */
gulp.task('default', ['styles', 'scripts', 'svg', 'browserSync', 'watch']);
gulp.task('compile', ['styles', 'scripts']);


//TODO: IMAGE OPTIM
//TODO: Delete build file if src file is removed

//TODO: SCRIPTS
// GET ERROR FILENAME IN JS ERRORS

//TO CONSIDER
//Crtical CSS Inline
//UNCSS? Didn;t work very well.





