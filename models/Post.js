'use strict';

const db = require('../lib/db');
const async = require('async');
const Base = require('./Base');
const slug = require('slug');
const send_mail = require('../lib/send_mail');
const moment = require('moment-timezone');
const showdown = require('showdown');

const converter = new showdown.Converter();

class Post extends Base {

  constructor(data) {
    super(data);

    this.schema = {
      user_id: { presence: true, numericality: true },
      group_id: {
        presence: true,
        numericality: { greaterThan: 0 },
        exist: { table: 'groups', column: 'id' }
      },
      title: { presence: true },
      content: { presence: true }
    };

  }

  // Verify that the post is published or the user is the author
  isAuthorized(user) {
    return (
      this.get('status') === 'published' ||
      ( user.id && user.id === this.get('user_id') )
    );
  }

  /**
   * Format the creation date
   * @param {string} format Moment format string
   * @param {string} tz optional Time zone name, e.g. 'Europe/Paris'
   * @returns {string}
   */
  createdAt(format, tz) {
    format = format || 'LLL';
    tz = tz || '';
    let created_at = this.get('created_at');
    if (tz !== '') {
      return moment(created_at).tz(tz).format(format);
    } else {
      return moment(created_at).format(format);
    }
  }


  /**
   * Create a new post
   *
   * @TODO WIP
   *
   * @param  {Function} callback The callback
   * @return {void}              Callback
   */
  _create(callback) {

    let Model = this;

    // Generate a unique slug
    let generate_slug = function (next) {
      let post_slug = slug(Model.get('title'), {lower: true}).substr(0, 240);
      let sql = 'SELECT id FROM ?? WHERE slug = ?';
      db.query(sql, [Post.table, post_slug], function (err, posts) {
        if (err) return next(err);

        // Modify the slug if exist
        if (posts.length) {
          post_slug += '-' + new Date().getTime();
        }
        Model.set('slug', post_slug);
        return next();
      });
    };

    // Save the main post data
    let save_post = function (next) {
      let post = {
        user_id: Model.get('user_id'),
        group_id: Model.get('group_id'),
        slug: Model.get('slug'),
        made_in: Model.get('made_in') || 'web',
        status: Model.get('publish') ? 'published' : 'draft',
        email_message_id: Model.get('email_message_id') || '',
        title: Model.get('title'),
        content: Model.get('content'),
      };
      return db.query('INSERT INTO ?? SET ? ', [Post.table, post], function (err, save_info) {
        if (err) return next(err);
        Model.set('id', save_info.insertId);
        next();
      });
    };

    // Start the saving steps
    async.waterfall([
      generate_slug,
      save_post
    ], function (err) {
      if (err) return callback(err);

      // All done and well return the id
      //TODO return a complete Model here
      return callback(null, Model);
    });

  }

}


/*==================================================*\

  Variables

\*==================================================*/
Post.table = 'posts';


/*==================================================*\

  Static Methods

\*==================================================*/


/**
 * @TODO this method
 *
 * @param  {Integer}  id       The post ID
 * @param  {string}   [lang]   Which language to get (or callback)
 * @param  {Function} callback The callback when done
 * @return {void}
 */
Post.find = function (identifier, value, cb) {

  let fields = [
    'posts.id',
    'posts.created_at',
    'posts.group_id',
    'posts.status',
    'posts.slug',
    'posts.user_id',
    'posts.comments_count',
    'posts.email_message_id',
    'posts.title',
    'posts.content',
    'users.username',
    'users.slug AS user_slug',
    'users.timezone AS user_timezone'
  ];
  let sql = `
    SELECT ${fields.join(', ')} FROM ??
    JOIN users ON posts.user_id = users.id
    WHERE posts.${identifier} = ?
  `;
  db.query(sql, [Post.table, value], function (err, result) {
    if (err) return cb(err);
    if (!result.length) {
      return cb(new Error('No post found by ' + identifier + ' with ' + value));
    }
    let post = result[0];

    post.content = converter.makeHtml(post.content);

    cb(null, new Post(post));
  });
};


/**
 * @TODO this method
 *
 * @param  {Integer}  id       The post ID
 * @param  {string}   [lang]   Which language to get (or callback)
 * @param  {Function} callback The callback when done
 * @return {void}
 */
Post.findBySlug = function (slug, callback) {

  let fields = [
    'posts.id',
    'posts.created_at',
    'posts.group_id',
    'posts.status',
    'posts.slug',
    'posts.user_id',
    'posts.title',
    'posts.content',
    'users.username',
    'users.slug AS user_slug',
    'users.timezone AS user_timezone'
  ];
  let sql = `
    SELECT ${fields.join(', ')} FROM ??
    JOIN users ON posts.user_id = users.id
    WHERE posts.slug = ?
  `;
  db.query(sql, [Post.table, slug], function (err, post) {
    if (err) return callback(err);
    if (!post.length) return callback(new Error('No post found'));
    post = post[0];

    callback(null, new Post(post));
  });
};


/**
 * Does a post with this ID exist?
 * @param {integer} id
 * @param callback
 */
Post.exists = function (id, callback) {
  const sql = `
    SELECT 1 FROM posts
    WHERE posts.id = ?
  `;
  db.query(sql, [id], function (err, post) {
    if (err) return callback(err);
    return callback(null, !!post.length);
  });
};



/**
 * Find a post by a field and value
 *
 * @param  {String}   field The column
 * @param  {String}   value The value to find
 * @param  {Function} cb    The callback
 * @return {Callback}       The post(s)
 */
Post.byField = function (field, value, cb) {
  const sql = 'SELECT * FROM posts WHERE ?? = ?';
  db.query(sql, [field, value], cb);
};



/**
 * Find a post and all its languages
 *
 * @param  {Integer}  id       Post id
 * @param  {Function} callback The callback
 * @return {void}
 */
Post.findInfo = function (id, callback) {
  const fields = [
    'posts.id',
    'posts.created_at',
    'posts.group_id',
    'posts.status',
    'posts.slug',
    'posts.user_id',
    'posts.email_message_id',
    'posts.title',
    'posts.content',
    'users.username'
  ];

  let sql = `
    SELECT ${fields.join(', ')} FROM ??
    JOIN users ON users.id = posts.user_id
    WHERE posts.id = ?
  `;

  db.query(sql, [Post.table, id], function (err, result) {
    if (err) return callback(err);
    if (!result.length) return callback(new Error('No post found'));
    let post = result[0];
    return callback(null, new Post(post));
  });
};



Post.findByEmailMessageId = function (message_id, cb) {
  let sql = `
    SELECT id, email_message_id
    FROM posts
    WHERE email_message_id = ?
  `;
  db.query(sql, [message_id], function (err, post) {
    if (err) return cb(err);
    return cb(null, post.pop());
  });
};


/**
 * Get the latest posts
 *
 * @param  {object}   options  Options (limit, language, page)
 * @param  {Function} callback The callback
 * @return {void}              Send error or an array with post models
 */

Post.getLatest = function (options, callback) {

  // Set options else use defaults
  let opts = {
    limit: ~~(options.limit) || 5,
    as_array: options.as_array || false,
    group: options.group || false,
    search: options.search || false,
    lang: 'en',
    offset: 0
  };

  // Calculate offset
  if (options.page && options.page > 1) {
    opts.offset = opts.limit * (options.page - 1);
  }

  let fields = [
    'p.id',
    'p.created_at',
    'p.slug',
    'p.group_id',
    'p.user_id',
    'p.comments_count',
    'p.title',
    'u.username',
    'u.slug AS user_slug',
    'u.timezone AS user_timezone',
    'gc.title AS group_title',
    'gc.slug AS group_slug'
  ];

  let sql = [
    'SELECT ' + fields + ' FROM ?? AS p',
    'JOIN groups_content AS gc ON gc.group_id = p.group_id',
    'JOIN users AS u ON u.id = p.user_id'
  ];

  sql.push('WHERE p.status = \'published\'');
  sql.push('AND gc.lang = ?');

  if (opts.group) {
    sql.push('AND gc.slug = ' + db.escape(opts.group));
    sql.push('AND gc.group_id = p.group_id');
  }

  if (opts.search) {
    sql.push([
      'AND (',
        'p.title LIKE ' + db.escape('%' + opts.search + '%'),
      'OR',
        'p.content LIKE ' + db.escape('%' + opts.search + '%'),
      ')'
    ].join(' '));
  }

  sql.push('ORDER BY p.created_at DESC LIMIT ? OFFSET ?');

  db.query(sql.join(' '),
    [ this.table, opts.lang, opts.limit, opts.offset ],
    (err, posts) => {
      if (err) return callback(err);
      callback(null, posts);
  });
};



/**
 * Get total number of posts
 *
 * @todo use smarter way to copy previus query
 *
 * @param  {Function} callback The callback
 * @return {void}
 */
Post.getTotalCount = function (opts, callback) {
  let values = [];
  let sql = 'SELECT count(p.id) AS total FROM posts AS p';
  sql += ' WHERE status = \'published\'';
  if (opts.group_id) {
    sql += ' AND group_id = ?';
    values.push(opts.group_id);
  }
  if (opts.search) {
    sql += ` AND (
        p.title LIKE ${ db.escape('%' + opts.search + '%') }
      OR
        p.content LIKE ${ db.escape('%' + opts.search + '%') }
    )`;
  }
  db.query(sql, values, function (err, total) {
    return callback(err, total);
  });
};



/**
 * Update the post comments count
 *
 * @param  {integer}  post_id The post ID
 * @return {void}
 */
Post.updateCommentCount = function (post_id) {
  let sql = `
    UPDATE ?? SET comments_count =
    (SELECT count(*) FROM comments WHERE post_id = ?)
    WHERE id = ?
  `;

  // Update the count and only log an error on fail
  db.query(sql, [Post.table, post_id, post_id], function (err) {
    if (err) console.log(err, err.stack);
  });
};



/**
 * Check if the user owns the post
 *
 * @param  {String}   slug     Post ID
 * @param  {int}      user_id  User ID
 * @param  {Function} callback The callback
 * @return {void}
 */
Post.isOwner = function (slug, user_id, callback) {
  const sql = 'SELECT id FROM posts WHERE slug = ? AND user_id = ?';
  const data = [slug, user_id];
  db.query(sql, data, function (err, post) {
      if (err) return callback(err);

      // Verify that a match was made
      if (post.length === 0) return callback(new Error('That post doesn\'t belong to you'));

      // The post belongs to the user
      callback(null, post[0]);
    });
};



/**
 * Publish a post draft
 *
 * @param  {String}   slug     The post slug
 * @param  {Integer}  user_id  The user id
 * @param  {Function} callback The Callback
 * @return {void}
 */
Post.publish = function (slug, user_id, cb) {
  const sql = `
    UPDATE ?? SET status = 'published'
    WHERE slug = ? AND user_id = ?
  `;
  db.query(sql, [ Post.table, slug, user_id], function (err, result) {
    if (err) return cb(err);

    // If the post id or user id was wrong
    if (!result.affectedRows) return cb(new Error('User or post did not match'));

    db.query('SELECT id FROM ?? WHERE slug = ?', [Post.table, slug], function (err, post) {
      if (err) return cb(err);
      if (!post.length) return cb(new Error('No post found'));

      Post.trigger_published(post[0].id);
      return cb();
    });
  });
};



Post.findUserPosts = function (user_id, callback) {
  var sql = [
    'SELECT p.created_at, p.slug, p.comments_count, p.title FROM posts AS p',
    'WHERE p.user_id = ?',
    'AND p.status = \'published\'',
    'ORDER BY created_at DESC',
    'LIMIT 100'
  ].join(' ');

  db.query(sql, [user_id], callback);
};


/**
 * Trigger the post to be sent by email
 *
 * Will broadcast the post as donw with redis
 * and will send it to all subscribers
 *
 * @param  {Integer} id The post ID
 * @return {void}
 */
Post.trigger_published = (id) => send_mail.send('post', { id });



module.exports = Post;
