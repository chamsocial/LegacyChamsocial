'use strict';
var mysql = require('mysql');
var connection = mysql.createPool({
  connectionLimit: 111,
  socketPath: process.env.MYSQL_SOCK || null,
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'chamsocial',
  password: process.env.MYSQL_PASS || 'patrik',
  database: process.env.MYSQL_DB || 'chamsocial',
  charset: 'utf8mb4'
});

module.exports = connection;
