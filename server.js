'use strict';
// Path handling functions
const path = require('path');

process.on('uncaughtException', function (exception) {
  console.log(exception); // to see your exception details in the console
  // if you are on production, maybe you can send the exception details to your
  // email as well ?
});

// Load global env variables
require('dotenv').load({ path: path.resolve(__dirname, '../', '.env') });

if (process.env.NODE_ENV === 'production') {
  require('newrelic');
  require('pmx').init({ http: true });
}

const app = require('./app');
const fs = require('fs');
const net = require('net');
const port = process.env.PORT || 5000;

// Shut down nicely when asked
// http://www.oesmith.co.uk/2012/01/08/graceful-shutdown-node-js-express.html
process.on('SIGTERM', function processOnSIGTERM() {
  console.log('Closing chamsocial...');
  app.close();
});


/*==================================================*\

  Start the app

\*==================================================*/


const server = app.listen(port, function () {
  console.log('Express server listening on ' + port);
  // downgrade process user to owner of this file
  return fs.stat(__filename, function (err) {
    if (err) throw err;
    return true;
//    return process.setuid(stats.uid);
  });
});

// From http://bl.ocks.org/visnup/9801864
// port is a UNIX socket file
if (isNaN(parseInt(port))) {
  server.on('listening', function () {
    // set permissions
    return fs.chmod(port, '0777');
  });
  // double-check EADDRINUSE
  server.on('error', function (e) {
    if (e.code !== 'EADDRINUSE') throw e;
    net.connect({path: port}, function () {
      // really in use: re-throw
      throw e;
    }).on('error', function (err) {
      if (err.code !== 'ECONNREFUSED') throw err;
      // not in use: delete it and re-listen
      fs.unlinkSync(port);
      server.listen(port);
    });
  });
}

module.exports = server;
