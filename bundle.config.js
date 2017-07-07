var lazypipe = require('lazypipe');
var babel = require('gulp-babel');
var plumber = require('gulp-plumber');

var transformPipe = lazypipe()
  .pipe(babel, {presets: ['es2015']})
  .pipe(plumber);

module.exports = {
  bundle: {
    main: {
      scripts: './app/assets/scripts/main.js',
      options: {
        useMin: ['staging', 'production'],
        uglify: ['staging', 'production'],
        transforms: {
          scripts: transformPipe
        }
      }
    },
    vendor: {
      scripts: './app/assets/scripts/vendor/*.js',
      options: {
        useMin: ['staging', 'production'],
        uglify: ['staging', 'production']
      }
    }
  }
};
