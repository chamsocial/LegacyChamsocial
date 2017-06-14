(function() {
  'use strict';
  /*=============================================*\

    Directives

  \*=============================================*/


  angular.module('chamSocial')

  .directive('groupsList', function(chamGlobal, Group, $state, $stateParams) {
    return {
      restrict: 'E',
      link: function(scope) {
        scope.path = 'partials/groups/list';
        Group.list.then(function(res) {
          scope.groups = res.data;

          if($stateParams.group) {
            for(var i = 0; i < scope.groups.length; i++) {
              if($stateParams.group === scope.groups[i].slug) {
                scope.current_group = scope.groups[i];
                break;
              }
            }
          }
        });
        scope.goToGroup = function(item) {
          $state.go('app.group', { group: item.slug });
        };
      },
      template: '<div ng-include="path"></div>'
    }
  });

}());
