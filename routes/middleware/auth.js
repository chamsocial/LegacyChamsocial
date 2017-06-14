'use strict';
/**
 * Authorization middleware
 *
 * Check that the user is logged in
 */

const jwt_check = require('./jwt_check');

module.exports = {

  // User has to be logged in to post
  isAuthorized: function (req, res, next) {
    jwt_check(req, res, function (err) {
      if (err) return next(err);
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Unauthorized, please log in first.' });
      }
      return next();
    });
  }
};
