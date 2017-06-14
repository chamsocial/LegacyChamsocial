'use strict';

const auth = require('./auth');
const jwt_check = require('./jwt_check');

module.exports = Object.assign({}, auth, { jwt_check });
