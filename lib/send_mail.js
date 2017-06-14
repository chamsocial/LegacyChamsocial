'use strict';

let redisClient = require('./redis');

module.exports = {
  send: function (action, data) {
    data = data || {};
    redisClient.publish('send_email', JSON.stringify({ command: action, params: data }));
  }
};
