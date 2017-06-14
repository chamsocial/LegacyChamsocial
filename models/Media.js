'use strict';

const db = require('../lib/db');
const Base = require('./Base');
const async = require('async');
const gm = require('gm');
const slug = require('slug');
const path = require('path');
const fs = require('fs');

class Media extends Base {

  /**
   * Save the media
   *
   * @param  {Function} callback
   */
  save(callback) {
    const self = this;


    let save = {};
    for (let i = 0; i < Media.saveFields.length; i++) {
      save[Media.saveFields[i]] = self.get(Media.saveFields[i]);
    }

    // Save the image
    db.query('INSERT INTO ?? SET ?', [Media.table, save], function (err, inserted) {
      if (err) return callback(err);

      let save_relation = {
        id: self.get('post_id'),
        type: self.get('type'),
        media_id: inserted.insertId
      };
      db.query('INSERT INTO ?? SET ?', [ Media.table_relations, save_relation ], function (err) {
        if (err) return callback(err);

        callback(null, inserted);
      });
    });
  }
}



/*==================================================*\

  Variables

\*==================================================*/
Media.table = 'media';
Media.table_relations = 'media_relations';
Media.saveFields = ['filename', 'mime', 'width', 'height', 'size', 'user_id'];
Media.belongs_to = ['post', 'comment'];
Media.maxFileSize = 7 * 1000 * 1000; // 1000*1000 = 1mb
Media.mimes = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/bmp',
  'image/tiff',
  'image/x-icon',
  'application/pdf',
  'text/plain',
  'text/markdown'
];
Media.extensions = [
  'jpg', 'jpeg', 'jpe',
  'png',
  'gif',
  'bmp',
  'tif', 'tiff',
  'ico',
  'pdf',
  'txt',
  'md'
];


/*==================================================*\

  Static Methods

\*==================================================*/


/**
 * Check if a file is an image
 *
 * @param  {string}  type The files mime type
 * @return {Boolean}
 */
Media.isImage = function (type) {
  var index = Media.mimes.indexOf(type);
  return (index > -1);
};



/**
 * Validate the file type (size, mime, extension)
 *
 * @param  {object} file The gm file object
 * @return {bool|Error}      True if the file is valid else an error
 */
Media.validFile = function (file) {

  // Verify the file size
  if (file.size > Media.maxFileSize) {
    return new Error('To big');
  }
  // Verify mime type
  if ( Media.mimes.indexOf(file.mime) === -1) {
    return new Error('Invalid file format!');
  }
  // Verify
  // if( Media.extensions.indexOf(file.extension) === -1 ) {
  //   return new Error('Invalid image extension!');
  // }

  return true;
};



/**
 * Take a file from formidable and upload it
 *
 * @param  {object}   file A formidable file object
 * @param  {object}   data user_id and post_id
 * @param  {Function} cb   The callback
 */
Media.uploadFile = function (file, data, cb) {

  // Validate the file type
  let validFile = Media.validFile(file);
  if (validFile !== true) {
    return cb(validFile);
  }

  // Require some modules
  const fs = require('fs');

  let indexPath = data.indexPath || global.indexPath;


  var paths = path.parse(file.name);
  paths.public = '/uploads/' + data.user_id + '/';
  paths.abs = indexPath + '/public' + paths.public;
  paths.name = slug(paths.name, {lower: true}).substr(0, 240);
  paths.filename = paths.name + paths.ext;
  paths.new_file = paths.abs + paths.filename;

  let verify_or_create_path = function (next) {
    fs.stat(paths.abs, function (err) {
      if (err) return fs.mkdir(paths.abs, next);
      return next();
    });
  };

  let verify_file_name = function (next) {
    fs.stat(paths.new_file, function (err) {
      if (err) {
        paths.filename = paths.name + Date.now() + paths.ext;
        paths.new_file = paths.abs + paths.filename;
      }
      return next();
    });
  };

  // Check file path and existens
  async.parallel([
    verify_or_create_path,
    verify_file_name
  ], function (err) {
    if (err) return cb(err);

    if (Media.isImage(file.type)) {

      // Save the image
      gm(file.path)
        .autoOrient()
        .resize(2500, 2500, '>')
        .size(function (err, size) {
          if (!err) {
            if (size.height > 2500 || size.width > 2500) {
              // TODO
            }
            file.width = size.width;
            file.height = size.height;
          }
        })
        .write(paths.new_file, function (err) {
          if (err) return cb(err);
          Media.saveUploadedFile(file, data, paths, cb);
        }); // write image
    } else {

      // Save the file
      fs.createReadStream(file.path)
        .pipe(fs.createWriteStream(paths.new_file));

      Media.saveUploadedFile(file, data, paths, cb);
    }
  });
};



/**
 * Save the file and post connection
 *
 * @param  {object}   file  formidable file object
 * @param  {object}   data  user_id and post_id
 * @param  {object}   paths Save paths
 * @param  {Function} cb    The callback
 */
Media.saveUploadedFile = function (file, data, paths, cb) {

  // Create an Atachement object
  var org_image = new Media({
    filename: paths.filename,
    mime: file.mime,
    width: file.width || 0,
    height: file.height || 0,
    size: file.size,
    user_id: data.user_id,
    post_id: data.post_id,
    type: data.type
  });

  // Save the main file
  org_image.save(function (err, result) {
    if (err) return cb(err);

    // The return object
    let the_file = {
      id: result.insertId,
      path: paths.public,
      filename: paths.filename,
      user_id: data.user_id
    };

    if (Media.isImage(file.type)) {
      the_file.type = 'image';
    }

    // The file is saved
    cb(null, the_file);

  }); // save attachment
};





/**
 * Get all images attached to a post
 *
 * @param  {Integer}  id       The post id
 * @param  {Function} callback The callback
 */
Media.getByPostId = function (id, callback) {
  const sql = `
    SELECT m.* FROM ?? AS m
    JOIN ?? AS t ON m.id = t.media_id
    WHERE t.id = ?
    AND t.type = 'post'
  `;
  const data = [Media.table, Media.table_relations, id];

  db.query(sql, data, function (err, items) {
    if (err) return callback(err);

    callback(null, items);
  });
};



/**
 * Find an image by ID
 * @param  {int}      id        The image ID
 * @param  {Function} callback  Callback
 * @return {void}               Returns the callback from mysql
 */
Media.findById = function (id, callback) {
  db.query('SELECT * FROM ?? WHERE id = ?', [ Media.table, id ], callback);
};



/**
 * Delete an image
 *
 * Deletes the image from the database but returns true
 * even if the image fails to be deleted from the server
 *
 * @param  {int}      id       The image ID
 * @param  {int}      user_id  The user ID
 * @param  {Function} callback The callback
 * @return {void}
 */
Media.delete = function (id, user_id, callback) {

  // 1. Get the media
  // 2. Delete the file from the database
  async.series([
    function (next) {
      Media.findById(id, function (err, media) {
        if (err) return next(err);

        // Validate
        if (media.length === 0) return next(new Error('No match'));
        if (user_id !== media[0].user_id) return next(new Error('Invalid user'));

        // save the data and continue
        next(null, media[0]);
      });
    },
    // delete the post
    function (next) {
      db.query('DELETE FROM ?? WHERE id = ?', [Media.table, id], function (err, result) {
        if (err) return next(err);

        next(null, result);
      });
    }

  ], function (err, results) {
    if (err) return callback(err);

    var image = results[0];
    const upload_path = '/uploads/' + user_id + '/';

    // Delete the original
    fs.unlink(global.indexPath + '/public' + upload_path + image.filename, function (err) {
      if (err) console.log('Image org delete failed: ' + err);
    });

    // Return as success even if the deletion would fail
    callback(null, results);

  });
};



/**
 * Get all images attached to a post
 *
 * @param  {string}   type     The connection table in singular e.g. post
 * @param  {int}      id       The post ID
 * @param  {Function} callback The callback
 */
Media.getAll = function (type, id, callback) {

  // Check that the type is valid e.g. post
  if (Media.belongs_to.indexOf(type) < 0) {
    callback(new Error('Invalid media connection'));
  }

  db.query([
    'SELECT m.* FROM ?? AS m',
    'JOIN ?? AS t ON m.id = t.media_id',
    'WHERE t.id = ?',
    'AND t.type = ?'
  ].join(' '), [Media.table, Media.table_relations, id, type], function (err, items) {
    if (err) return callback(err);

    callback(null, items);
  });
};



module.exports = Media;
