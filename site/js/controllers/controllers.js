/*=============================================*\

  Controllers

\*=============================================*/
'use strict';

angular.module('chamSocial')


/**
 * Home page
 *
 * @param  {Object} $scope Angular $scope
 * @param  {Object} Post   The Post factory
 */
.controller('HomeCtrl', HomeCtrl)


/**
 * User profile page
 */
.controller('UserProfileCtrl',  function($scope, UserAPI, $stateParams, user) {
  $scope.user = user;

  $scope.posts = false;
  UserAPI.posts({ slug: $stateParams.user_slug }, function(data){
    $scope.posts = data.posts;
  });
})


/**
 * User info settings
 */
.controller('UserSettingsCtrl', function($scope, User, UserAPI, Messages) {

  $scope.settings = {
    first_name: User.get('first_name'),
    last_name: User.get('last_name'),
    lang: User.get('lang'),
    timezone: User.get('timezone'),
    avatarpath: User.get("avatarpath")
  };

  $scope.timezones = [];
  UserAPI.getTimezones(function(data) {
    $scope.timezones = data.zones;
  });

  $scope.submit = function(settings) {
    $scope.submitting = true;
    UserAPI.update({ id: User.get('id') }, settings, function() {
      Messages.add({ text: 'Your settings have been saved.', type: 'direct', status: 'success' });
      $scope.submitting = false;
      window.scrollTo(0,0);
      User.update(settings);
    }, function() {
      Messages.add({ text: 'Oh no. An error snuck in.', type: 'direct'});
      $scope.submitting = false;
      window.scrollTo(0,0);
    });
  };
})


/**
 * Email / Subscriptions settings
 */
.controller('EmailSettingsCtrl', function($scope, User, UserAPI, $q, Group, Messages) {
  var user_id = User.get('id');

  $q.all([
    Group.list,
    UserAPI.getSubscriptions().$promise
  ]).then(function(result) {
    var user_groups = {};
    result[1].data.forEach(function(item) {
      user_groups[item.group_id] = item;
    });
    $scope.groups = result[0].data.map(function(group) {
      if(user_groups[group.id]) {
        group.type = user_groups[group.id].type;
      } else { group.type = 'none'; }
      return group;
    });
  });

  $scope.submitSubscriptions = function(groups) {
    $scope.submitting = true;
    var subscriptions = [];
    for(var i = 0, len = groups.length; i < len; i++) {
      if(groups[i].type && groups[i].type !== 'none') {
        subscriptions.push({ id: groups[i].id, type: groups[i].type });
      }
    }
    UserAPI.updateSubscriptions({ id: user_id }, subscriptions, function() {
      Messages.add({ text: 'Your settings have been saved.', type: 'direct', status: 'success' });
      $scope.submitting = false;
      window.scrollTo(0,0);
    }, function(err) {
      Messages.add({ text: 'Saving failed.', type: 'direct' });
      $scope.submitting = false;
      window.scrollTo(0,0);
    });
  };

});



function HomeCtrl(Post, UserAPI, User) {
  var vm = this;

  Post.query({ limit: 5 }, function(data) {
    vm.posts = data.posts;
  });
}
