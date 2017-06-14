'use strict';
const pug = require('pug');
const path = require('path');

var errors = require('./errors'),
    auth = require('../lib/auth'),
    jwt_check = require('./middleware/jwt_check'),
    error = require('../lib/error'),
    redisClient = require('../lib/redis'),
    User = require('../models/User'),
    Message = require('../models/Message'),
    sendMail = require('../lib/send_mail');

const mailgun = require('../lib/mailgun');

module.exports = function (express) {
  const router = express.Router(); // eslint-disable-line new-cap

  /*==================================================*\

    GET - Public

  \*==================================================*/


  /**
   * Get the logged in user data
   *
   * @response JSON object of the user or null
   *————————————————————————–————————————————————————–*/
  router.get('/me', jwt_check, function (req, res, next) {
    if (!req.user || !req.user.id) return res.json({ user: null });

    User.me(req.user.id, function (err, user) {
      if (err) return next(err);

      const fields = [
        'id',
        'username',
        'slug',
        'lang',
        'first_name',
        'last_name',
        'timezone',
        'auto_translate'
      ];

      Message.unseenCount(req.user.id, function (err, count) {
        if (err) return next(err);

        let user_data = user.toJsonFields(fields);
        user_data.unread_messages = count;

        let json = { user: user_data };
        return res.json(json);
      });
    });
  });


  /**
   * Logout
   *
   * Remove the token from redis aka logged out
   *
   * @response Success without content
   *————————————————————————–————————————————————————–*/
  router.get('/logout', function (req, res) {
    if (!req.headers.authorization) {
      return res.status(400).json({ error: 'No auth token' });
    }
    let token = req.headers.authorization.split(' ');
    auth.logout(token[1]);
    res.sendStatus(204);
  });


  /**
   * Activate the user by code sent to their email
   *
   * @response User object on activation
   *————————————————————————–————————————————————————–*/
  router.get('/users/activate/:code', function (req, res, next) {
    User.activate(req.params.code, req.ip, function (err, userModel) {
      if (err) return next(err);
      let user = auth.login(userModel);
      return res.json( user );
    });
  });



  /*==================================================*\

    POST - Public

  \*==================================================*/


  /**
   * Login
   *
   * Finds the user in the database and verifiy the password
   * if the password is md5 update it
   *
   * @response json user and token
   *————————————————————————–————————————————————————–*/
  router.post('/login', auth.username_rate_limit, auth.ip_rate_limit, function (req, res, next) {

    let username = req.body.username || false;
    let password = req.body.password || false;

    if (!username || !password) {
      return next(error.unauthorized('You need to provide both username and password'));
    }

    // Find the user
    User.findByUsernameOrEmail(username, function (err, user) {

        // Verify that a user is found
        if (err || !user || !user._data) {
          return next(error.unauthorized('Wrong username or password'));
        }

        // Check that the user is activated
        if (!user.isValid()) {
          return next(error.unauthorized('The account has not been activated yet. If you have not received the email try to reset your password.'));
        }

        // Verify the password
        user.verifyPassword(password, function (err, verified) {
          if (err || !verified) return next(error.unauthorized('Wrong username or password'));

          Message.unseenCount(user._data.id, function (err, count) {
            if (err) return next(err);

            // Generate login token
            var login_data = auth.login(user);
            login_data.user.unread_messages = count;

            // Return the user and token
            res.json(login_data);
          });
        });
      });
  });


  /**
   * Create a reset password email with token
   *
   * @response Success
   *————————————————————————–————————————————————————–*/
  router.post('/forgot-password', function (req, res, next) {

    // If no identifier sent
    if (!req.body.userIdentifier) return res.json(400, { error: 'Missing data' });

    User.findByUsernameOrEmail(req.body.userIdentifier, function (err, user) {
      if (err) return next(err);

      // Get the user id
      var user_id = user.get('id');
      var username = user.get('username');
      let token = auth.forgot_passord_token(user_id);
      const lang = user.get('lang') || 'en';
      var url = `${process.env.HOME_URL}/${lang}/reset-password/${token}/${encodeURIComponent(username)}`;

      // Send an activation email
      const data = {
        from: 'Chamsocial <reset_password@noreply.chamsocial.com>',
        to: user.get('email'),
        subject: 'Reset my password - Chamsocial',
        text: `
          Reset the password for ${username}

          We received a request to reset your password.
          If you didn't request it, please ignore this email.

          Visit the link to reset your password:
          ${url}
        `,
        html: pug.renderFile(path.join(__dirname, '../views', 'emails/reset_password.pug'), { username, url })
      };

      mailgun.messages().send(data, function (error) {
        if (error) {
          console.error('Mailgun reset password error:', error);
          return next(new Error(`Failed to send email to ${user.get('email')}`));
        }
        // Woohoo user created
        sendMail.send('reset_password', { user: user.getAll(), url });
        res.status(201).send('');
      });
    });

  });


  /**
   * Reset and update the users password
   *
   * @response Success and the user
   *————————————————————————–————————————————————————–*/
  router.post('/reset-password', function (req, res) {

    // Verify that the user has submited a valid password
    if (req.body.password && req.body.password.length > 4) {

      // Check the token and get the user data if logged in
      redisClient.get('forgot' + req.body.token, function (err, reply) {
        if (err || !reply) return res.status(401).json(errors('INVALID_RESET_TOKEN'));

        // Find the user
        User.findById(reply, function (err, user) {
          if (err || !user) return res.status(404).json(errors('USER_NOT_FOUND'));

          // Save the new password
          user.upgradePassword(req.body.password, function (err) {
            if (err) return res.status(500).json(errors('COULD_NOT_SAVE'));

            // Delete the reset token when password is changed
            redisClient.del('forgot' + req.body.token);

            // login and return the data
            res.json(auth.login(user));
          });
        });
      });

    } else {
      return res.status(400).json(errors('INVALID_PASSWORD'));
    }
  });


  /**
   * The easter bunny
   */
  router.get('/coffee', function (req, res) {
    res.send(418, ';)');
  });

  return router;
};
