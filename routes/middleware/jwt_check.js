'use strict';

const jwt = require('jsonwebtoken');
const error = require('../../lib/error');
const redisClient = require('../../lib/redis');


module.exports = function (req, res, next) {
  let token;

  // Get the token from the header
  if (req.headers.authorization) {
    let auth_header = req.headers.authorization.split(' ');
    if (auth_header.length === 2) {
      var scheme = auth_header[0];
      var credentials = auth_header[1];

      // Set the token if scheme is correct
      if (!/^Bearer$/i.test(scheme)) {
return next(error.unauthorized('Invalid scheme'));
}

      token = credentials;
    } else {
      return next(error.unauthorized('Invalid authorization header format'));
    }
  } else {
    return next(error.unauthorized('No authorization header'));
  }

  // Check the token and get the user data if logged in
  jwt.verify(token, process.env.JWT_SECRET, function (err, decoded) {
    if (err) {

      // Return a new public token if the session has expired
      if (err.message === 'jwt expired') {
        let newToken = jwt.sign({}, process.env.JWT_SECRET, {
          expiresIn: process.env.JWT_EXPIRE * 60
        });
        return next(error.unauthorized({ error: 'Token expired', token: newToken }));
      }

      // Prevent further steps
      return next(err);
    }

    // Check redis if the user is still logged in
    if (decoded.id) {

      // Find the token
      redisClient.get(token, function (err, reply) {
        if (err || !reply) return next(error.unauthorized('User has logged out'));
        req.user = decoded;
        next();
      });
    } else {
      req.user = decoded;
      next();
    }
  });
};
