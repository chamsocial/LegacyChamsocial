'use strict';
/*=============================================*\

  Auth

\*=============================================*/


// TODO: Message service fist should be string

angular.module('chamSocial')



//
// Signup
//
.controller('SignupCtrl', function($scope, Auth, chamGlobal, $state, Messages) {

  // The error messages for the inputs
  $scope.messages = {
    username: {
      required: 'The username is required',
      minlength: 'It has to be longer than that',
      maxlength: 'Oh, that\'s a bit toooo long',
      pattern: 'Invalid character:'
    },
    email: {
      required: 'Give us a email.',
      email: 'Cmon it has to be a real email'
    },
    password: {
      required: 'Give us a password.',
      minlength: 'A little longer than your goldfish'
    }
  };

  // Get the current language to pre-populate the language field
  $scope.user = {
    lang: chamGlobal.lang
  };

  // Submit the signup form
  $scope.submit = function(user) {

    // only submit if the form is valid
    if ($scope.signupForm.$valid) {

      // Set submitting to the directive to disable the button
      $scope.submitting = true;

      // Try to create the user
      Auth.create(user).then(function(res) {

        if (res.users && res.mailErrors) {
          Messages.add({
            text: res.mailErrors,
            status: 'info'
          });
        } else {
          Messages.add({
            text: "We've sent you a verification email; please open it and click the button in it to activate your account.",
            status: 'success'
          });
        }

        // Redirect on success
        $state.go('app.home');

      // Something went wrong
      }, function() {

        // Make the button clickable again and show an error message
        $scope.submitting = false;

        Messages.add({
          text: 'Please check that you have filled in all fields correctly',
          type: 'direct'
        });
      });
    }
  };

})


.controller('ActivateUserCtrl', function($stateParams, $state, Auth, Messages) {
  Auth.activate($stateParams.code).then(function(res) {

    Auth.setLogin(res);
    Messages.add({
      text: 'Your account has been activated and you are now logged in',
      status: 'success'
    });
    $state.go('app.home');

  }, function(err) {
    if(err.data && err.data.error) {
      Messages.add(err.data.error);
    }
    $state.go('app.home');
  });
})





//
//   Login
//
.controller('LoginCtrl', function($scope, Auth, $state, Messages) {

  /**
   * @todo Remove fake credentials
   */
  $scope.credentials = { username: '', password: '' };

  // Submit login
  $scope.submit = function(credentials, stay) {

    // Disable button
    $scope.submitting = true;

    // Check credentials
    Auth.login(credentials).then(function(resp) {

      // Go home or redirect page with welcome message
      var type = stay ? 'direct' : 'flash';
      Messages.add({ text: 'Welcome, '+ resp.user.username +'!', status: 'success', type: type });

      // Set on Auth service
      $state.go(resp.redirect.name, resp.redirect.params);

    // Oups wrong data
    }, function(err) {

      // Enable submit button
      $scope.submitting = false;

      // Display error message with wrong login credentials or server error
      if(err.data && err.data.error){
        if(err.data.error.type) {
          Messages.add({ text: err.data.error.message, type: 'direct' });
        } else {
          Messages.add({ text: err.data.error, type: 'direct' });
        }
      }else{
        var m = '';
        try {
          m = JSON.stringify(err);
        } catch (e) {
          m = err;
        }

        Messages.add({
          text: 'Something went wrong, please try again.'+ m,
          type: 'direct'
        });
      }
    });
  };
})





//
//   Forgot password
//
.controller('ForgotPasswordCtrl', function($scope, Auth, $state, Messages) {

  $scope.userIdentifier = '';
  $scope.forgotPassword = function(userIdentifier) {
    $scope.submitting = true;

    Auth.forgotPassword(userIdentifier)
      .then(function() {

          // Go back to loggin with a message
          Messages.add({ text: 'A password reset link has been sent to your email.', status: 'success' });
          $state.go('app.login');

        }, function(err) {
          $scope.submitting = false;

          // If the user could not be found
          if(err.data && err.data.error) {
            Messages.add({ text: err.data.error, type: 'direct', status: 'warning' });
          } else {
            Messages.add({ text: 'A server error occurred, please try again.', type: 'direct' });
          }
        });
  };

})



//
// Reset password
//
.controller('ResetPasswordCtrl', function($scope, Auth, $state, Messages, $stateParams) {

  $scope.newPassword = '';
  $scope.username = $stateParams.username;

  $scope.resetPassword = function(newPassword) {

    // Validate password
    if(newPassword.length < 6) {
      Messages.add({ text: 'The password must be at least 6 characters long.', type: 'direct' });
      return;
    }

    $scope.submitting = true;

    var data = {
      password: newPassword,
      token: $stateParams.token
    };
    Auth.resetPassword(data)
      .then(function(res) {
        Auth.setLogin(res.data);
        Messages.add({ text: 'Your password has been reset and you have been logged in', status: 'success' });
        $state.go('app.home');
      }, function(res) {
        $scope.submitting = false;
        if(res.data.error && res.data.error.message) {
          Messages.add({ text: res.data.error.message, type: 'direct' });
        }
      });
  };

})



//
// Logout
//
.controller('LogoutCtrl', function($state, Auth, Messages) {

  // Logout
  Auth.logout();

  // Redirect home with message
  Messages.add({ text: 'You have now successfully logged out.', status: 'success' });
  $state.go('app.home');
});
