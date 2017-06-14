/**
 * A list off error responses
 *
 * Return an error message with type
 */
'use strict';

var errors = {

  // Auth
  'INVALID_PASSWORD': {
    message: 'Invalid password. Needs to be at least 6 characters long.'
  },
  'INVALID_TOKEN': {
    message: 'Invalid token.'
  },
  'INVALID_RESET_TOKEN': {
    message: 'The reset token is invalid or has expired.'
  },
  'ACCOUNT_NOT_ACTIVATED': {
    message: 'The account has not been activated yet.'
  },

  // User
  USER_NOT_FOUND: {
    message: 'The user was not found.'
  },

  // DB
  COULD_NOT_SAVE: {
    message: 'Could not save to the database please try agin.'
  },
};

var getError = function getError(type) {
  var e = {
    error: errors[type]
  };
  e.error.type = type;
  return e;
};



module.exports = getError;
