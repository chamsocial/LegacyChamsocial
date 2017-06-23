'use strict';

// Set up ===========================================================

// Path handling functions
const path = require('path');

// Initiate the logger
require('./lib/logger');

// Load dependencies
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const favicon = require('serve-favicon');
const compression = require('compression');
const helmet = require('helmet');
const redisClient = require('./lib/redis');
const router = express.Router(); // eslint-disable-line new-cap
const IMGR = require('imgr').IMGR;

const showdown = require('showdown');
const converter = new showdown.Converter({ noHeaderId: true });
const fs = require('fs');

global.indexPath = __dirname;

app.use(favicon(path.join(__dirname, 'public/favicon.ico')));
app.use(helmet.xssFilter());
app.use(helmet.ieNoOpen());
app.use(helmet.hidePoweredBy());
app.use(compression());

const i18n = require('i18n-2');

// Attach the i18n property to the express request object
// And attach helper methods for use in templates
i18n.expressBind(app, {
  // setup some locales - other locales default to en silently
  locales: ['en', 'fr'],
  directory: path.join(__dirname, 'locales'),
  extension: '.json',
  indent: '  ',
  query: false
});


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Access log in dev
if (process.env.NODE_ENV !== 'production') {
  app.use(require('morgan')('dev'));
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// app.use(cookieParser());
app.use(methodOverride());
app.use(express.static(path.join(__dirname, 'public')));
// app.use(function(req,res,next){setTimeout(next,1000)});

// Get user IP by req.ip
app.enable('trust proxy');
// Need to add app.set('trust proxy', 'loopback, 123.123.123.123')

//
app.on('close', function appOnClose() {
  console.log('Closed');
  redisClient.quit();
});





/*==================================================*\

  Middleware

\*==================================================*/

// Generate thumbnails
const imgr = new IMGR({
  namespace: '/img',
  cache_dir: path.join(__dirname, 'cache/images'), // eslint-disable-line camelcase
  url_rewrite: '/:path/:size/:file.:ext', // eslint-disable-line camelcase
  debug: false,
  try_content: false, // eslint-disable-line camelcase
  try_cache: true, // eslint-disable-line camelcase
  gm_quality: 80 // eslint-disable-line camelcase
});
imgr.serve(path.join(__dirname, 'public/uploads')).using(app);


/*==================================================*\

  Routes

\*==================================================*/

app.use('/stats', require('./routes/stats')(express));

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Authorization, Origin, X-Requested-With, Content-Type, Accept");
  if (req.method === 'OPTIONS') {
    return res.end()
  }
  next();
});

// Signup / Login
app.use('/v1', require('./routes/auth')(express));
app.use('/v1/posts', require('./routes/posts')(express));
app.use('/v1/media', require('./routes/media')(express));
app.use('/v1/comments', require('./routes/comments')(express));
app.use('/v1/groups', require('./routes/groups')(express));
app.use('/v1/users', require('./routes/users')(express));
app.use('/v1/messages', require('./routes/messages')(express));

// Set the error handler
app.use(require('./routes/middleware/error_handler'));

// Handle all none existion API calls
app.use(router.all('/v1/*', function api404(req, res) {
  res.status(404).json({ error: 'API endpoint not found' });
}));


app.use('/', router.get('/changelog', function (req, res) {
  fs.readFile(path.join(__dirname, '/changelog.md'), 'utf8', (err, data) => {
    return res.send(converter.makeHtml(data));
  });
}));

app.use(function (req, res, next) {
  let lang = req.params.lang || req.query.lang || req.headers['x-lang'] || 'en';
  if (req.url.slice(0, 3) === '/fr') lang = 'fr';
  req.i18n.setLocale(lang);
  next();
});


app.use('/', require('./routes/site')(express));

/// catch 404 and forward to error handler
app.use(function web404(req, res, next) {
  let err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// @todo ? is this ever reached?
// production error handler
// no stacktraces leaked to user
app.use(function logAndReturnErrors(err, req, res) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});



module.exports = app;
