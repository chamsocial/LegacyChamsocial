/**
 * Categories
 */
'use strict';

const Group = require('../models/Group');

module.exports = function (express) {
  const router = express.Router(); // eslint-disable-line new-cap

  router.get('/', function (req, res, next) {
    Group.getList(req.query.lang, function (err, groups) {
      if (err) return next(err);
      res.json(groups);
    });
  });

  return router;
};
