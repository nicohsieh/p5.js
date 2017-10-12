
const gulp = require('gulp');
const browserify = require('browserify');

const uglify = require('gulp-uglify');
//const uglifyes = require('uglify-es');
//const composer = require('gulp-uglify/composer');
//const uglify = composer(uglifyes, console);
const rename = require('gulp-rename');
const sourcemaps = require('gulp-sourcemaps');

const source = require('vinyl-source-stream');
const derequire = require('gulp-derequire');

const header = require('gulp-header');
const dateFormat = require('dateformat');
const pkg = require("./package.json");

const requirejs = require('gulp-requirejs');


let addHeader = () => header('/*! p5.js v' + pkg.version + ' ' + dateFormat("mmmm dd, yyyy") + ' */\n');

gulp.task('browserify', () =>
	browserify('./src/app.js', {
		standalone: 'p5'
	})
		.bundle()
		.pipe(source('p5.js'))
		.pipe(derequire())
		.pipe(addHeader())
		.pipe(gulp.dest('lib'))
);

gulp.task('uglify', ['browserify'], () =>
	gulp.src(['lib/p5.js', 'lib/addons/p5.dom.js'], { base: '.' })
		.pipe(sourcemaps.init({ loadMaps: true })) // initialize gulp-sourcemaps with the existing map
		.pipe(uglify({
			compress: {
				global_defs: {
					'IS_MINIFIED': true
				},
			},
		}))
		.pipe(addHeader())
		.pipe(rename({ suffix: '.min' }))
		.pipe(sourcemaps.write('.')) // write the source maps
		.pipe(gulp.dest('.'))
);

gulp.task('requirejs', () =>
	requirejs({
		baseUrl: './docs/yuidoc-p5-theme-src/scripts/',
		mainConfigFile: './docs/yuidoc-p5-theme-src/scripts/config.js',
		name: 'main',
		out: 'reference.js',
		optimize: 'none',
		generateSourceMaps: true,
		findNestedDependencies: true,
		wrap: true,
		paths: {
			'jquery': 'empty:'
		}
	})
		.pipe(sourcemaps.init({ loadMaps: true })) // initialize gulp-sourcemaps with the existing map
		.pipe(sourcemaps.write('.')) // write the source maps
		.pipe(gulp.dest('./docs/yuidoc-p5-theme/assets/js/'))
	//.pipe('./docs/yuidoc-p5-theme/assets/js/reference.js')
);

gulp.on('err', e => {
	console.log(e.err.stack);
});

// Create the multitasks.
gulp.task('build', ['browserify', 'uglify', 'requirejs']);
gulp.task('test', ['jshint', 'jscs', 'yuidoc:prod', 'build', 'connect', 'mocha', 'mochaTest']);
gulp.task('test:nobuild', ['jshint:test', 'jscs:test', 'connect', 'mocha']);
gulp.task('yui', ['yuidoc:prod', 'minjson']);
gulp.task('yui:test', ['yuidoc:prod', 'connect', 'mocha:yui']);
gulp.task('default', ['test']);
gulp.task('saucetest', ['connect', 'saucelabs-mocha']);