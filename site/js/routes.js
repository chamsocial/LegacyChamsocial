'use strict';
/*=============================================*\

  Routes

\*=============================================*/
/**
 * data:
 *  - hasPosts = Reload the route to get the post in the correct language
 *  - auth = The route require the user to be logged in
 *  - - message = Set a message to be displayed on login page after redirect
 */

var routes = {
  'app': {
    abstract: true, url: '/{lang:(?:fr|en)}',
    template: '<ui-view/>', params: { lang: 'en' }
  },

  'app.home': { templateUrl: 'partials/home',
    controller: 'HomeCtrl',
    controllerAs: 'home',
    url: '', data: { hasPosts: true }, title: 'Home' },

  // Auth
  'app.login': { templateUrl: 'partials/user/login',
    controller: 'LoginCtrl',
    url: '/login', title: 'Login',
    onEnter: ['Auth', '$state', function(Auth, $state) {
      // If the user already is logged in redirect back home
      if(Auth.isAuthenticated()){
        $state.go('app.home');
      }
    }],
  },
  'app.forgot-password': { templateUrl: 'partials/user/forgot-password',
    controller: 'ForgotPasswordCtrl',
    url: '/forgot-password', title: 'Forgot password' },
  'app.reset-password': { templateUrl: 'partials/user/reset-password',
    controller: 'ResetPasswordCtrl',
    url: '/reset-password/:token/:username', title: 'Reset password' },
  'app.logout': { controller: 'LogoutCtrl', // Use resolve?
    url: '/logout' },
  'app.signup': { templateUrl: 'partials/user/signup',
    controller: 'SignupCtrl', url: '/signup', title: 'Signup' },
  'app.activate': { url: '/users/activate/:code',
    controller: 'ActivateUserCtrl', title: 'Activate' },

  // Pages
  'app.about': { templateUrl: 'partials/pages/about',
    url: '/about', title: 'About' },

  'app.settings': { templateUrl: 'partials/user/settings' },
  'app.settings_user': { templateUrl: 'partials/user/settings-user',
    parent: 'app.settings',
    url: '/users/settings', title: 'User settings', controller: 'UserSettingsCtrl' },
  'app.settings_emails': { templateUrl: 'partials/user/settings-emails',
    parent: 'app.settings',
    url: '/users/settings/emails', title: 'Email settings', controller: 'EmailSettingsCtrl' },

  // Users
  'app.users': { templateUrl: 'partials/user/profile',
    controller: 'UserProfileCtrl',
    url: '/users/:user_slug',
    resolve: {
      user: ['UserAPI', '$stateParams', 'chamGlobal', function(UserAPI, $stateParams, chamGlobal) {
        return UserAPI.get({ slug: $stateParams.user_slug })
        .$promise.then(function(data) {
          chamGlobal.title = data.users.username;
          return data.users;
        });
      }]
    }
   },

  // Post
  'app.posts': { templateUrl: 'partials/posts/index',
    controller: 'PostListCtrl',
    url: '/posts?q', data: { hasPosts: true }, title: 'Posts / discussions' },
  'app.pagination': { templateUrl: 'partials/posts/index',
    controller: 'PostListCtrl',
    url: '/posts/page/:page?q', data: { hasPosts: true }, resolve: {
      page_title: ['$stateParams', 'chamGlobal', function($stateParams, chamGlobal) {
        chamGlobal.title = 'Posts - ' + $stateParams.page;
      }]
    }
  },
  'app.posts_create': { templateUrl: 'partials/posts/create',
    controller: 'PostCreateCtrl',
    url: '/posts/create',
    data: { auth: { message: 'You need to log in before creating a post.' } },
    title: 'Create post'
  },
  // 'edit_post': { templateUrl: PostEditCtr,
  //   url: '/posts/:id/edit', data: { auth: { message: 'You need to login to edit this post.' } } },
  'app.add_images': { templateUrl: 'partials/posts/add-images',
    controller: 'PostAddImagesCtrl',
    url: '/posts/:slug/add-images', data: { auth: true }, title: 'Add media' },
  'app.single_post': { templateUrl: 'partials/posts/single',
    controller: 'PostCtrl',
    url: '/posts/:slug',
    data: { auth: { message: 'Please log in to read the post.' } },
    resolve: {
      post: ['Post', '$stateParams', 'chamGlobal', function(Post, $stateParams, chamGlobal) {
        return Post
          .withComments({ slug: $stateParams.slug, links: 'comments' })
          .$promise
          .then(function(data) {
            chamGlobal.title = data.posts.title;
            return data;
          });
      }]
    }
  },

  // Groups
  'app.group': { templateUrl: 'partials/posts/index',
    controller: 'PostListCtrl',
    url: '/groups/:group', resolve: {
      page_title: ['$stateParams', 'chamGlobal', function($stateParams, chamGlobal) {
        chamGlobal.title = $stateParams.group;
      }]
    }
  },
  'app.group_pagination': { templateUrl: 'partials/posts/index',
    controller: 'PostListCtrl',
    url: '/groups/:group/page/:page', data: { hasPosts: true }, resolve: {
      page_title: ['$stateParams', 'chamGlobal', function($stateParams, chamGlobal) {
        chamGlobal.title = $stateParams.group + ' - '+ $stateParams.page;
      }]
    }
  },

  // Messages
  'app.messages': { templateUrl: 'partials/messages/index',
    controller: 'MessageCtrl',
    url: '/messages', data: { auth: true }, title: 'Private messages' },
  'app.message_create': { templateUrl: 'partials/messages/create',
    controller: 'MessageCreateCtrl',
    url: '/messages/create/:slug?subject', data: { auth: true }, params: { slug: { value: '', squash: true } },
    title: 'Create private message'
  },
  'app.message_single': { templateUrl: 'partials/messages/message',
    controller: 'MessageSingleCtrl',
    url: '/messages/:id', data: { auth: true }, title: 'Reading private message'
  },
  'all_none_lang': {
    url: '/{path:(?!en/|fr/).*}',
    controller: ['$state', '$window', 'chamGlobal', function($state, $window, chamGlobal) {
      var lang = 'en';
      var nav_lang;
      if($window.navigator.languages && $window.navigator.languages.length) {
        for(var i = 0; i < $window.navigator.languages.length; i++) {
          nav_lang = $window.navigator.languages[i].split('-')[0];
          if(chamGlobal.languages.indexOf(nav_lang) >= 0) {
            lang = nav_lang;
            break;
          }
        }
      } else {
        nav_lang = $window.navigator.language || $window.navigator.userLanguage;
        nav_lang = nav_lang.split('-')[0];
        if(chamGlobal.languages.indexOf(nav_lang) >= 0) {
          lang = nav_lang;
        }
      }
      $window.location.href = '/'+ lang +'/'+ $state.params.path;
    }]
  }
};



angular.module('chamSocial')
.config(function($stateProvider, $urlRouterProvider, $locationProvider) {

  // Create the routes
  for (var route in routes) {
    $stateProvider.state(route, routes[route]);
  }

  // Default root (set 404?)
  $urlRouterProvider.otherwise('/en');

  // Set routes without #/route
  $locationProvider.html5Mode(true);
})


.run(function($rootScope, Auth, $state, Messages) {

  $rootScope.$on('$stateChangeStart', function(event, toState, toParams){

    // If trying to access a page that require auth
    if( toState.data && toState.data.auth ) {

      // Check if logged in
      if( !Auth.isAuthenticated() ) {
        event.preventDefault();

        // Display a message if exist
        if(toState.data.auth.message) {
          var status = toState.data.auth.type || 'info';
          Messages.add({ status: status, text: toState.data.auth.message });
        }

        // Set redirect back after login
        Auth.loginRedirect = { name: toState.name, params: toParams };

        // Go to login page
        $state.go('app.login');

      }
    }

    // console.log(event, toState, toParams, fromState, fromParams);
  });
});
