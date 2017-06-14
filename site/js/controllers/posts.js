/*=============================================*\

  Posts

\*=============================================*/
'use strict';

angular.module('chamSocial')



/*=============================================*\
  List posts
\*=============================================*/

.controller('PostListCtrl', function($scope, Post, $stateParams, $state, Group) {

  $scope.total = 0;
  $scope.currentPage = $stateParams.page || 1;
  $scope.maxSize = 6;
  $scope.itemsPerPage = 20;
  $scope.search = $stateParams.q;

  $scope.conf = {};

  // Display the group title if a group is selected
  if($stateParams.group) {
    Group.list.then(function(res) {
      for(var i = 0; i < res.data.length; i++) {
        if(res.data[i].slug === $stateParams.group) {
          $scope.group = res.data[i];
          break;
        }
      }
    });
  }

  $scope.pageChanged = function() {

    // if total is not set yet return and wait
    if(!$scope.total) return;

    if($scope.group) {
      $state.go('app.group_pagination', { group: $scope.group.slug, page: $scope.currentPage });
    } else {
      $state.go('app.pagination', { page: $scope.currentPage, q: $scope.search });
    }
  };

  $scope.doSearch = function() {
    $state.go('app.posts', { q: $scope.search });
  };

  var args = {
    page: $scope.currentPage,
    limit: $scope.itemsPerPage,
    q: $stateParams.q
  };
  if($stateParams.group) {
    args.group = $stateParams.group;
  }


  Post.query(args, function(data) {

    var posts = [],
        current = '';
    for(var i = 0; i < data.posts.length; i++) {
      var now = moment(data.posts[i].created_at).format('YYYY MM DD');
      if(current != now) {
        posts.push({ divider: data.posts[i].created_at });
        current = now;
      }
      posts.push(data.posts[i]);
    }

    $scope.posts = posts;


    $scope.total = data.meta.total;

    // needed for setting the correct page when the real data arrives
    $scope.currentPage = $stateParams.page || 1;
  });
})



/*=============================================*\
  Create
\*=============================================*/

.controller('PostCreateCtrl', function($scope, Post, $http, $state, chamGlobal, Messages) {

  // Set up new post object
  $scope.post = {
    publish: false
  };


  // Load all the groups
  $scope.groups = [];
  $http.get('/v1/groups').then(function(res){
    $scope.groups = res.data;
  }, function(){
    window.alert('Groups could not load');
  });


  // Send the new post
  $scope.submit = function(post) {

    // Check if valid
    if(!$scope.createPostForm.$invalid) {

      // View post or add images view on success create
      $scope.submitting = true;
      Post.save(post, function(res) {
        if (post.publish) {
          $state.go('app.single_post', { slug: res.posts.slug});
        } else {
          $state.go('app.add_images', { slug: res.posts.slug });
        }
      }, function(err){
        $scope.submitting = false;
        Messages.add({ text: 'Failed to create the post, please try again.', type: 'direct' });
        console.log('Err: ', err);
      });
    }
  };

})


/*=============================================*\
  Add images
\*=============================================*/

.controller('PostAddImagesCtrl', function($scope, $state, $stateParams, Post, Media) {

  // Used for plupload
  $scope.postId = $stateParams.slug;

  // $scope.maxImages = 8;
  $scope.percent = '';
  $scope.images = {};

  Post.media({ slug: $stateParams.slug }, function(res) {
    angular.forEach(res.items, function(item) {
      $scope.images[item.id] = item;
    });
  });


  $scope.openOverlay = function(image) {
    image.overlay = true;
  };
  $scope.hideOverlay = function(image) {
    image.overlay = false;
  };

  // Remove the image
  $scope.remove = function(image) {
    Media.delete({ id: image.id }, function() {
      delete $scope.images[image.id];
    });
  };


  $scope.publish = function() {
    $scope.submitting = true;
    Post.publish({ slug: $stateParams.slug }, function() {
      $state.go('app.single_post', { slug: $stateParams.slug });
    });
  };

})



/*=============================================*\
  Singe post
\*=============================================*/

.controller('PostCtrl', function($scope, $anchorScroll, $timeout, post, $state, $location) {

  $scope.post = post.posts;
  $scope.media = post.included.media || [];
  $scope.comments = post.included.comments || [];

  // Scroll to comment
  if($location.hash()) {
    $timeout(function() { $anchorScroll(); }, 100);
  }

  $scope.overrideLang = false;
  $scope.changeContentLang = function() {
    $scope.overrideLang = !$scope.overrideLang;
  };

  $scope.privateReply = function(e, user_slug, title) {
    e.preventDefault();
    $state.go('app.message_create', { slug: user_slug, subject: encodeURIComponent('Reply to: '+ title) });
  }

  // Reply to comment
  $scope.reply = {};
  $scope.replyTo = function(comment){
    $scope.reply = comment;
    $timeout(function() {
      $anchorScroll();
    }, 100);
  };
  $scope.cancelReply = function(){ $scope.reply = {}; };
})



/*=============================================*\
  Create comment
\*=============================================*/

.controller('CommentCtrl', function($scope, Comment, $stateParams, $timeout, chamGlobal) {

  // The comment and event message
  $scope.comment = {};
  $scope.message = {};

  function comment_remove_message() {
    $timeout(function() {
      $scope.message = {};
    }, 3000);
  }

  // Save the comment
  $scope.submit = function submitComment(comment) {

    if ($scope.commentForm.$invalid) return false;

    $scope.submitting = true;

    // Get the main post slug
    comment.slug = $stateParams.slug;

    // Reply
    if($scope.reply) comment.parent_id = $scope.reply.id;

    // Call the APi to save
    Comment.save(comment, function(resp) {

      var comment = resp.comment;
      comment.is_new = true;

      // add the comment to the array
      $scope.$parent.comments = insert_new_comment($scope.$parent.comments, comment);

      // Add a success message
      $scope.message.cssClass = 'alert-success';
      $scope.message.text = 'Your comment has been added!';
      comment_remove_message();
      // $scope.text = resp.comments.content;

      // Allow submit again after a few seconds
      $timeout(function() {
        $scope.submitting = false;
      }, 1000);

      // Reset the form
      $scope.comment = {};
      $scope.commentForm.$setPristine();
      $scope.cancelReply();
    }, function() {

      // Show a warning
      $scope.message.cssClass = 'alert-danger';
      $scope.message.text = 'Something went wrong please try again.';
      comment_remove_message();
      $scope.submitting = false;
    });
    // console.log(comment);
  };
});


function insert_new_comment(comments, comment, done) {
  if(done) return comments;
  if(!comment.parent_id) {
    comments.push(comment);
    return comments;
  }
  return comments.map(function(c) {
    if(c.id === comment.parent_id) {
      c.children.push(comment);
      done = true;
    } else if(c.children.length) {
      c.children = insert_new_comment(c.children, comment);
    }
    return c;
  });
}
