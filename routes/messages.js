'use strict';

var moment = require('moment-timezone'),
    async = require('async'),
    send_mail = require('../lib/send_mail'),
    Message = require('../models/Message'),
    middleware = require('./middleware');

module.exports = function (express) {
  const router = express.Router(); // eslint-disable-line new-cap

  // Require user to be logged in for any of these routes
  router.use(middleware.isAuthorized);


  /*==================================================*\

    GET - Auth

  \*==================================================*/


  /**
   * Get all the users message threads

   * @response {json} An array with messages
   */
  router.get('/', function (req, res, next) {
    Message.getAll(req.params, req.user.id, function (err, messages) {
      if (err) return next(err);
      if (!messages.length) return res.json({ messages: [] });

      // get all the thread id's as an array
      let thread_ids = messages.map((m) => m.id );

      // Get all users in the threads
      Message.getSubscribers(thread_ids, function (err, users) {
        if (err) return next(err);

        // Add an array with all the users
        let output = messages.map((m) => {
          m.users = [];
          for (let i = 0; i < users.length; i++) {
            if (m.id === users[i].thread_id && users[i].user_id !== req.user.id) {
              m.users.push({ username: users[i].username });
            }
          }
          return m;
        });

        res.json({ messages: output });
      });
    });
  });


  /**
   * Get a message thread
   *
   * @response {json} All messages in the thread and other meta data
   */
  router.get('/:id', function (req, res, next) {

    Message.find(req.params.id, req.user.id, function (err, messages) {
      if (err) return next(err);

      let seen = messages[0].seen;
      let subject = messages[0].subject;
      let user_id = messages[0].user_id;
      Message.getSubscribers([req.params.id], function (err, users) {
        if (err) return next(err);

        users = users
          .filter((u) => (u.user_id !== user_id))
          .map((u) => u.username);
        messages = messages.map(function (message) {
          delete message.thread_id;
          delete message.seen;
          delete message.subject;
          return message;
        });

        res.json({ messages: messages, meta: { seen, subject, users } });
      });
    });
  });



  /*==================================================*\

    POST - Auth

  \*==================================================*/



  /**
   * Create a new message thread
   *
   * @response {json} The tread ID
   */
  router.post('/', function (req, res, next) {

    let data = req.body;
    data.user_id = req.user.id;

    var message = new Message(data);
    message.save(function (err, thread) {
      if (err) return next(err);

      // Send an email to all the users
      send_mail.send('new_pm', { message_id: thread.get('id') });

      return res.status(201).json({ messages: { message_id: thread.get('thread_id') } });
    });
  });


  /**
   * Create a new message in an existion thread
   *
   * @response {json} The new message
   */
  router.post('/:id', function (req, res, next) {

    // If no message was sent
    if (!req.body.message) return next(new Error('No message'));

    let data = {
      thread_id: req.params.id,
      message: req.body.message,
      user_id: req.user.id
    };

    let message_model = new Message(data);
    message_model.save(function (err, message) {
      if (err) return next(err);

      message.set('user_id', req.user.id);
      message.set('username', req.user.username);
      message.set('created_at', moment().toISOString());

      let json = { message: message.toJson() };

      async.parallel({
        subscriptions: async.apply(Message.getSubscribers, [message.get('thread_id')]),
        thread: async.apply(Message.findById, message.get('thread_id'))
      }, function (err, result) {
        if (err) {
          console.error('PM get subscribers: ', err);
          json.error = 'An error occured, no notification email were sent.';
        } else {

          message.set('subject', result.thread.get('subject'));

          // Send an email to all the users
          send_mail.send('new_pm', { message_id: message.get('id') });
        }
        res.status(200).json(json);
      });
    });
  });

  return router;
};
