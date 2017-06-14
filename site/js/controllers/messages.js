'use strict';
/*=============================================*\

  Messages

\*=============================================*/


angular.module('chamSocial')


/**
 * The latest messages
 */
.controller('MessageCtrl', function($scope, Message) {
  $scope.messages = {};
  Message.query({ offset: 0, limit: 50 }, function(data) {
    $scope.messages = data.messages;
  });
})

/**
 * View a message thread
 */
.controller('MessageSingleCtrl', function($scope, Message, $stateParams, Messages) {
  $scope.messages = [];

  // Get all messages
  Message.get({ id: $stateParams.id }, function(data) {
    $scope.subject = data.meta.subject;
    $scope.messages = data.messages;
    $scope.users = data.meta.users;
  });

  // Reply form "model"
  $scope.reply = {
    message: ''
  };

  // Submit the message reply
  $scope.submit = function(reply) {

    // If invalid form just return
    if($scope.replyMessageForm.$invalid) { return false; }

    // Send the reply
    $scope.submitting = true;
    Message.reply({ id: $stateParams.id }, reply, function(res) {

      $scope.messages.push(res.message);

      // Display success message and clear the form
      Messages.add({ text: 'Reply sent.', type: 'direct', status: 'success' });
      $scope.reply.message = '';
      $scope.replyMessageForm.$setPristine(); // Set the form as untouched
      $scope.submitting = false;
    }, function() {
      Messages.add({ text: 'Failed to send reply', type: 'direct' });
      $scope.submitting = false;
    });
  };

})

/**
 * Write a new message
 */
.controller('MessageCreateCtrl',
  function($scope, Message, UserAPI, $state, $stateParams, Messages)
{

  $scope.dbUsers = [];
  $scope.message = {
    users: []
  };

  if($stateParams.subject) {
    $scope.message.subject = decodeURIComponent($stateParams.subject);
  }

  if($stateParams.slug) {
    UserAPI.get({ slug: $stateParams.slug }, function(data) {
      $scope.message.users.push(data.users);
    });
  }

  $scope.getUsers = function(value) {
    if(value.length >= 2){
      UserAPI.search({ username: value }, function(data) {
        $scope.dbUsers = data.users;
      });
    }
    // $scope.dbUsers.push({ id: 23123, username: 'Nasse' });
  };

  $scope.submit = function submitMessage(message) {
    $scope.submitting = true;

    if($scope.createMessageForm.$invalid) {
      $scope.submitting = false;
      return false;
    }

    Message.save(message, function() {
      Messages.add({ text: 'The message was created and sent', status: 'success' });
      $state.go('app.messages'); // + resp.messages.id);
    }, function(res) {
      if(res.data.error && typeof res.data.error !== 'string' ) {
        var error_message = 'The following errors occured: \n';
        for( var field in res.data.error ) {
          error_message += ' '+ field +' '+ res.data.error[field] +' \n';
        }
        Messages.add({ text: error_message, type: 'direct' });
      } else if(res.data.error) {
          Messages.add({ text: res.data.error, type: 'direct' });
      }else {
        Messages.add({ text: 'Something wen\'t wrong on the server, try again.', type: 'direct' });
      }
      $scope.submitting = false;
    });
  };

});
