/*=============================================*\

  Auth

\*=============================================*/
'use strict';

angular.module('chamSocial')

.factory('authInterceptor', function ($rootScope, $q, StorageService, User, $injector) {
  return {
    request: function (config) {
      config.headers = config.headers || {};
      var token = StorageService.get('token');
      if(token) config.headers.Authorization = 'Bearer ' + token;
      return config;
    },
    responseError: function (response) {
      if (response.status === 401) {

        // if the token has expired try again
        if(response.data.error === 'Token expired') {

          // Update the token and destroy the user
          StorageService.unset('token');
          var apiToken = response.data.token;
          User.destroy();

          // Set the token and try again
          response.config.headers.Authorization = 'Bearer '+ apiToken;
          var $http = $injector.get('$http');
          return $http(response.config);
        }
      }
      return $q.reject(response);
    }
  };
})
.config(function ($httpProvider) {
  $httpProvider.interceptors.push('authInterceptor');
})



.factory('Auth', function($http, StorageService, $rootScope, User, UserAPI) {

  var auth = {
    loginRedirect: { name: 'app.home', params: {} }
  };


  auth.isAuthenticated = function() {
    return User.isAuthenticated();
  };

  auth.login = function(credentials) {
    return $http
      .post('/v1/login', credentials)
      .then(function(res){

        auth.setLogin(res.data);

        // Set redirect path
        var redirect = {
          name: auth.loginRedirect.name || 'app.home',
          params: auth.loginRedirect.params
        };
        auth.loginRedirect.name = false;
        auth.loginRedirect.params = {};

        return { redirect: redirect, user: res.data.user };
      });
  };

  auth.setLogin = function(data) {
    User.set(data.user);
    StorageService.set('token', data.token);
  };


  auth.forgotPassword = function(userIdentifier) {
    return $http.post('/v1/forgot-password', { userIdentifier: userIdentifier });
  };
  auth.resetPassword = function(data) {
    return $http.post('/v1/reset-password', data);
  };


  auth.logout = function() {
    $http
      .get('/v1/logout')
      .then(function() {
        // Remove the user and unset the token
        User.destroy();
        StorageService.unset('token');
      });
  };

  auth.getUser = function(){
    if(StorageService.get('token')){
      return $http
        .get('/v1/me').then(function(res){
          User.set(res.data.user);
          return res.data.user;
        }, function(){
          auth.logout();
        });
    }
  };

  /**
   * Create the user
   *
   * @param  {object} userData All user data to save
   * @return {promise}         Promise to use .then in the controller
   */
  auth.create = function(userData) {
    return UserAPI.save({}, userData, function(){

      // Set the user data on success
      // if(res.users){
      //   User.set(res.users);
      // }
    }).$promise;
  };

  auth.activate = function(code) {
    return UserAPI.activate({ code: code }, function(res) {
      return res;
    }).$promise;
  };


  return auth;
});
