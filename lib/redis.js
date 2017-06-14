'use strict';

const async = require('async');
const redis = require('redis');

redis.RedisClient.prototype.delWildcard = function (key, callback) {
  let i = 0;
  this.keys(key, (err, rows) => {
    async.each(rows, (row, callbackDelete) => {
      i++;
      this.del(row, callbackDelete);
    }, (err) => {
      console.log(`Redis del key ${key} on ${i} items`);
      callback(err);
    });
  });
};

const port = process.env.REDIS_PORT || process.env.REDIS_SOCK || '/var/run/redis/redis.sock';
const host = process.env.REDIS_HOST || null;
const client = redis.createClient(port, host);

// Prevent from crashing the app?
client.on('error', function (err) {
  console.log('Redis error www: ' + err);
});

module.exports = client;
