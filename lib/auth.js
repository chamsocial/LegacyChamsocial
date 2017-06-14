'use strict';

const jwt = require('jsonwebtoken');
const redisClient = require('../lib/redis');
const Limiter = require('ratelimiter');
const User = require('../models/User');

/**
 * Create a login token for the user
 *
 * @param  {object} user The user model
 * @return {object}      The user and the token to return to the client
 */
function login(user) {
  // get the user info (id, username, created, etc)
  var userProfile = user.toJson();

  // create a auth JWT token
  var token = jwt.sign(userProfile, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE * 60
  });

  // Save the token (for logout)
  redisClient.set(token, userProfile.id);

  // Set the same expire
  redisClient.expire(token, process.env.JWT_EXPIRE * 60);

  // Update the user last login
  User.updateLastLogin(user.get('id'));

  return { user: userProfile, token: token };
}



/**
 * Logot
 *
 * Delete the token from redis
 *
 * @param  {String} token The auth token
 * @return {void}
 */
function logout(token) {
  redisClient.del(token);
}



/**
 * Generate a token and store in redis for forgot password
 *
 * @param  {Integer} user_id The user ID
 * @return {String}          The generated token
 */
function forgot_passord_token(user_id) {

  // Create a token that is valid for 48h
  var expire = 60 * 60 * 24 * 2;
  var token = jwt.sign({user_id}, process.env.JWT_SECRET, { expiresIn: expire });

  // Save the token (for logout)
  redisClient.set('forgot' + token, user_id);

  // Set the same expire
  redisClient.expire('forgot' + token, expire);

  return token;
}


const ratelimit = function (id, req, res, next) {
  const limit = new Limiter({
    db: redisClient,
    id: id,
    max: 20,
    duration: 900000
  });

  limit.get(function (err, limit) {
    if (err) return next(err);

    res.set('X-RateLimit-Limit', limit.total);
    res.set('X-RateLimit-Remaining', limit.remaining - 1);
    res.set('X-RateLimit-Reset', limit.reset);

    // all good
    if (limit.remaining) return next();

    // not good
    console.log('Failed to many logins: ', req.ip);
    var delta = (limit.reset * 1000) - Date.now() | 0;
    var after = limit.reset - (Date.now() / 1000) | 0;
    res.set('Retry-After', after);
    res.status(429).json({ error: 'Rate limit exceeded, retry in ' + Math.floor(delta / 1000 / 60) + 'min' });
  });
};
const username_rate_limit = function (req, res, next) {
  let user = req.body.username || 'x';
  return ratelimit(user, req, res, next);
};
const ip_rate_limit = function (req, res, next) {
  return ratelimit(req.ip, req, res, next);
};




module.exports = {
  login,
  logout,
  forgot_passord_token,
  username_rate_limit,
  ip_rate_limit
};
