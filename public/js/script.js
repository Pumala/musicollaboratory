// var app = angular.module('music_app', ['ui.router', 'ngCookies']);
//
// app.config(function($stateProvider, $urlRouterProvider) {
//   $stateProvider
//   .state({
//     name: 'home',
//     url: '/',
//     templateController: 'templates/home.html',
//     controller: 'HomeController'
//   })
//   .state({
//     name: 'login',
//     url: '/login',
//     templateController: 'templates/login.html',
//     controller: 'LoginController'
//   })
//   .state({
//     name: 'signup',
//     url: '/signup',
//     templateController: 'templates/signup.html',
//     controller: 'SignupController'
//   })
//   .state({
//     name: 'projects',
//     url: '/projects',
//     templateController: 'templates/projects.html',
//     controller: 'ProjectsController'
//   })
//   .state({
//     name: 'newproject',
//     url: '/new/project',
//     templateController: 'templates/new_project.html',
//     controller: 'NewProjectsController'
//   });
//
//   $urlRouterProvider.otherwise('/');
//
// })
//
// app.factory('MusicFactory', function($http) {
//   var service = {};
//
//   service.uploads = function(file) {
//     var url = '/api/upload';
//     return $http({
//       method: 'POST',
//       url: url
//     });
//   };
//
//   return service;
// })
//
// app.controller('HomeController', function($scope, $state) {
//
// });
//
// app.controller('SignupController', function($scope, $state) {
//
// });
//
// app.controller('LoginController', function($scope, $state) {
//
// });
//
//
// app.controller('ProjectsController', function($scope, MusicFactory) {
//   console.log('hellow inside the projects');
//   // $scope.uploadFile = function(file) {
//   //   MusicFactory.uploads(file)
//   //     .then(function(results) {
//   //       console.log('Here are the file results:', results);
//   //     })
//   //     .catch(function(err) {
//   //       console.log('Error uploading files...:', err.message);
//   //     });
//   // }
//
// });
//
// app.controller('NewProjectsController', function($scope, MusicFactory) {
//   console.log('reached new projects controller');
// });

// 'use strict';
//
//
// angular
//
//
//     .module('app', ['angularFileUpload'])
//
//
//     .controller('AppController', ['$scope', 'FileUploader', function($scope, FileUploader) {
//         var uploader = $scope.uploader = new FileUploader({
//             url: '/api/upload' // /api/upload
//         });
//
//         // FILTERS
//
//         // a sync filter
//         uploader.filters.push({
//             name: 'syncFilter',
//             fn: function(item /*{File|FileLikeObject}*/, options) {
//                 console.log('syncFilter');
//                 return this.queue.length < 10;
//             }
//         });
//
//         // an async filter
//         uploader.filters.push({
//             name: 'asyncFilter',
//             fn: function(item /*{File|FileLikeObject}*/, options, deferred) {
//                 console.log('asyncFilter');
//                 setTimeout(deferred.resolve, 1e3);
//             }
//         });
//
//         // CALLBACKS
//
//         uploader.onWhenAddingFileFailed = function(item /*{File|FileLikeObject}*/, filter, options) {
//             console.info('onWhenAddingFileFailed', item, filter, options);
//         };
//         uploader.onAfterAddingFile = function(fileItem) {
//             console.info('onAfterAddingFile', fileItem);
//         };
//         uploader.onAfterAddingAll = function(addedFileItems) {
//             console.info('onAfterAddingAll', addedFileItems);
//         };
//         uploader.onBeforeUploadItem = function(item) {
//             console.info('onBeforeUploadItem', item);
//         };
//         uploader.onProgressItem = function(fileItem, progress) {
//             console.info('onProgressItem', fileItem, progress);
//         };
//         uploader.onProgressAll = function(progress) {
//             console.info('onProgressAll', progress);
//         };
//         uploader.onSuccessItem = function(fileItem, response, status, headers) {
//             console.info('onSuccessItem', fileItem, response, status, headers);
//         };
//         uploader.onErrorItem = function(fileItem, response, status, headers) {
//             console.info('onErrorItem', fileItem, response, status, headers);
//         };
//         uploader.onCancelItem = function(fileItem, response, status, headers) {
//             console.info('onCancelItem', fileItem, response, status, headers);
//         };
//         uploader.onCompleteItem = function(fileItem, response, status, headers) {
//             console.info('onCompleteItem', fileItem, response, status, headers);
//         };
//         uploader.onCompleteAll = function() {
//             console.info('onCompleteAll');
//         };
//
//         console.info('uploader', uploader);
//     }]);


  // window.URL = window.URL || window.webkitURL;
  //
  // var fileSelect = document.getElementById("fileSelect"),
  //     fileElem = document.getElementById("fileElem"),
  //     fileList = document.getElementById("fileList");
  //
  // fileSelect.addEventListener("click", function (e) {
  //   if (fileElem) {
  //     fileElem.click();
  //   }
  //   e.preventDefault(); // prevent navigation to "#"
  // }, false);
  //
  // function handleFiles(files) {
  //   console.log('FILES YES:', files);
  //   if (!files.length) {
  //     fileList.innerHTML = "<p>No files selected!</p>";
  //   } else {
  //     fileList.innerHTML = "";
  //     var list = document.createElement("ul");
  //     fileList.appendChild(list);
  //     for (var i = 0; i < files.length; i++) {
  //       var li = document.createElement("li");
  //       list.appendChild(li);
  //
  //       var img = document.createElement("img");
  //       img.src = window.URL.createObjectURL(files[i]);
  //       img.height = 60;
  //       img.onload = function() {
  //         window.URL.revokeObjectURL(this.src);
  //       }
  //       li.appendChild(img);
  //       var info = document.createElement("span");
  //       info.innerHTML = files[i].name + ": " + files[i].size + " bytes";
  //       li.appendChild(info);
  //     }
  //   }
  // }
