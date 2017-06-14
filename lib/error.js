'use strict';

require('extend-error');

let App = Error.extend('AppError', 500);
let Client = Error.extend('ClientError', 400);


module.exports = {
  App,
  Client,
  notFound: Client.extend('HttpNotFoundError', 404),
  unauthorized: Client.extend('HttpUnauthorized', 401)
};
