#!/usr/bin/env node
'use strict';

// Path handling functions
const path = require('path');

// Load global env variables
require('dotenv').load({path: path.dirname(__dirname) + '/.env'});

// Modules
const repl = require('repl');
const clor = require('clor');
const hashids = require('../utils/hashids');
const redisClient = require('../lib/redis');

// Init message
const random = (high) => Math.floor(Math.random() * (high + 1));
const quotes = [ 'You\'re all going to die down here.', 'I\'ve been a bad, bad girl.', 'I can give you the code, but first you must do something for me.', 'One of your group has been infected. I require her life for the code.' ]; // 'I implore you.', 'I don\'t deal in chance.'
console.log('\n' + clor.red.bold(quotes[random(1)]) + '\n');

// Start the custom REPL
const local = repl.start( clor.red('Red Queen> '));

/**
 * Create a hashid from an id
 *
 * @param  {Integer} id The number/id to encode
 * @return {String}     The generated hashid
 */
local.context.hash = function (id) {
  if (!id) return quotes[2];
  return hashids.encode(id);
};

/**
 * Decode a hashid into an id
 *
 * @param  {String} hash The hashid to decode
 * @return {Array}       An array of decoded ids
 */
local.context.dehash = function (hash) {
  if (!hash) return quotes[3];
  return hashids.decode(hash);
};


/**
 * Decode an hash to id's
 *
 * @param  {String} email the message to bounce
 * @return {String}
 */
local.context.sendBounce = function (email) {
  redisClient.publish('send_email', JSON.stringify({ command: 'bounce', params: { email } }));
  return 'The bounce has been triggered!';
};
