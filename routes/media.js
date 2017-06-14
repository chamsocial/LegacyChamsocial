/**
 * Medias route
 *
 * v1/posts
 */
'use strict';

const Media = require('../models/Media');
const auth = require('./middleware/auth');

module.exports = function (express) {
  const router = express.Router(); // eslint-disable-line new-cap


  router.delete('/:id', auth.isAuthorized, function (req, res, next) {

    if (!req.user || !req.user.id) return next(new Error('User invalid'));

    Media.delete(req.params.id, req.user.id, function (err, result) {
      if (err) return next(err);

      // Return the deleted id?
      res.json({ id: result[0].id });
    });
  });


  return router;
};
