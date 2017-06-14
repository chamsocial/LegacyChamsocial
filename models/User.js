'use strict';

const db = require('../lib/db');
const async = require('async');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const slug = require('slug');
const Base = require('./Base');

class User extends Base {

  constructor(data) {
    super(data);

    this.schema = {
      username: { unique: { table: 'users', column: 'username' }, presence: true, length: { minimum: 3, maximum: 60 }, format: /A-Za-z0-9 _\.-/ },
      email: { presence: true, length: { minimum: 6 }, email: true, unique: { table: 'users', column: 'email' } },
      email_domain: {},
      password: { presence: true, length: { minimum: 6 } },
      first_name: {},
      last_name: {},
      slug: {},
      company_name: {},
      is_company: {},
      location: {},
      interests: { },
      aboutme: { },
      jobtitle: {},
      lang: { inclusion: ['en', 'fr'] },
      auto_translate: {}
    };
    this.output = [
      'id',
      'username',
      'slug',
      'lang',
      'first_name',
      'last_name',
      'created_at',
      'company_name',
      'location',
      'interests',
      'aboutme',
      'jobtitle'
    ];

    this.data_fields = [ 'id', 'username', 'lang', 'is_company', 'first_name', 'last_name', 'slug', 'auto_translate', 'avatarpath', 'company_name', 'location', 'interests', 'aboutme', 'jobtitle' ];

  }

  /**
   * Save
   *
   * @param  {Function} callback
   */
  _create(callback) {

    var userModel = this;

    async.series({
      // Validate require correct this
      password: async.apply(bcrypt.hash, userModel._data.password, 11),
      randomBytes: async.apply(crypto.randomBytes, 42),
      userSlug: function (next) {
        let user_slug = slug(userModel._data.username, {lower: true}).substr(0, 240);
        User.getUniqueSlug(user_slug, function (err, slug) {
          if (err) return next(err);
          userModel._data.slug = slug;
          return next();
        });
      }
    }, function (err, result) {
      if (err) return callback(err);

      // Set the hashed password
      userModel._data.password = result.password;

      // Set the email domain before save
      var email = userModel._data.email.split('@');
      userModel._data.email_domain = email[1];

      // Only pass in the allowed user fields
      var userSave = {};
      for (var field in userModel.schema) {
        if (userModel._data[field]) {
          userSave[field] = userModel._data[field];
        } else if (field === 'interests' || field === 'aboutme') {
          //If we didn't get a value but the field has a default defined, use it
          //Needed for blob/text type fields in MySQL
          userSave[field] = '';
        }
      }
      // Save the user
      db.query('INSERT INTO users SET ? ', userSave, function (err, saved) {
        if (err) {
          if (err.code === 'ER_DUP_ENTRY') {
            err = new Error('Username or Email already in use');
          }
          return callback(err);
        }
        userModel._data.id = saved.insertId;

        // Save the activation
        var activation_data = {
          user_id: saved.insertId,
          code: result.randomBytes.toString('hex').slice(0, 42),
          create_ip: userModel.ip
        };
        db.query('INSERT INTO activations SET ?', activation_data, function (err) {
          if (err) return callback(err);

          callback(null, userModel, activation_data.code);
        });
      });
    });

  }


  /**
   * Update an model
   *
   * @wip
   *
   * @param  {object}   new_data The data to update
   * @param  {Function} callback Callback
   */
  update(data, callback) {

    var self = this;

    const new_data = {};
    const save = ['lang', 'first_name', 'last_name', 'timezone', 'auto_translate', 'company_name', 'location', 'interests', 'aboutme', 'jobtitle'];
    for (let val of save) {
      if (data[val]) new_data[val] = data[val];
    }

    // If given an empty object return false
    if (Object.keys(new_data).length === 0) return callback(new Error('No valid arguments'));

    // Update the data
    db.query('UPDATE users SET ? WHERE id = ?', [new_data, self._data.id], (err, success) => {
      if (err) return callback(err);
      callback(null, success);
    });
  }

  verifyPassword(password, callback) {
    var userPwdHash = this._data.password;
    var self = this;
    bcrypt.compare(password, userPwdHash, function (err, verified) {
      // if(err) return callback(err, verified);

      // Check old password
      if (!verified) {
        var md5 = crypto.createHash('md5');
        md5.update(password);
        var hash = md5.digest('hex');

        if (hash === userPwdHash) {
          return self.upgradePassword(password, callback);
        }
      }

      return callback(null, verified);

    });
  }


  /**
   * Upgrade the user password
   *
   * If the user has an old unsafe encrypted password upgrade it to bcrypt
   *
   * @param  {string} password
   */
  upgradePassword(password, callback) {
    var id = this._data.id;
    this.generateHash(password, function (err, hash) {
      if (err) return callback(err);
      db.query(
        'UPDATE users SET password = ?, activated = 1 WHERE id = ?',
        [hash, id],
        function (err) {
          if (err) {
            console.log('Updating to bcrypt password failed: ', err);
          }
          callback(err, true);
        });
    });
  }


  /**
   * Generate a hash of the users password
   *
   * @param  {String}   password the user entered password
   * @param  {Function} callback
   */
  generateHash(password, callback) {
    bcrypt.hash(password, 11, callback);
  }


}


User.getUniqueSlug = function (user_slug, cb, i) {
  var slug = user_slug;
  i = i || 0;
  if (i) slug += '-' + i;

  let sql = 'SELECT id FROM users WHERE slug = ?';
  db.query(sql, [slug], function (err, users) {
    if (err) return cb(err);
    // Modify the slug if exist
    if (users.length) return User.getUniqueSlug(user_slug, cb, ++i);
    return cb(null, slug);
  });
};

User.prototype.isValid = function () {
  return ~~(this._data.activated);
};

/*==================================================*\

  Variables

\*==================================================*/
User.table = 'users';


/*==================================================*\

  Static Methods

\*==================================================*/


/**
 * Generate and email full address
 *
 * @param  {Object} user An object with the user data
 * @return {String}      Name <email>
 */
User.getFullAddress = function (user) {
  if (user.first_name !== '' || user.last_name !== '') {
    //Set user's name if we have it
    return user.first_name + ' ' + user.last_name + ' <' + user.email + '>';
  } else {
    //Otherwise use their username
    return user.username + ' <' + user.email + '>';
  }
};

/**
 * Generate a user's full name.
 *
 * @param  {Object} user An object with the user data
 * @return {String}
 */
User.getFullName = function (user) {
  if (user.last_name === '') {
    if (user.first_name === '') {
      return user.username; //No first or last
    } else {
      return user.first_name; //First only
    }
  } else {
    if (user.first_name === '') {
      return user.username; //Last only
    } else {
      return user.first_name + ' ' + user.last_name; //First and last
    }
  }
};

/**
 * Update the last login date
 *
 * @param  {Integer}   user_id The user ID
 * @param  {Function}  [cb]    Optional callback
 * @return {Void}
 */
User.updateLastLogin = function (user_id, cb) {
  cb = cb || function () {};
  const sql = 'UPDATE users SET last_login = CURRENT_TIME WHERE id = ?';
  db.query(sql, [user_id], function (err) {
    if (err) console.error('Failed updating last login: ', err);
    cb();
  });
};



/*==================================================*\

  Find methods

\*==================================================*/


/**
 * Get the current user
 *
 * @param  {Integer}   user_id The user ID
 * @param  {Function} cb       The callback
 * @return {void}              An user model
 */
User.me = function (user_id, cb) {
  let fields = 'id, username, slug, first_name, last_name, lang, timezone, auto_translate, avatarpath, location, interests, aboutme, jobtitle';
  let SQL = `
    SELECT ${fields} FROM users
    WHERE id = ?
    LIMIT 1
  `;
  db.query(SQL, [user_id], function (err, user) {
    if (err) return cb(err);

    if (user.length === 0) {
      return cb(new Error('No user found'));
    }

    cb(null, new User(user[0]));
  });
};


/**
 * Find a user by a column and it's value
 *
 * @param  {String}         key   The column to check
 * @param  {String|Integer} value The value to check
 * @param  {Function}       cb    The callback
 * @return {Void}
 */
User.findBy = function (key, value, cb) {
  const sql = 'SELECT * FROM users WHERE ?? = ? LIMIT 1';
  db.query(sql, [key, value], function (err, user) {
    if (err) return cb(err);
    if (!user.length) return cb(new Error('No user found'));

    cb(null, new User(user[0]));
  });
};
// Shorthand functions for the one above
User.findByUsername = (value, cb) => {
 User.findBy('username', value, cb);
};
User.findByEmail = (value, cb) => {
 User.findBy('email', value, cb);
};
User.findBySlug = (value, cb) => {
 User.findBy('slug', value, cb);
};
User.findById = (value, cb) => {
 User.findBy('id', value, cb);
};


/**
 * Find a user by username or email
 *
 * @param  {String}   identifier The username or email
 * @param  {Function} cb         The callback
 * @return {void}                A user model
 */
User.findByUsernameOrEmail = function (identifier, cb) {
  const sql = `
    SELECT * FROM users
    WHERE username = ?
    OR email = ?
    LIMIT 1
  `;
  db.query(sql, [identifier, identifier], function (err, user) {
    if (err) return cb(err);
    if (user.length === 0) return cb( new Error('No user found by: ' + identifier) );

    cb(null, new User(user[0]));
  });
};


/**
 * Find all users by IDs
 *
 * @param  {Array}    user_ids An array of user IDs
 * @param  {Function} cb       The callback
 * @return {Void}              An array with user models
 */
User.findByIds = function (user_ids, cb) {
  const sql = `
    SELECT * FROM users
    WHERE id IN (?)
  `;
  db.query(sql, [user_ids], function (err, users) {
    if (err) return cb(err);
    if (!users.length) return cb( new Error('No users found'));

    cb(null, users.map((u) => new User(u) ));
  });
};



/**
 * Activate the user by activation code
 *
 * @param {string}   code     The activation code
 * @param {string} ip The IP address
 * @param {Function} callback
 */
User.activate = function (code, ip, callback) {
  async.waterfall([

    // Find activatin with the code
    function (next) {
      var sql = 'SELECT * FROM activations WHERE code = ?';
      db.query(sql, [code], next);
    },

    // Verify the activation and get the user
    function (activation, fields, next) {
      if (activation.length === 0) return next(new Error('No activation code found'));

      activation = activation[0];
      if (activation.verified_at) { // NULL
        return next(new Error('Already activated: ' + activation.user_id));
      }

      var sql = [
        'UPDATE users, activations',
        'SET users.activated = 1, activations.verified_ip = ?, activations.verified_at=CURRENT_TIME',
        'WHERE users.id = ? AND activations.user_id = ?'
      ].join('\n');
      db.query(sql, [ip, activation.user_id, activation.user_id], function (err, data) {
        next(err, activation, data);
      });
    },

    // Get the user
    function (activation, data, next) {
      User.findById(activation.user_id, next);
    }
  ], callback);
};




/**
 * Get the users subscription settings
 *
 * @param  {Object}   user A user object
 * @param  {Function} cb   The callback
 * @return {void}
 */
User.getSubscriptions = function (user, cb) {
  let SQL = `
    SELECT group_id, type
    FROM groups_users
    WHERE user_id = ?
  `;
  db.query(SQL, [user.id], cb);
};

User.setSubscriptions = function (user, groups, cb) {

  const subscriptions = groups.map((group) => [user.id, group.id, group.type]);
  const delete_SQL = 'DELETE FROM groups_users WHERE user_id = ?';
  const update_SQL = 'INSERT INTO groups_users (user_id, group_id, type) VALUES ?';

  db.getConnection(function (err, connection) {
    if (err) return cb(err);

    connection.beginTransaction(function (err) {
      if (err) return cb(err);

      async.series([
        function (next) {
 connection.query(delete_SQL, [user.id], next);
},
        function (next) {
          if (subscriptions.length <= 0) return next();
          connection.query(update_SQL, [subscriptions], next);
        },
        function (next) {
 connection.commit(next);
}
      ], function (err) {
        if (err) {
return connection.rollback(function () {
 return cb(err);
});
}

        return cb();
      });
    });
  });
};


// Not used at the moment
User.getAdminGroups = function (user_id, lang, cb) {
  let SQL = `
    SELECT gc.group_id AS id, gc.title, gc.slug
    FROM groups_admins AS ga
    JOIN groups_content AS gc ON gc.group_id = ga.group_id
    WHERE user_id = ?
    AND gc.lang = ?
  `;
  db.query(SQL, [user_id, lang], cb);
};


/**
 * Search for a user by username (eg. autocomplete)
 *
 * @param  {Object}   data     data.username
 * @param  {Function} callback
 * @return {Void}
 */
User.search = function (data, callback) {
  //var fields = [ 'email', 'username', 'first_name', 'last_name', 'company_name'];

  var and = '';
  if (data.user_id) {
    and = 'AND id != ' + db.escape(data.user_id);
  }

  var sql = 'SELECT id, username FROM users WHERE username LIKE ? ' + and + ' LIMIT 7';
  db.query(sql, [ '%' + data.username + '%' ], function (err, data) {
    if (err) return callback(err);
    callback(null, data);
  });

};



module.exports = User;
