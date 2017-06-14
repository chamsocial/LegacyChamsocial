'use strict';
/**
 * Stats routes
 *
 * /stats
 */

const async = require('async');
const db = require('../lib/db');

module.exports = function (express) {
  const router = express.Router(); // eslint-disable-line new-cap

  /*==================================================*\

    GET - Public

  \*==================================================*/



  /**
   * Get some random stats
   *
   * @response stats view
   *————————————————————————–————————————————————————–*/
  router.get('/', function (req, res, next) {
    async.parallel({
      today: async.apply(getPostsToday),
      week: async.apply(getPostsThisWeek)
    }, (err, r) => {
      if (err) return next(err);

      const data = {
        today: {
          count: r.today.length,
          emails: r.today.filter(p => p.made_in === 'email').length
        },
        week: {
          count: r.week.length,
          emails: r.week.filter(p => p.made_in === 'email').length
        }
      };

      res.render('stats/index', data);
    });
  });


  function getPostsToday(cb) {
    const sql = `
      SELECT made_in
      FROM posts
      WHERE DATE(created_at) = DATE(NOW())
      AND status = 'published'
    `;
    db.query(sql, (err, results) => {
      if (err) return cb(err);
      cb(null, results);
    });
  }

  function getPostsThisWeek(cb) {
    const sql = `
      SELECT made_in
      FROM posts
      WHERE WEEKOFYEAR(created_at) = WEEKOFYEAR(NOW())
      AND YEAR(created_at) = YEAR(NOW())
      AND status = 'published'
    `;
    db.query(sql, (err, result) => {
      if (err) return cb(err);
      cb(null, result);
    });
  }

  return router;
};
