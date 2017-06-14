'use strict';
/**
 *
 * All API resources
 *
 */


angular.module('chamSocial')


/**
 * Posts API
 */
.factory('Post', function($resource, DefaultApiParams) {

  return $resource('/v1/posts/:slug', DefaultApiParams, {
    query: { isArray: false },
    withComments: { url: '/v1/posts/:slug/links/:links' },
    media: { url: '/v1/posts/:slug/media' },
    publish: { url: '/v1/posts/:slug/publish' }
  });
})


/**
 * Group API
 */
.factory('Group', function($http, DefaultApiParams) {
  var Group = {
    list: $http.get('/v1/groups', {cache: true, params: DefaultApiParams })
  };
  return Group;
})


/**
 * Media API
 */
.factory('Media', function($resource) {
  return $resource('/v1/media/:id', {}, {
    query: { isArray: false }
  });
})


/**
 * Comments API
 */
.factory('Comment', function($resource, DefaultApiParams) {
  return $resource('/v1/comments/:id', DefaultApiParams, {
    query: { isArray: false }
  });
})


/**
 * Users API
 */
.factory('UserAPI', function($resource) {
  return $resource('/v1/users/:slug', {}, {
    query: { isArray: false },
    update: { url: '/v1/users/:id', method: 'put' },
    search: { url: '/v1/users/search', method: 'post' },
    activate: { url: '/v1/users/activate/:code' },
    posts: { url: '/v1/users/:slug/posts' },
    getTimezones: { url: '/v1/users/timezones' },
    getSubscriptions: { url: '/v1/users/subscriptions' },
    updateSubscriptions: { url: '/v1/users/subscriptions', method: 'put' }
  });
})


/**
 * Private Messages API
 */
.factory('Message', function($resource) {
  return $resource('/v1/messages/:id', {}, {
    query: { isArray: false },
    reply: { url: '/v1/messages/:id', method: 'post' }
  });
});
