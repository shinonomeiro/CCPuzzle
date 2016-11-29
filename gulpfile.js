var uglify = require('gulp-uglify');
var gulp = require('gulp');
var del = require('del');
var webserver = require('gulp-webserver');
var htmlreplace = require('gulp-html-replace');
var jscrush = require('gulp-jscrush');
var concat = require('gulp-concat');
var babel = require('gulp-babel');

gulp.task('clean', () => {
    return del([
        './dist/**/*'
    ]);
});

gulp.task('compile', ['clean'], () => {
    return gulp.src(['./src/**/*.js', './src/main.js'])
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(gulp.dest('./dist'));
});

// Debug build

gulp.task('compress-debug', ['compile'], () => {
    return gulp.src(['./dist/**/*.js'])
        .pipe(concat('game.build.js'))
        /*.pipe(uglify())*/
        .pipe(gulp.dest('./dist'));
});

gulp.task('clean-trash-debug', ['compress-debug'], () => {
    return del([
        './dist/**/*',
        '!./dist/game.build.js'
    ]);
});

gulp.task('default', ['clean-trash-debug'] , () => {
    gulp.src('./').pipe(webserver({
        livereload: {
            enable : true,
            filter: function(fileName) {
                if (fileName.match('node_modules') || fileName.match('dist')) {
                    return false;
                } else {
                    return true;
                }
            }
        },
        host: '0.0.0.0',
        directoryListing: true
    }));

    gulp.watch(['./src/**/*.js', './src/main.js'], ['clean-trash-debug']);
});

// Production build

gulp.task('compress', ['compile'], () => {
    return gulp.src(['./framework/cocos2d-js-v3.10.js', './dist/*'])
        .pipe(concat('game.build.js'))
        .pipe(uglify())
        .pipe(gulp.dest('./dist'));
});

gulp.task('clean-trash', ['compress'], () => {
    return del([
        './dist/**/*',
        '!./dist/game.build.js'
    ]);
});

gulp.task('update-links', ['clean-trash'], () => {
    gulp.src('./index.html')
        .pipe(htmlreplace({
            'js': 'game.build.js'
        }))
        .pipe(gulp.dest('./dist'));
});

gulp.task('copy-resources', ['update-links'], () => {
    return gulp.src(['./res/**/*','./project.json'], {'base' : '.'})
        .pipe(gulp.dest('./dist'));
});

gulp.task('build', ['copy-resources']);

// Optional ($ gulp obfuscate)

gulp.task('obfuscate', () => {
    return gulp.src('./dist/*.js')
        .pipe(jscrush())
        .pipe(gulp.dest('./dist'));
});