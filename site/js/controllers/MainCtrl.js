'use strict';


// http://www.undefinednull.com/2014/02/25/angularjs-real-time-model-persistence-using-local-storage/

angular.module('chamSocial').controller( 'MainCtrl',
  function($rootScope, $scope, User, EVENTS, $state, chamGlobal)
{

  var main = this;
  main.user = null;

  main.chamGlobal = chamGlobal;

  $rootScope.$on(EVENTS.userDataChanged, function() {
    main.user = User.get();
  });

  main.changeLang = chamGlobal.changeLang;


  /*=============================================*\

    Hacks

  \*=============================================*/

  // Prevent form from submit on enter in ui-select
  var ui_select_search;
  var preventEnterToSubmit = function(event) {
    if(event.keyCode == 13) {
      event.preventDefault();
      return false;
    }
  };
  $scope.$on('$viewContentLoaded', function() {
    setTimeout(function() {
      if(ui_select_search) {
        ui_select_search.removeEventListener('keydown', preventEnterToSubmit, false);
      }
      ui_select_search = document.querySelector('.ui-select-search');
      if(ui_select_search) {
        ui_select_search.addEventListener('keydown', preventEnterToSubmit, false);
      }
    }, 500);
  });



  $scope.activeMenu = function(state) {
    return ($state.includes(state)) ? 'menu-current-item' : '';
  };
  //$rootScope.$state = $state;



  $scope.menuOpen = false;
  $scope.toggleMenu = function(e) {

    // if is a link and set prevent default
    if(e){
      e.preventDefault();

    }

    $scope.menuOpen = !$scope.menuOpen;
  };

});
