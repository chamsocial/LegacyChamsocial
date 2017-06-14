/*=============================================*\

  Directives

\*=============================================*/
'use strict';

angular.module('chamSocial')



/**
 *
 * Add lightbox to children
 *
 */
 .directive('baguetteBox', function ($timeout) {
  return {
    link: function ($scope, $elm) {
      $timeout(function () {
        $elm[0].classList.add('baguetteBox');
        baguetteBox.run('.baguetteBox', { animation: 'fadeIn' });
      }, 100);
    }
  };
})



/**
 *
 * Custom validation directive to display input errors
 *
 * @todo Fix translation
 */
.directive('chamValidation', function() {
  return {
    restrict: 'E',
    scope: {
      form: '=',
      name: '@',
      messages: '=',
      pattern: '@'
    },
    templateUrl: '/partials/form-errors'
  };
})



/**
 *
 * Verify a usename/email is unique if changeing
 *
 */
// https://gist.github.com/auser/6417470
.directive('unique', function($http, $timeout) {
  var checking = null;
  var isInvalid = false;
  return {
    require: 'ngModel',
    link: function(scope, ele, attrs, ngModel) {
      return scope.$watch(function(){ return ngModel.$viewValue; }, function(value) {
        $timeout.cancel(checking);

        // if empty or undefined return
        if(!value) return ngModel.$setValidity('unique', true);

        // Check that the other fields is valid first
        isInvalid = false;
        angular.forEach(ngModel.$error, function(error, key){
          if(key !== 'unique' && error){
            isInvalid = true;
          }
        });
        if(isInvalid) return ngModel.$setValidity('unique', true);

        checking = $timeout(function() {
          $http({
            method: 'POST',
            url: '/v1/users/check/' + attrs.unique,
            data: { 'input': ngModel.$viewValue }
          }).success(function(data) {
            ngModel.$setValidity('unique', data.isUnique);
            checking = null;
          }).error(function() { // data, status, headers, cfg
            checking = null;
          });
        }, 1000);
      });
    }
  };
})



/**
 *
 * Autofocus even when the view is loaded by angular
 *
 */
.directive('autofocus', function(){
  return {
    link: function(scope, element){
      element[0].focus();
    }
  };
})



/**
 * Disable the submit while sending (OLD)
 *
 * On submit disable the button and display a loader until the request is done
 */
.directive('submitting', function(){
  // Runs during compile
  return {
    restrict: 'A',
    link: function(scope, iElm) {

      iElm[0].className += ' btn-submit';

      // Disable link
      scope.$watch('submitting',function(newVal){
        if(newVal) {
          iElm[0].disabled = true;
          iElm[0].classList.add('btn-submitting');
        } else {
          iElm[0].disabled = false;
          iElm[0].classList.remove('btn-submitting');
        }
      });
    }
  };
})


/**
 * Disable the submit while sending (NEW)
 *
 * On submit disable the button and display a loader until the request is done
 *
 * Add the attribute submit-button="[The name of the form]" on the button
 * Set $scope.submitting = true|false in the controller
 */
.directive('submitButton', function() {
  // Runs during compile
  return {
    restrict: 'A',
    scope: {
      submitButton: '='
    },
    link: function(scope, iElm) {

      scope.$watchGroup(['submitButton.$invalid', 'submitButton.$submitted'], function(newVal) {
        if(
          newVal[0] === true && newVal[1] === true ||
          iElm[0].classList.contains('btn-submitting')
        ) {
          iElm[0].disabled = true;
        } else {
          iElm[0].disabled = false;
        }
      });

      iElm[0].className += ' btn-submit';

      // Disable link
      scope.$watch('$parent.submitting',function(newVal){
        if(newVal) {
          iElm[0].disabled = true;
          iElm[0].classList.add('btn-submitting');
        } else {
          iElm[0].disabled = false;
          iElm[0].classList.remove('btn-submitting');
        }
      });
    }
  };
});
