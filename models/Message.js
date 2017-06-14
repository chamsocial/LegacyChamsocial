'use strict';

const db = require('../lib/db');
const async = require('async');
const Base = require('./Base');

class Message extends Base {

  constructor(data) {
    super(data);

    this.schema = {
      thread_id: { numericality: true },
      user_id: { presence: true, numericality: true },
      subject: { presence: true }, // if no id
      message: { presence: true },
      users: {}
    };

  }


  /**
   * Create a new thread and message or add a message to a thread
   *
   * @param  {Function} callback The Callback
   * @return {void}              callback(Model)
   */
  _create(callback) {

    let Model = this;
    let serie = [];

    // Verify Recipients
    if (
      !this.get('thread_id') &&
      (!this.get('users') || !this.get('users').length)) {
      return callback(new Error('No recipients set'));
    }

    // If there is no thread_id create a new thread
    if (!this.get('thread_id')) {
      serie = [
        function (next) {
          Model.createThread(next);
        },
        function (next) {
          Model.subscribeUsers(next);
        }
      ];
    } else {
      serie = [
        function (next) {
          Model.verifyUser(next);
        }
      ];
    }

    // Create the message
    serie.push(function (next) {
      Model.createMessage(next);
    });

    // Do all creation actions
    async.series(serie, function (err) {
      if (err) return callback(err);

      Message.seen(Model.get('thread_id'), Model.get('user_id'), function () {});

      callback(null, Model);
    });

  }



  /**
   * Verify that the user has rights to the thread
   *
   * @param  {Function} cb The Callback
   * @return {void}
   */
  verifyUser(cb) {
    let SQL = 'SELECT thread_id FROM ?? WHERE thread_id = ? AND user_id = ?';
    let data = [
      Message.table_subscribers,
      this.get('thread_id'),
      this.get('user_id')
    ];
    db.query(SQL, data, function (err, users) {
      if (err) return cb(err);
      if (!users.length) return cb(new Error('User not in conversation'));
      return cb();
    });
  }



  /**
   * Create a new message thread
   *
   * @param  {Function} cb The Callback
   * @return {void}
   */
  createThread(cb) {

    let Model = this;

    db.query(
        'INSERT INTO ?? SET ?',
        [ Message.table_thread, { subject: this.get('subject') } ],
        function (err, result) {
      if (err) return cb(err);

      // Set the thread id for use later
      Model.set('thread_id', result.insertId);

      return cb();
    });
  }



  /**
   * Subscribe users to the thread
   *
   * @param  {Function} cb The callback
   * @return {void}
   */
  subscribeUsers(cb) {

    let Model = this;
    let users = this.get('users').map(function (value) {
      return [ Model.get('thread_id'), value.id ];
    });

    // Add the owner as well
    users.push([ Model.get('thread_id'), Model.get('user_id') ]);

    let SQL = 'INSERT INTO ?? (thread_id, user_id) VALUES ?';
    db.query(SQL, [ Message.table_subscribers, users ], function (err) {
      if (err) return cb(err);
      return cb();
    });
  }



  /**
   * Create the message
   *
   * @param  {Function} cb The callback
   * @return {void}
   */
  createMessage(cb) {

    let Model = this;
    let message = {
      thread_id: this.get('thread_id'),
      message: this.get('message'),
      user_id: this.get('user_id')
    };

    let SQL = 'INSERT INTO ?? SET ?';
    db.query(SQL, [ Message.table, message ], function (err, result) {
      if (err) return cb(err);

      Model.set('id', result.insertId);
      return cb();
    });
  }

}



/*==================================================*\

  Variables

\*==================================================*/
Message.table = 'messages';
Message.table_thread = 'messages_thread';
Message.table_subscribers = 'messages_subscribers';


/*==================================================*\

  Static Methods

\*==================================================*/

/**
 * Get a thread
 *
 * WILL UPDATE SEEN DATE
 *
 * @param  {Integer}   thread_id The thread ID
 * @param  {Integer}   user_id   The user ID
 * @param  {Function} cb         The callback
 * @return {void}                A message object
 */
Message.find = function (thread_id, user_id, cb) {

  let m_fields = 'm.id, m.created_at, m.message, m.thread_id';
  let SQL = `
    SELECT ${m_fields}, t.subject, users.id AS user_id, users.username, s.seen
    FROM messages AS m
    JOIN messages_thread AS t ON m.thread_id = t.id
    JOIN messages_subscribers AS s ON t.id = s.thread_id
    JOIN users ON users.id = m.user_id
    WHERE t.id = ?
    AND s.user_id = ?
    AND deleted_at IS NULL
  `;

  db.query(SQL, [thread_id, user_id], function (err, messages) {
    if (err) return cb(err);

    // If none was found
    if (messages.length === 0) return cb(new Error('No messages found'));

    Message.seen(thread_id, user_id, function (err) {
      if (err) return cb(err);

      return cb(null, messages);
    });
  });
};

Message.findById = function (thread_id, cb) {
  let m_fields = 'm.id, m.created_at, m.message, m.thread_id, m.user_id';
  let SQL = `
    SELECT ${m_fields}, t.subject
    FROM messages AS m
    JOIN messages_thread AS t ON m.thread_id = t.id
    JOIN messages_subscribers AS s ON t.id = s.thread_id
    WHERE t.id = ?
    AND deleted_at IS NULL
  `;
  db.query(SQL, [thread_id], function (err, messages) {
    if (err) return cb(err);
    if (messages.length === 0) return cb(new Error('No thread found'));
    cb(null, new Message(messages[0]));
  });
};


/**
 * Update the seen
 *
 * @param  {Integer}  thread_id The thread id
 * @param  {Integer}  user_id   The user id
 * @param  {Function} cb        The callback
 * @return {void}
 */
Message.seen = function (thread_id, user_id, cb) {
  let SQL = `
    UPDATE ?? SET seen = CURRENT_TIMESTAMP
    WHERE thread_id = ?
    AND user_id = ?
  `;
  let data = [Message.table_subscribers, thread_id, user_id];
  db.query(SQL, data, function (err) {
    return cb(err);
  });
};



/**
 * Get the count of unread Private Messages
 *
 * @param  {Integer}   user_id The user ID
 * @param  {Function} cb      The callback
 * @return {void}
 */
Message.unseenCount = function (user_id, cb) {
  const sql = `
    SELECT COUNT(DISTINCT(m.thread_id)) AS count FROM ?? AS m
    JOIN ?? AS ms ON ms.thread_id = m.thread_id
    WHERE ms.user_id = ?
    AND m.created_at > ms.seen
  `;
  let data = [ Message.table, Message.table_subscribers, user_id ];
  db.query(sql, data, function (err, result) {
    if (err) return cb(err);
    cb(null, result.pop().count);
  });
};


/**
 * Get all messages beloging to a User
 *
 * @param  {Object}   args     Arguments to the query (offset, limit, order)
 * @param  {Integer}   user_id  The user id
 * @param  {Function} callback The callback
 * @return {void}
 */
Message.getAll = function getAll(args, user_id, cb) {

  // A user id is required
  if (!user_id) return cb(new Error('User required'));

  const opt = {
    offset: args.offset || 0,
    limit: args.limit || 50,
    order: (args.order === 'asc') ? 'ASC' : 'DESC'
  };

  // Set offset based on page number and limit
  if (args.page && args.page > 1) {
    opt.offset = ( opt.limit * ( args.page - 1 ) );
  }

  const sql = `
    SELECT t.id, t.subject, m.created_at, s.seen
    FROM messages_thread AS t
    JOIN messages AS m ON m.thread_id = t.id
    JOIN messages_subscribers AS s ON s.thread_id = t.id
    WHERE s.user_id = ?
    AND m.created_at = (SELECT MAX(created_at) FROM messages WHERE thread_id = t.id)
    ORDER BY m.created_at ${opt.order}
    LIMIT ?
    OFFSET ?
  `;

  db.query(sql, [ user_id, opt.limit, opt.offset ], function (err, messages) {
    cb(err, messages);
  });
};


/**
 * Get all users and threads
 *
 * @param  {Array}    thread_ids An array with thread IDs
 * @param  {Function} cb         The callback
 * @return {void}
 */
Message.getSubscribers = function (thread_ids, cb) {
  const sql = `
    SELECT ms.thread_id, users.lang, users.username, users.id AS user_id
    FROM messages_subscribers AS ms
    JOIN users ON users.id = ms.user_id
    WHERE ms.thread_id IN (?)
  `;
  db.query(sql, [thread_ids], function (err, data) {
    cb(err, data);
  });
};

Message.getSubscribersByThread = function (thread_id, cb) {
  const sql = `
    SELECT users.*
    FROM messages_subscribers AS ms
    JOIN users ON users.id = ms.user_id
    WHERE ms.thread_id IN (?)
    AND users.bouncing = 0
    ORDER BY users.email_domain, users.email`;
  db.query(sql, [thread_id], cb);
};


Message.findAllInfo = function (message_id, cb) {
  const sql = `
    SELECT * FROM messages AS m
    JOIN messages_thread AS mt ON mt.id = m.thread_id
    WHERE m.id = ?
  `;
  db.query(sql, [message_id], cb);
};


module.exports = Message;
