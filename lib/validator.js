'use strict';

let validator = require('validate.js');
validator.moment = require('moment');
let db = require('./db');

/**
 * Validate that the value exist
 *
 * @param  {str}      value The user input value
 * @param  {object}   opt   The table and column to validate against
 * @return {promise}        resolve on valid else reject
 */
validator.validators.exist = function (value, opt) {
  return new Promise(function (resolve) {

    let sql = 'SELECT ?? FROM ?? WHERE ?? = ?';
    let values = [opt.column, opt.table, opt.column, value];

    db.query(sql, values, function (err, result) {
      if (err) return resolve('An DB error occured');
      if (result.length === 0) return resolve('value don\'t exist');
      resolve();
    });
  });
};

/**
 * Validate that the value is unique
 *
 * @param  {str}      value The user input value
 * @param  {object}   opt   The table and column to validate against
 * @return {promise}        resolve on valid else reject
 */
validator.validators.unique = function (value, opt) {
  return new Promise(function (resolve) {

    let sql = 'SELECT ?? FROM ?? WHERE ?? = ?';
    let values = [opt.column, opt.table, opt.column, value];

    db.query(sql, values, function (err, result) {
      if (err) return resolve('An DB error occured');
      if (result.length === 0) return resolve();
      resolve('value already exist');
    });
  });
};


module.exports = validator;
