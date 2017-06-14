'use strict';


const winston = require('winston');
const path = require('path');
require('winston-loggly');


winston.add(winston.transports.File, {
  level: 'info',
  filename: path.resolve(__dirname, '../logs/all-logs.log'),
  handleExceptions: true,
  json: true,
  prettyPrint: true,
  maxsize: 10485760, //10MB
  maxFiles: 100,
  colorize: false
});
  // new (winston.transports.Console)({
  //   level: 'debug',
  //   handleExceptions: true,
  //   json: false,
  //   humanReadableUnhandledException: true,
  //   colorize: true
  // })

if (process.env.NODE_ENV === 'production' && process.env.LOGGLY_TOKEN) {
  winston.add(winston.transports.Loggly, {
    inputToken: process.env.LOGGLY_TOKEN,
    subdomain: 'chamsocial',
    tags: ['Cham-NodeJS'],
    json: true
  });
}

//winston.log('info',"Hello World from Node.js!");

module.exports = winston;
