'use strict';
// https://medium.com/opinionated-angularjs/techniques-for-authentication-in-angularjs-applications-7bbf0346acec
// https://docs.google.com/presentation/d/1dceqxHVLP251cOQvBh3gOrAO_G2c6W9lQ6J2JCaO1d0/edit#slide=id.p



angular.module('chamSocial', [
  'ngResource',
  'ngAnimate',
  'ngSanitize',
  'MessageCenterModule', // @todo remove and clean up
  'chamMessages',
  'ui.bootstrap',
  'ui.select',
  'ui.router',
  'monospaced.elastic' // Auto grow textarea
])



// Ui Select settings
.config(function(uiSelectConfig) { uiSelectConfig.theme = 'bootstrap'; })
// Disable debug
.config(function ($compileProvider) {
  $compileProvider.debugInfoEnabled(false);
})


// Constants
.constant('EVENTS', {
  loginSuccess: 'auth-login-success',
  loginFailed: 'auth-login-failed',
  logoutSuccess: 'auth-logout-success',
  sessionTimeout: 'auth-session-timeout',
  notAuthenticated: 'auth-not-authenticated',
  notAuthorized: 'auth-not-authorized',
  userDataChanged: 'user-data-changed'
})



/**
 *
 * Initial functions to run when started
 *
 */
.run( function ($rootScope, Auth, $state, $stateParams, DefaultApiParams, chamGlobal) {

  // get the user if logged in
  Auth.getUser();

  // Change page title & description, based on Route information
  $rootScope.$on("$stateChangeSuccess", function(currentRoute, previousRoute) {
    if($state.current.title) {
      chamGlobal.title = $state.current.title;
    }
  });

  // Set the language
  $rootScope.$on('$stateChangeStart',
    function(event, toState, toParams, fromState, fromParams)
  {
    if(fromParams.lang !== toParams.lang) {
      // Reload the page if the lanuage change and already is set
      if(fromParams.lang) return chamGlobal.changeLang(toParams.lang);
      // Set the new lang
      chamGlobal.setLang(toParams.lang);
    }
  });

})


.factory('DefaultApiParams', function() {
  return { lang: 'en' };
})


.factory('chamGlobal', function(DefaultApiParams, $state, $window) {
  var cham_global = {
    title: 'Home', //TOD these strings should come from locale
    description: 'The online community in Chamonix, Find a climbing partner,'+
      ' sell & buy or just rant about anything.',
    lang: 'en',
    languages: ['en', 'fr'],
    lang_not: function() {
      return (cham_global.lang === 'en') ? 'fr' : 'en';
    },
    setLang: function(lang) {
      // Set both this and default API params
      cham_global.lang = DefaultApiParams.lang = lang;
    },
    changeLang: function(e, lang) {
      if(typeof e === 'string') { lang = e;
      } else { e.preventDefault(); }
      if(lang === cham_global.lang) return;

      var new_url = $state.href($state.current, {lang: lang});
      $window.location = new_url;
    }
  };
  return cham_global;
})


/**
 * Send a x-lang = fr if the url starts with /fr
 *
 * @param  {Object} $window      The angular wrapper for window
 */
.factory('langInterceptor', function ($window) {
  return {
    request: function (config) {
      if ($window.location.pathname.slice(0,3) === '/fr') {
        config.headers = config.headers || {};
        config.headers['x-lang'] = 'fr';
      }
      return config;
    }
  };
})
.config(function ($httpProvider) {
  $httpProvider.interceptors.push('langInterceptor');
})


.factory('User', function($rootScope, EVENTS, StorageService, Messages) {

  // if the json would be invalid
  var initData = {};
  try {
    initData = JSON.parse(StorageService.get('userData'));
  }catch(e){
    initData = {};
  }

  var user = {
    data: initData,
    isAuthenticated: function(){
      return !!user.data;
    },
    set: function(data){
      if(data.unread_messages) { //} && user.data.unread_messages != data.unread_messages) {
        Messages.add({
          text: 'You have <strong>'+ data.unread_messages +'</strong> new private messages. '+
          ' <a class="alert-link" href="'+ data.lang +'/messages">View »</a>',
          type: 'direct',
          status: 'info'
        });
      }
      user.data = data;
      StorageService.set('userData', JSON.stringify(data));
      $rootScope.$broadcast(EVENTS.userDataChanged, data);
    },
    update: function(data) {
      var new_data = angular.extend(user.data, data);
      user.set(new_data);
    },
    get: function(key) {
      if(!user.data) return false;
      if(key) {
        return user.data[key];
      }
      return user.data;
    },
    destroy: function(){
      user.data = null;
      StorageService.unset('userData');
      $rootScope.$broadcast(EVENTS.userDataChanged);
    }
  };


  // Validate login expiry (might be off by an hour or so)
  var now = new Date();
  var utc = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
  var utcTime = Math.round(utc.getTime() / 1000);

  // If the session has expired destroy the user data
  if( initData && initData.exp && initData.exp < utcTime ){
    user.destroy();
  }

  return user;
})




/*=============================================*\

  Services

\*=============================================*/


.factory('StorageService', function(){
  return {
    get: function(key) {
      return localStorage.getItem(key);
    },
    set: function(key, val) {
      return localStorage.setItem(key, val);
    },
    unset: function(key) {
      return localStorage.removeItem(key);
    }
  };
})



/*=============================================*\

  Filters

\*=============================================*/


.filter('invalidCharacter', function () {
  return function(input, pattern){
    if(typeof input !== 'string') return '';
    var reg = new RegExp(pattern, 'g');
    return input ? input.replace(reg, '') : '';
  };
})



.filter('moment', function () {
  return function(date, format){
    return moment(date).format(format);
  };
})



/**
 * Count the number of items in a object
 *
 * @param  {object}   The object to count the length on
 * @return {int}      The total number of items
 */
.filter('objLength', function(){
  return function(obj) {
    return Object.keys(obj).length;
  };
})



.filter('AlreadyAddedFilter', function() {
  return function(items, selected) {

    if(!selected){
      return [];
    }
    var out = items;

    out = items.filter(function(item){
      var bool = true;
      selected.forEach(function (select) {
        if(item.id === select.id){
          bool = false;
        }
      });
      return bool;
    });

    return out;
  };
});
