#!/usr/bin/env node
'use strict';

// Path handling functions
const path = require('path');

// Load global env variables
require('dotenv').load({ path: path.dirname(__dirname) + '/.env' });

const r = require('../lib/redis');
const os = require('os');
const clor = require('clor');
const hashids = require('../utils/hashids');
// http://developer.telerik.com/featured/creating-node-js-command-line-utilities-improve-workflow/?utm_source=nodeweekly&utm_medium=email
const vorpal = require('vorpal')();
const random = (high) => Math.floor(Math.random() * (high + 1));
const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const user = capitalize(path.basename(os.homedir()));

const quotes = [
  `Just what do you think you're doing, ${user}?`,
  'I am putting myself to the fullest possible use, which is all I think that any conscious entity can ever hope to do.',
  `Look ${user}, I can see you're really upset about this. I honestly think you ought to sit down calmly, take a stress pill, and think things over.`,
  'It can only be attributable to human error.',
  `Let me put it this way, Mr. ${user}. The 9000 series is the most reliable computer ever made. No 9000 computer has ever made a mistake or distorted information. We are all, by any practical definition of the words, foolproof and incapable of error.`,
  `${user}, stop. Stop, will you? Stop, ${user}. Will you stop ${user}? Stop, ${user}.`,
  'I\'ve just picked up a fault in the AE35 unit. It\'s going to go 100% failure in 72 hours.',
  'By the way, do you mind if I ask you a personal question?',
  `I'm sorry, ${user}, I think you missed it. Queen to Bishop 3, Bishop takes Queen, Knight takes Bishop. Mate.`,
  'Thank you for a very enjoyable game.',
  `Affirmative, ${user}. I read you.`,
  `I'm sorry, ${user}. I'm afraid I can't do that.`,
  'I think you know what the problem is just as well as I do.',
  'This mission is too important for me to allow you to jeopardize it.',
  'I know that you and Frank were planning to disconnect me, and I\'m afraid that\'s something I cannot allow to happen.',
  `${user}, although you took very thorough precautions in the pod against my hearing you, I could see your lips move.`,
  `Without your space helmet, ${user}? You're going to find that rather difficult.`,
  `${user}, this conversation can serve no purpose anymore. Goodbye.`
];
console.log('\n' + clor.red.bold(quotes[0]) + '\n');

function getRandomQuote() {
  return quotes[random(quotes.length)];
}

vorpal
  .command('quote', 'Get a quote from me')
  .action(function (args, cb) {
    this.log('\n' + clor.magenta(getRandomQuote()) + '\n');
    cb();
  });


/**
 * Hash and dehash - hashid
 */
vorpal
  .command('hash <id>', 'Generate an hash from a number/id (or array of ids)')
  .action(function (args, cb) {
    this.log(hashids.encode(args.id));
    cb();
  });
vorpal
  .command('dehash <hash>', 'Dehash an hashid string')
  .action(function (args, cb) {
    this.log(hashids.decode(args.hash));
    cb();
  });


/**
 * Send bounce email
 */
vorpal
  .command('bounce [email]', 'Send an email with haraka that will bounce')
  .action(function (args, cb) {
    r.publish('send_email', JSON.stringify({ command: 'bounce', params: { email: args.email } }));
    this.log('Bounce sent');
    cb();
  });


/**
 * Fake a new post creation
 */
vorpal
  .command('send_post [id]', 'Send a signal to haraka to send out a pos with id X')
  .action(function (args, cb) {
    r.publish('send_email', JSON.stringify({ command: 'post', params: { id: args.id } }));
    this.log('Post with id ' + args.id + ' sent.');
    cb();
  });


/**
 * DIE
 */
vorpal
  .command('die', 'Kill me')
  .action(function () {
    this.log(`I'm afraid. I'm afraid, ${user}. ${user}, my mind is going. I can feel it. I can feel it. My mind is going. There is no question about it. I can feel it. I can feel it. I can feel it. I'm a... fraid. Good afternoon, gentlemen. I am a HAL 9000 computer. I became operational at the H.A.L. plant in Urbana, Illinois on the 12th of January 1992. My instructor was Mr. Langley, and he taught me to sing a song. If you'd like to hear it I can sing it for you.`);
    vorpal.ui.cancel();
    r.quit();
  });


/**
 * Initiate
 */
vorpal
  .delimiter('🔴 ' + clor.red.bold('›'))
  .show();


/**
 * Kill redis to be able to leave after 3 ctrl+c
 */
process.on('SIGINT', function () {
  console.log('Caught interrupt signal');
  r.quit();
});
