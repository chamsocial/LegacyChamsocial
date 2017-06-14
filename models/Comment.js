'use strict';

const db = require('../lib/db');
const Base = require('./Base');
const Post = require('./Post');
const utils = require('../utils');
const async = require('async');
const send_mail = require('../lib/send_mail');
const moment = require('moment-timezone');
const showdown = require('showdown');
const converter = new showdown.Converter();

class Comment extends Base {

  _create(cb) {
    let Model = this;

    // Save the main post data
    let save_post = function (next) {
      let post = {
        post_id: Model.get('post_id'),
        user_id: Model.get('user_id'),
        made_in: Model.get('made_in') || 'web',
        parent_id: Model.get('parent_id'),
        content: Model.get('content')
      };
      if (Model.get('email_message_id')) {
        post.email_message_id = Model.get('email_message_id');
      }
      return db.query('INSERT INTO ?? SET ? ', [Comment.table, post], next);
    };

    let update_post_count = function (save_info, fields, next) {
      Model.set('id', save_info.insertId);
      Post.updateCommentCount(Model.get('post_id'));
      next();
    };

    // Start the saving steps
    async.waterfall([
      save_post,
      update_post_count
    ], function (err) {
      if (err) return cb(err);

      // All done and well return the id
      return cb(null, Model);
    });
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
   * Generate a single comment
   * @todo better function
   * @return {Object} A comment object
   */
  generateComment() {
    return {
      created_at: moment(),
      id: this.get('id'),
      parent_id: this.get('parent_id'),
      post_id: this.get('post_id'),
      user_id: this._data.user.id,
      user_slug: this._data.user.slug,
      username: this._data.user.username,
      content: this._data.content
    };
  }

}
Comment.table = 'comments';
Comment.fill_data = [ 'id', 'post_id', 'user_id', 'parent_id', 'email_message_id' ];

/**
 * Find a comment and all its languages
 *
 * @param  {Integer}  id       Post id
 * @param  {Function} callback The callback
 * @return {void}
 */
Comment.findInfo = function (id, callback) {
  const fields = [
    'id',
    'created_at',
    'user_id',
    'post_id',
    'parent_id',
    'email_message_id',
    'content'
  ];
  let data = [Comment.table, id];

  let sql = `
    SELECT ${fields.join(', ')} FROM ??
    WHERE id = ?
  `;

  db.query(sql, data, function (err, result) {
    if (err) return callback(err);
    if (!result.length) return callback(new Error('No comment found'));
    let comment = result[0];
    return callback(null, new Comment(comment));
  });
};


/**
 * Get all comments for a post.
 * @param  {Integer}   post_id  The post ID
 * @param  {Function} callback The Callback
 * @return {Object}            A tree with all comments
 */
Comment.getByPost = function getByPost(post_id, callback) {
  let sql = `
    SELECT c.*, users.username, users.slug AS user_slug
    FROM comments AS c
    JOIN users ON users.id = c.user_id
    WHERE c.post_id = ?
    LIMIT 500
  `;
  db.query(sql, [post_id], function (err, comments) {
    if (err) return callback(err);
    if (!comments.length) return callback(null, []);

    comments = comments.map(c => {
      c.content = converter.makeHtml(c.content);
      return c;
    });
    callback(null, utils.makeTree(comments));
  });
};

Comment.findByEmailMessageId = function (message_id, cb) {
  let sql = `
    SELECT id, post_id, email_message_id
    FROM comments
    WHERE email_message_id = ?
  `;
  db.query(sql, [message_id], function (err, comments) {
    if (err) return cb(err);
    return cb(null, comments.pop());
  });
};


/**
 * Get all users who has commented on a post
 *
 * @param  {Integer}  post_id The post ID
 * @param  {Function} cb      The comment
 * @return {void}             Callback list of users
 */
Comment.getAllPostCommenters = function (post_id, cb) {
  let sql = `
    SELECT users.*
    FROM comments
    JOIN users ON users.id = comments.user_id
    WHERE comments.post_id = ?
    AND users.bouncing = 0
    ORDER BY users.email_domain, users.email
  `;
  db.query(sql, [post_id], cb);
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
Comment.trigger_published = (id) => send_mail.send('comment', {id});


module.exports = Comment;
