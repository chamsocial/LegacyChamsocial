'use strict';

angular.module('chamMessages', [])




.factory('Messages', function ($rootScope, $timeout) {

  var Messages = function() {
    this.messages = [];
    this.flash = [];
  };

  Messages.prototype.add = function add(args) {

    // Default values
    var opts = {
      status: 'danger',
      type: 'flash'
    };

    // Set the arguments or message if just a string
    if(angular.isString(args)){
      opts.text = args;
    } else {
      angular.extend(opts, args);
    }

    // If no message return
    if(!opts.text) return;

    // Highligh a message if is duplicate
    var self = this;
    if(opts.type === 'flash') {
      angular.forEach(this.flash, function(value, key) {
        if(angular.equals(value, opts)) {
          opts.duplicate = true;
        }
      });
    } else {
      angular.forEach(this.messages, function(value, key) {
        if(angular.equals(value, opts)) {
          opts.duplicate = true;
          self.messages[key].highlight = true;
          $timeout(function(){
            delete(self.messages[key].highlight);
          }, 300);
        }
      });
    }

    // If message is a duplicate don't add
    if(opts.duplicate) return;

    if(opts.type === 'flash') {
      this.flash.push(opts);
    } else {
      this.messages.push(opts);
    }

  };

  Messages.prototype.remove = function(index) {
    this.messages.splice(index, 1);
  };

  Messages.prototype.updateFlash = function() {

    this.messages = [];
    // var self = this;
    // this.messages = this.messages.filter(function(message){
    //     return message.type === 'permanent';
    // });

    // Insert the flash messages and remove flashes
    this.messages = this.messages.concat(this.flash);
    this.flash = [];
  };

  var messageAPI = new Messages();

  $rootScope.$on('$stateChangeStart', function(){ messageAPI.updateFlash(); });

  return messageAPI;

})

.directive('chamMessages', function(Messages, $timeout) {
   var templateString = ''+
    '<div class="cham-messages">'+
      '<div class="alert alert-dismissible alert-{{ message.status }}" ng-class="{\'alert-highlight\': message.highlight}"'+
          ' ng-repeat="message in messages.messages">'+
        '<button type="button" class="close" data-dismiss="alert" ng-click="close($index)">'+
          '<span aria-hidden="true">&times;</span><span class="sr-only">Close</span>'+
        '</button>'+
        '<div ng-bind-html="message.text"></div>'+
      '</div>'+
    '</div>';

  return {
    restrict: 'EA',
    template: templateString,
    link: function(scope) {

      // // Add class to create css transiton animation but remove to fore remove
      // var timeoutAlert = false;
      // var isActive = false;
      // scope.highlightAlert = function(message){
      //   if(message.type === 'direct') {
      //     return;
      //   }
      //   if(message.highlight){
      //     isActive = true;
      //     return 'alert-highlight';
      //   }else if(isActive || timeoutAlert){
      //     timeoutAlert = $timeout(function(){
      //       timeoutAlert = false;
      //       return;
      //     }, 1000);
      //     isActive = false;
      //     return 'alert-post-highlight';
      //   }
      // }

      // Expose the whole object to keep 2 way binding
      scope.messages = Messages;

      scope.close = function(index){
        Messages.remove(index);
      };

    }
  };
});
