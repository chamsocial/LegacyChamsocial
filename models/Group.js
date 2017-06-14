'use strict';

const db = require('../lib/db');
const redisClient = require('../lib/redis');
const Base = require('./Base');

class Group extends Base {}
Group.table = 'groups';
Group.table_content = 'groups_content';
Group.table_subscribers = 'groups_users';



/**
 * Fetch all groups by post count
 *
 * @param {string} lang The language code
 * @param  {Function} cb The callback
 * @return {void}        Array with all groups
 */
Group.getList = function (lang, cb) {
  lang = Group.getLanguage(lang);
  const redis_key = 'cs_group_list_' + lang;

  // Try to get from redis cache
  redisClient.get(redis_key, function (err, reply) {

    // return the cache
    if (reply) return cb(null, JSON.parse(reply));

    // Fetch all groups
    let sql = `
      SELECT groups.id, content.title, content.description, content.lang, groups.slug
      FROM groups
      JOIN groups_content
        AS content ON groups.id = content.group_id AND content.lang = ?
      WHERE groups.type = 'open'
      GROUP BY groups.id, title, description, lang, slug;
    `;
    db.query(sql, [lang], function (err, groups) {
      if (err) return cb(err);

      // Fetch post count for each group, including empty ones
      let sql = `
        SELECT groups.id, COUNT(posts.id) AS post_count
        FROM groups
        LEFT JOIN posts ON posts.group_id = groups.id
        WHERE groups.type = 'open'
        GROUP BY groups.id
        ORDER BY post_count DESC;
      `;
      db.query(sql, function (err, counts) {
        if (err) return cb(err);

        const groups_out = groups
          .map(g => {
            g.post_count = counts.find(c => c.id === g.id).post_count;
            return g;
          })
          .sort((a, b) => b.post_count - a.post_count);

        // Set redis cache
        redisClient.set(redis_key, JSON.stringify(groups_out));
        redisClient.expire(redis_key, 60 * 60); // 1h

        return cb(null, groups_out);
      });
    });
  });
};



/**
 * Find a group by ID
 *
 * @param  {int}   id          The ID of the group
 * @param  {Function} callback The callback
 * @return {void}
 */
Group.findById = function (id, callback) {
  var sql = 'SELECT * FROM ?? WHERE group_id = ?';
  db.query(sql, [Group.table_content, id], function (err, group_langs) {
    if (err) return callback(err);
    if (group_langs.length <= 0) return callback(new Error('No group found'));

    // Order by lang
    var group = {};
    group_langs.forEach(function (cat) {
      group[cat.lang] = cat;
    });

    return callback(null, group);

  });
};



/**
 * Find a group by slug
 *
 * @param  {string}   slug     The slug of the group (email user)
 * @param  {Function} callback The callback
 * @return {void}
 */
Group.findBySlug = function (slug, callback) {
  db.query('SELECT * FROM ?? WHERE slug = ?', [Group.table_content, slug], callback);
};



/**
 * Find all users subscribing to the group
 *
 * @param  {int}      group_id The group ID
 * @param  {string}   type        The type to get from direct, daily, weekly
 * @param  {Function} callback    The callback
 * @return {void}
 */
Group.findUsers = function (group_id, type, callback) {
  type = type || 'direct';

  db.query([
    'SELECT users.* FROM users',
    'JOIN ?? AS g_u ON users.id = g_u.user_id',
    'WHERE g_u.group_id = ?',
    'AND g_u.type = ?',
    'AND users.bouncing = 0',
    'ORDER BY users.email_domain, users.email'
  ].join(' '), [Group.table_subscribers, group_id, type], function (err, users) {
    if (err) return callback(err);

    callback(null, users);
  });
};

module.exports = Group;
