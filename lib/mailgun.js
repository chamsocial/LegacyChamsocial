'use strict';
const apiKey = process.env.MAILGUN_APIKEY;
const domain = process.env.MAILGUN_DOMAIN;
const mailgun = require('mailgun-js')({ apiKey, domain });

module.exports = mailgun;
