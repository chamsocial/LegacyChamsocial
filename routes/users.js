/**
 * Users route
 *
 * /users
 */
'use strict';
const pug = require('pug');
const path = require('path');

var middleware = require('./middleware'),
    User = require('../models/User'),
    Post = require('../models/Post'),
    sendMail = require('../lib/send_mail');

const mailgun = require('../lib/mailgun');

module.exports = function (express) {
  const router = express.Router(); // eslint-disable-line new-cap

  /*==================================================*\

    GET - Auth

  \*==================================================*/


  /**
   * Get a users all email subscriptions
   *
   * @return {Object} An array with the subscriptions { data: [{ group_id, type }] }
   */
  router.get('/subscriptions', middleware.isAuthorized, function (req, res, next) {
    User.getSubscriptions(req.user, function (err, data) {
      if (err) return next(err);
      res.json({ data: data });
    });
  });



  /*==================================================*\

    GET - Public

  \*==================================================*/


  /*
  /* Get all timezones in the world
  /*————————————————————————–————————————————————————–*/
  router.get('/timezones', function (req, res) {
    const zones = require('../utils/timezones');
    res.json({ zones });
  });


  /*
  /* Get a user by slug
  /*————————————————————————–————————————————————————–*/
  router.get('/:slug', function (req, res, next) {
    User.findBySlug(req.params.slug, function (err, user) {
      if (err) return next(new Error('Not found'));

      res.json({ users: user.toJson() });
    });
  });


  /*
  /* Get the user posts
  /*————————————————————————–————————————————————————–*/
  router.get('/:slug/posts', function (req, res, next) {
    User.findBySlug(req.params.slug, function (err, user) {
      if (err) return next(err);

      // @todo use Post.find with username instead
      // Get the users posts
      Post.findUserPosts(user.get('id'), function (err, posts) {
        if (err) return next(err);

        // Return the results
        res.json({ posts: posts });
      });
    });
  });


  /*
  /* Check username/email unique
  /*————————————————————————–————————————————————————–*/
  router.post('/check/:field', function (req, res, next) {

    // Make sure that the field is username or email
    if (req.params.field !== 'username' && req.params.field !== 'email') {
      return next(new Error('Params missing'));
    }

    let func = (req.params.field === 'username') ? 'findByUsername' : 'findByEmail';

    User[func](req.body.input, function (err) {
      if (err && err.message !== 'No user found') return next(err);

      // Turn the error into a bool
      const isUnique = !!err;
      return res.json({ isUnique: isUnique });
    });
  });



  /*==================================================*\

    POST|PUT - Public

  \*==================================================*/


  /*
  /* Create new user
  /*————————————————————————–————————————————————————–*/
  router.post('/', function (req, res, next) {

    var newUser = new User(req.body);
    newUser.ip = req.ip; //req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    newUser.save(function (err, user, activationCode) {
      if (err) return next(err);

      const lang = user.get('lang') || 'en';
      const url = `${process.env.HOME_URL}/${lang}/users/activate/${activationCode}`;
      const username = user.get('username');

      // Send an activation email
      const data = {
        from: 'Chamsocial <activation@noreply.chamsocial.com>',
        to: user.get('email'),
        subject: 'Activate account - Chamsocial',
        text: `
          Welcome to Chamsocial, ${username}

          Your Chamsocial signup is almost complete.

          Please visit the link to activate your account:
          ${url}
        `,
        html: pug.renderFile(path.join(__dirname, '../views', 'emails/activation.pug'), { username, url })
      };

      mailgun.messages().send(data, function (error) {
        let mailErrors;
        if (error) {
          console.error('Mailgin error:', error);
          mailErrors = 'Acount created but failed to send activation email please contact chamsocial@theskilocker.com';
        }
        // Woohoo user created
        sendMail.send('activation', { user: user._data, code: activationCode });
        res.status(201).json({ users: user.toJson(), mailErrors });
      });

    });
  });


  /*
  /* Search for a user by username
  /*————————————————————————–————————————————————————–*/
  router.post('/search', middleware.jwt_check, function (req, res) {
    // add the current user to exclude from search
    if (req.user.id) {
      req.body.user_id = req.user.id; // eslint-disable-line camelcase
    }

    User.search(req.body, function (err, users) {
      if (err || users.length === 0) {
        return res.status(404).json({ error: 'No user found or an error occured' });
      }

      return res.json({ users: users });
    });
  });



  /*==================================================*\

    POST|PUT Auth

  \*==================================================*/


  /*
  /* Update a users subscriptions
  /*————————————————————————–————————————————————————–*/
  router.put('/subscriptions', middleware.isAuthorized, function (req, res, next) {
    if (!req.body || !Array.isArray(req.body)) return next(new Error('No body.'));

    User.setSubscriptions(req.user, req.body, function (err) {
      if (err) return next(err);
      res.status(204).send();
    });
  });


  /*
  /* Update the user
  /*————————————————————————–————————————————————————–*/
  router.put('/:id', middleware.isAuthorized, function (req, res, next) {

    User.findById(req.params.id, function (err, user) {
      if (err) return next(err);

      user.update(req.body, function (err) {
        if (err) return next(err);

        res.status(200).send();
      });
    });
  });

  return router;
};
