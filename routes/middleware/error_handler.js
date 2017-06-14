'use strict';

const error = require('../../lib/error');
const logger = require('../../lib/logger');

module.exports = function (err, req, res, next) {
  if (err) {

    // Error "thrown" by me
    if (err instanceof error.Client) {
      console.log('Client error: ', err.message);

      // Display json or create if a string
      let response = {};
      if (typeof (err.message) === 'string') {
        response = { error: err.message };
      } else {
        response = err.message;
      }
      return res.status(err.code).json(response);

    // Server errors
    } else if (err instanceof Error) {
      logger.error('CS-Errors "' + req.url + '": \n',
        { err: err, n: '\n', stack: err.stack }
      );
      return res.status(500).json({ error: err.message });

    // Old sting errors
    } else {
      return res.status(400).json({ error: err });
    }
  }
  next();
};
