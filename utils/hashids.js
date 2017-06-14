'use strict';

var Hashids = require('hashids');

module.exports = new Hashids(process.env.HASH_SECRET, 10);
