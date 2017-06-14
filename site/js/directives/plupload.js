'use strict';

angular.module('chamSocial')

.directive('plupload', function($timeout, StorageService) {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      buttonText: '@',
      postId: '@',
      images: '=',
      total: '=',
      max: '@',
    },
    template: '<div id="container" class="pull-left">'+
        '<p><button id="pickfiles" ng-hide="total >= max" class="btn btn-primary btn-large">'+
          '{{ buttonText }}'+
        '</button></p>'+
      '</div>',
    link: function(scope) {

      // TODO? timeout so the scope.url is set
      $timeout(function() {

        var token = StorageService.get('token');

        var uploader = new plupload.Uploader({
          runtimes : 'html5,flash,silverlight,browserplus,html4',
          browse_button : 'pickfiles',
          container : 'container',
          file_data_name: 'image',
          url : '/v1/posts/'+ scope.postId +'/upload/',
          headers: {
            Authorization: 'Bearer ' + token
          },
          // chunk_size: '10kb',
          // Flash settings
          flash_swf_url : '/components/plupload/js/js/Moxie.swf',

          // Silverlight settings
          silverlight_xap_url : '/components/plupload/js/js/Moxie.xap',

          filters : {
            // prevent_duplicates: true,
            max_file_size : '10mb',
            mime_types: [
              { title : 'Image files', extensions : 'jpg,png,gif,pdf' }
            ]
          }
        });
        uploader.init();
        window.uploader = uploader;

        // TODO: add remove max causes an error
        uploader.bind('FilesAdded', function(up, files) { //up, files
          // console.log(up);
          // var num_files = scope.total;
          // var num_new_files = files.length;
          // var tot = (num_new_files + num_files);
          // var over = tot - scope.max;
          //
          // // Prevent uploading to many image
          // if (tot > scope.max) {
          //   up.splice(num_new_files - over);
          //   files.splice(num_new_files - over);
          //   up.refresh();
          //   alert('You have reached max number of images.');
          // }
          uploader.start();
          // Show the client-side preview using the loaded File.
          for ( var i = 0 ; i < files.length ; i++ ) {
            scope.$apply(function() {
              scope.images[files[i].id] = { file: files[i] };
            });
          }
        });

        // diplay the uploaded image
        uploader.bind('FileUploaded', function(up, file, res) {
          scope.$apply(function(){
            $timeout(function(){
              var image = JSON.parse(res.response).images;
              delete scope.images[file.id];
              scope.images[image.id] = image;

            }, 500);
          });
        });

        // Update upload status
        uploader.bind('UploadProgress', function(up, file) {
          scope.images[file.id].percent = file.percent;
          scope.$apply();
        });

        // The upload failed
        uploader.bind('Error', function(up, err) {
          delete scope.images[err.file.id];
          scope.$apply();

          window.alert('The file could not be uploaded. Please try again.');
        });


      });
    }
  };
});




// var uploader = new plupload.Uploader({
//     runtimes : 'html5,flash,silverlight,html4',

//     browse_button : 'pickfiles', // you can pass in id...
//     container: document.getElementById('container'), // ... or DOM Element itself

//     url : '/examples/upload',

//     filters : {
//         max_file_size : '10mb',
//         mime_types: [
//             {title : 'Image files', extensions : 'jpg,gif,png'},
//             {title : 'Zip files', extensions : 'zip'}
//         ]
//     },

//     // Flash settings
//     flash_swf_url : '/plupload/js/Moxie.swf',

//     // Silverlight settings
//     silverlight_xap_url : '/plupload/js/Moxie.xap',


//     init: {
//         PostInit: function() {
//             document.getElementById('filelist').innerHTML = '';

//             document.getElementById('uploadfiles').onclick = function() {
//                 uploader.start();
//                 return false;
//             };
//         },

//         FilesAdded: function(up, files) {
//             plupload.each(files, function(file) {
//                 document.getElementById('filelist').innerHTML += '<div id="' + file.id + '">' + file.name + ' (' + plupload.formatSize(file.size) + ') <b></b></div>';
//             });
//         },

//         UploadProgress: function(up, file) {
//             document.getElementById(file.id).getElementsByTagName('b')[0].innerHTML = '<span>' + file.percent + '%</span>';
//         },

//         Error: function(up, err) {
//             document.getElementById('console').innerHTML += '\nError #' + err.code + ': ' + err.message;
//         }
//     }
// });

// uploader.init();
