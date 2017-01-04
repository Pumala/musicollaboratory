var app = angular.module('musicollab_app', ['ui.router', 'ngCookies', 'angularFileUpload']);

// ====================
// STATES
// ====================
app.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider
  .state({
    name: "home",
    url: "/",
    templateUrl: "templates/home.html",
    controller: "HomeController"
  })
  .state({
    name: "signup",
    url: "/signup",
    templateUrl: "templates/signup.html",
    controller: "SignUpController"
  })
  .state({
    name: "login",
    url: "/login",
    templateUrl: "templates/login.html",
    controller: "LoginController"
  })
  .state({
    name: "projects",
    url: "/projects",
    templateUrl: "templates/allprojects.html",
    controller: "ProjectsController"
  })
  .state({
    name: "search",
    url: "/search",
    templateUrl: "templates/search.html",
    controller: "SearchController"
  })
  .state({
    name: 'newproject',
    url: '/new/project',
    templateUrl: 'templates/new_project.html',
    controller: 'NewProjectsController'
  })
  .state({
    name: 'requests',
    url: '/profile/{username}/requests',
    templateUrl: 'templates/requests.html',
    controller: 'RequestsController'
  })
  .state({
    name: "myproject",
    url: "/project/{project_id}",
    templateUrl: "templates/myproject.html",
    controller: "UserProjectsController"
  })
  .state({
    name: "myprojectuploader",
    url: "/myproject/{projectid}/upload",
    params: { projectid : null},
    templateUrl: "templates/new_project_file.html",
    controller: "ProjectFileController"
  })
  .state({
    name: "profile",
    url: "/profile/{username}",
    templateUrl: "templates/user_profile.html",
    controller: "UserController"
  });

  $urlRouterProvider.otherwise('/');
});

app.factory('MusicFactory', function($http, FileUploader, $rootScope, $state, $cookies) {
  var service = {};

  $rootScope.factoryCookieData = $cookies.getObject('cookieData') ? $cookies.getObject('cookieData') : null;
  console.log('factory cookies?:', $cookies.getObject('cookieData'));
  if ($rootScope.factoryCookieData) {
    $rootScope.rootUsername = $cookies.getObject('cookieData')._id;
    $rootScope.rootToken = $cookies.getObject('cookieData').token.id;

    console.log('root token???', $cookies.getObject('cookieData').token.id);
  }

  $rootScope.rootLogout = function() {
    var url = '/api/logout';
    return $http({
      method: 'PUT',
      url: url,
      data: {
        username: $rootScope.rootUsername,
        token: $rootScope.rootToken
      }
    })
    .then(function(results) {
      console.log(results);
      // reset $rootScope variables
      $rootScope.factoryCookieData = null;
      $rootScope.rootUsername = null;
      $rootScope.rootToken = null;
      // remove the cookie
      $cookies.remove('cookieData');
      $state.go('home');

    })
    .catch(function(err) {
      console.log('err logging out:', err.message);
    })
  }

  service.addNewProject = function(newProjectInfo) {
    var url = '/api/new/project';
    return $http({
      method: 'POST',
      url: url,
      data: newProjectInfo
    });
  };

  service.allProjects = function() {
    var url = '/api/search/allprojects';
    return $http({
      method: 'GET',
      url: url
    });
  };

  service.searchProjects = function(needsInfo) {
    var url = '/api/search/projects';
    return $http({
      method: 'POST',
      url: url,
      data: {
        needsInfo: needsInfo
      }
    });
  };

  service.getProjectDetails = function(projectId, edit) {
    var url = '/api/project/' + projectId + '/' + $rootScope.rootUsername + '/' + edit;
    console.log('URL?:', url);
    return $http({
      method: 'GET',
      url: url
    });
  };

  service.sendRequest = function(requestInfo) {
    console.log('hello want to send request:', requestInfo);
    var url = '/api/request/new';
    return $http({
      method: 'POST',
      url: url,
      data: requestInfo
    });
  };

  service.submitNewUser = function(newUserInfo) {
    var url = '/api/signup';
    return $http({
      method: 'POST',
      url: url,
      data: newUserInfo
    });
  };

  service.submitLoginInfo = function(loginInfo) {
    var url = '/api/login';
    return $http({
      method: 'POST',
      url: url,
      data: loginInfo
    });
  };

  service.getUserProfile = function(username) {
    var url = "/api/profile/" + username;
    return $http({
      method: 'GET',
      url: url
    });
  };

  service.FileUploadService = function(projectId) {
    console.log('project exists?:', projectId);
    var url = "/api/project/file/upload/" + projectId;
    return $http({
      method: 'GET',
      url: url
    });
  };

  service.getRequests = function() {
    var url = '/api/requests/' + $rootScope.rootUsername;
    return $http({
      method: 'GET',
      url: url
    });
  };

  service.deleteRequest = function(requestId) {
    var url = '/api/request/delete/' + requestId;
    return $http({
      method: 'DELETE',
      url: url
    });
  };

  service.serviceAcceptRequest = function(requestInfo) {
    var url = '/api/request/accept';
    return $http({
      method: 'PUT',
      url: url,
      data: {
        requestInfo: requestInfo,
        projectOwner: $rootScope.rootUsername
      }
    });
  };

  service.removeFile = function(fileId, projectId) {
    var url = '/api/' + projectId + '/file/remove/' + fileId;
    return $http({
      method: 'DELETE',
      url: url
    });
  };

  service.deleteProject = function(projectId) {
    var url = '/api/remove/project/' + projectId;
    return $http({
      method: 'DELETE',
      url: url
    });
  };

  service.projectIsComplete = function(projectId, isCompleted) {
    var url = '/api/complete/project';
    return $http({
      method: 'PUT',
      url: url,
      data: {
        projectId,
        isCompleted: isCompleted
      }
    });
  };

  service.saveEdits = function(projectId, updatedProjectInfo) {
    var url = '/api/edit/project';
    return $http({
      method: 'PUT',
      url: url,
      data: {
        projectId: projectId,
        projectInfo: updatedProjectInfo
      }
    });
  };

  service.updateBio = function(bio) {
    var url = '/api/edit/user/bio';
    return $http({
      method: 'PUT',
      url: url,
      data: {
        bio: bio,
        username: $rootScope.rootUsername
      }
    });
  };

  service.addNewComment = function(commentObj) {
    var url = '/api/comment/new';
    return $http({
      method: 'POST',
      url: url,
      data: commentObj
    });
  };

  service.removeComment = function(commentId) {
    var url = '/api/comment/delete/' + commentId;
    return $http({
      method: 'DELETE',
      url: url
    });
  };

  service.saveProjectComment = function(commentId, content) {
    var url = '/api/comment/save';
    return $http({
      method: 'PUT',
      url: url,
      data: {
        commentId: commentId,
        content: content
      }
    })
  }

  return service;

});

// need to reload page to reflect new and removed files!!
app.controller('FileController', function($timeout, $scope, $rootScope, $state, FileUploader) {
  // var uploader = $scope.uploader = new FileUploader({
  //   url: '/upload'
  // });
  console.log('id here?', $scope.projectId);
  var uploader = $scope.uploader = new FileUploader({
    url: '/api/upload/' + $rootScope.rootUsername + '/' + $scope.projectId
  });
    // .then(function() {
    //   console.log('wake up!');
    // })
    // .catch(function(err) {
    //   console.log('NOOOOOO!');
    // });
  //
  // uploader.uploadAll = function() {
  //   $timeout(function () {
  //     $state.reload();
  //     // $state.go('myprojectuploader', { projectid: $scope.projectId });
  //     console.log('proj iddd?:', $scope.projectId);
  //     console.info('onCompleteAll');
  //   }, 2000);
  // };
});

// takes control of user avatars
app.controller('UserAvatarController', function($timeout, $scope, $rootScope, $state, FileUploader) {

  var uploader = $scope.uploader = new FileUploader({
    url: '/api/upload/avatar/user/' + $rootScope.rootUsername
  });

});

// takes control of projects avatar
app.controller('ProjectAvatarController', function($timeout, $scope, $rootScope, $state, FileUploader) {

  console.log('id here?', $scope.projectId);
  var uploader = $scope.uploader = new FileUploader({
    url: '/api/upload/avatar/project/' + $scope.projectId + '/' + $rootScope.rootUsername
  });

});

app.controller('ProjectFileController', function($scope, MusicFactory, $state, $stateParams, $rootScope) {
  console.log('params anyone?:', $stateParams);
  $scope.projectId = $stateParams.projectid;

  $scope.deleteFile = function(fileId) {
    MusicFactory.removeFile(fileId, $scope.projectId)
      .then(function() {
        $state.reload();
        console.log('success deleting file!');
      })
      .catch(function(err) {
        console.log('error removing file:', err.message);
      });
  }

  MusicFactory.FileUploadService($scope.projectId)
    .then(function(projectInfo) {
      console.log('sucess sending project info!', projectInfo.data);
      $scope.projectInfo = projectInfo.data.projectInfo;
      $scope.allFiles = projectInfo.data.allFiles;
    })
    .catch(function(err) {
      console.log('err in ProjectFileController', err.stack);
    })
});

app.controller('HomeController', function($scope, $state) {

});

// ********************************
//          REQUEST CONTROLLER
// *******************************
app.controller('RequestsController', function($scope, $stateParams, MusicFactory, $state) {
  $scope.username = $stateParams.username;
  $scope.typeRequest = {};

  MusicFactory.getRequests()
    .then(function(results) {
      console.log('pending.....', results);
      $scope.receiveRequests = results.data.receiveRequests;
      $scope.receiveProjects = results.data.receiveProjects;
      $scope.sendRequests = results.data.sendRequests;
      $scope.sendProjects = results.data.sendProjects;

      $scope.receiveRequests.forEach(function(request, index) {
        $scope.receiveProjects.forEach(function(project) {
          if (String(request.projectId) === String(project._id)) {
            request.projectName = project.name;
          } else {
            console.log('NOPEE');
          }
        });
      });

      $scope.sendRequests.forEach(function(request, index) {
        $scope.sendProjects.forEach(function(project) {
          if (String(request.projectId) === String(project._id)) {
            request.projectName = project.name;
          } else {
            console.log('NOPEE');
          }
        });
      });

    })
    .catch(function(err) {
      console.log('err getting requests:', err.message);
    });

    $scope.declineRequest = function(requestId) {
      console.log('UMMMM:', requestId);
      MusicFactory.deleteRequest(requestId)
        .then(function(results) {
          console.log('success deleting request::', results);
          $state.reload();
        })
        .catch(function(err) {
          console.log('error deleting request::', err.message);
        });
    }
    $scope.acceptRequest = function(requestId, projectId, username, projectName) {
      console.log('type request obj::', $scope.typeRequest);
      var requestObj = {
        requestId: requestId,
        typeRequest: $scope.typeRequest,
        projectId: projectId,
        username: username,
        projectName: projectName
      };
      console.log('new reqest obj::', requestObj);

      MusicFactory.serviceAcceptRequest(requestObj)
        .then(function(results) {
          console.log('success accepting request::', results);
          $state.reload();
        })
        .catch(function(err) {
          console.log('error accepting request::', err.message);
        });
    }

});

// **************************************
//          PLAY AUDIO CONTROLLER
// *************************************
// app.controller()
// ********************************
//          USER CONTROLLER
// *******************************
app.controller('UserController', function($scope, $sce, $state, $stateParams, MusicFactory) {
  $scope.currUser = $stateParams.username;
  $scope.edit = false;

  console.log('hello');

  $scope.editBio = function() {
    $scope.edit = true;
  }

  $scope.cancelEditBio = function() {
    $scope.edit = false;
  }

  $scope.saveBio = function() {
    console.log($scope.description);
    MusicFactory.updateBio($scope.description)
    .then(function(results) {
      $state.reload();
      console.log('updated user bio:', results);
    })
    .catch(function(err) {
      console.log('encountered errors updating user bio:', err.message);
    });

  }

  $scope.getAudioUrl = function(fileHash, currProjectName, currProjectId) {
    console.log(fileHash);
    $scope.audioTrack = $sce.trustAsResourceUrl('/upload/' + fileHash);
    $scope.currProjectName = currProjectName;
    $scope.currProjectId = currProjectId;
  };

  // $scope.checkCurrentProjects = function() {
  //   var completedArr = $scope.allProjects.filter(function(project) {
  //     return project.completed === true;
  //   });
  //   if (completedArr.length === 0) {
  //     return true;
  //   } else {
  //     return false;
  //   }
  // };
  //
  // $scope.checkCompletedProjects = function() {
  //   var completedArr = $scope.allProjects.filter(function(project) {
  //     return project.completed === true;
  //   });
  //   if (completedArr.length === 0) {
  //     return false;
  //   } else {
  //     return true;
  //   }
  // };

  $scope.allAudios = ["mp3", "wav", "m4a"];

  $scope.isAudioFile = function(filename) {
    var etx = filename.split(".").pop();
    var index = $scope.allAudios.indexOf(etx);
    if (index > -1) {
      return true;
    } else {
      return false;
    }
  };

  // makes a service call to pass data to the backend to render the user profile page
  MusicFactory.getUserProfile($scope.currUser)
    .then(function(results) {
      console.log('user profile results:', results);
      $scope.allProjects = results.data.allProjects;
      $scope.userInfo = results.data.userInfo;
      $scope.description = results.data.userInfo.bio.length === 0 ? "Add a bio..." : results.data.userInfo.bio;
    })
    .catch(function(err) {
      console.log('encountered errors retrieving user profile data', err.message);
    });

    // $scope.getAudioUrl = function(fileHash) {
    //   return $sce.trustAsResourceUrl('/upload/' + fileHash);
    // };

});

// ********************************
//          SIGN UP CONTROLLER
// *******************************
app.controller('SignUpController', function($scope, $state, $rootScope, $cookies, MusicFactory) {

  $scope.submitSignUp = function() {
    if ($scope.password === $scope.confirm_password) {
      var signUpInfo = {
        firstName: $scope.firstName,
        lastName: $scope.lastName,
        username: $scope.username,
        email: $scope.email,
        password: $scope.password
      };
    } else {
      return;
    }
    MusicFactory.submitNewUser(signUpInfo)
      .then(function(results) {
        console.log('results submitting new user info:', results.data.userInfo);
        $rootScope.rootUsername = results.data.userInfo._id;
        $rootScope.rootToken = results.data.userInfo.token.id;

        $cookies.putObject('cookieData', results.data.userInfo);
        $rootScope.factoryCookieData = $cookies.putObject('cookieData', results.data.userInfo);

        $state.go('profile', { username: $rootScope.rootUsername});
      })
      .catch(function(err) {
        console.log('error submitting new user info:', err.message);
      });
  }

});

app.controller('LoginController', function($scope, $state, $cookies, $rootScope, MusicFactory) {

  $scope.submitLogin = function() {
    var submitInfo = {
      username: $scope.username,
      password: $scope.password
    };
    MusicFactory.submitLoginInfo(submitInfo)
      .then(function(results) {
        console.log('login results:', results);
        $scope.userInfo = results.data.userInfo;
        console.log('login info???:', $scope.userInfo);
        $rootScope.rootUsername = $scope.userInfo._id;
        $rootScope.rootToken = $scope.userInfo.token.id;
        $cookies.putObject('cookieData', $scope.userInfo);
        $rootScope.factoryCookieData = $scope.userInfo;
        // var userInfo = results.data.userInfo;
        // $rootScope.rootUsername = userInfo._id;
        // $rootScope.rootToken = userInfo.token.id;
        // $cookies.putObject('cookieData', userInfo);
        // $rootScope.factoryCookieData = userInfo;
        // console.log('success submitting login info', userInfo);
        $state.go('profile', {username: $rootScope.rootUsername});
      })
      .catch(function(err) {
        console.log('experienced err submitting login info:', err.message);
      });
  }

});

// PLAY AUDIO CONTROLLER
// app.controller('PlayAudioController', function($scope, $sce) {
//   $scope.getAudioUrl = function(fileHash, currProjectName, currProjectId) {
//     console.log(fileHash);
//     $scope.audioTrack = $sce.trustAsResourceUrl('/upload/' + fileHash);
//     $scope.currProjectName = currProjectName;
//     $scope.currProjectId = currProjectId;
//   };
// });

// ********************************
//          SEARCH CONTROLLER
// *******************************
app.controller('SearchController', function($scope, $state, $rootScope, $sce, MusicFactory) {
  $scope.needsMelody = false;
  $scope.needsLyrics = false;
  $scope.needsVoice = false;
  $scope.needsProduction = false;
  $scope.audioTrack = null;

  $scope.getAudioUrl = function(fileHash, currProjectName, currProjectId) {
    console.log(fileHash);
    $scope.audioTrack = $sce.trustAsResourceUrl('/upload/' + fileHash);
    $scope.currProjectName = currProjectName;
    $scope.currProjectId = currProjectId;
  };

  $scope.allAudios = ["mp3", "wav", "m4a"];

  $scope.isAudioFile = function(filename) {
    var etx = filename.split(".").pop();
    var index = $scope.allAudios.indexOf(etx);
    if (index > -1) {
      return true;
    } else {
      return false;
    }
  };

  // $scope.getAudioUrl = function(fileHash) {
  //   return $sce.trustAsResourceUrl('/upload/' + fileHash);
  // };

  $scope.searchProjects = function() {
    var needsInfo = {
      melody: $scope.needsMelody,
      lyrics: $scope.needsLyrics,
      voice: $scope.needsVoice,
      production: $scope.needsProduction
    };
    MusicFactory.searchProjects(needsInfo)
    .then(function(results) {
      $scope.allProjects = results.data;
      console.log('here are all the projects!!:', results.data);
    })
    .catch(function(err) {
      console.log('encountered error loading all projects:', err.message);
    });
  }

  $scope.reloadSearch = function() {
    $state.reload();
  };

  MusicFactory.allProjects()
    .then(function(results) {
      $scope.allProjects = results.data;
      console.log('here are all the projects!!:', results);
    })
    .catch(function(err) {
      console.log('encountered error loading all projects:', err.message);
    });
});

app.controller('ProjectsController', function($scope, $rootScope, $state) {

  console.log('hellow inside the projects');


});

app.controller('NewProjectsController', function($scope, $stateParams, $state, FileUploader, $rootScope, MusicFactory) {
  $scope.hasMelody  = false;
  $scope.hasLyrics = false;
  $scope.hasVoice = false;
  $scope.hasProduction = false;
  $scope.needsMelody = false;
  $scope.needsLyrics = false;
  $scope.needsVoice = false;
  $scope.needsProduction = false;

  $scope.createProject = function() {
    var newProject = {
      name: $scope.projectName,
      owner: $rootScope.rootUsername,
      description: $scope.description,
      has: {
        melody: $scope.hasMelody,
        lyrics: $scope.hasLyrics,
        voice: $scope.hasVoice,
        production: $scope.hasProduction
      },
      needs: {
        melody: $scope.needsMelody,
        lyrics: $scope.needsLyrics,
        voice: $scope.needsVoice,
        production: $scope.needsProduction
      }
    };
    MusicFactory.addNewProject(newProject)
      .then(function(results) {
        console.log('results from adding new project:', results);
        $state.go('myprojectuploader', { projectid : results.data.projectId });
      })
      .catch(function(err) {
        console.log('encountered error adding new project::', err.message);
      });
  }

});

app.controller('UserProjectsController', function($scope, $sce, $state, $stateParams, $rootScope, MusicFactory) {
  $scope.projectId = $stateParams.project_id;
  $scope.melody = false;
  $scope.lyrics = false;
  $scope.voice = false;
  $scope.production = false;
  $scope.editComment = false;
  // $scope.edit = false;

  console.log('ID......', $scope.projectId);
  // console.log('EDIT.........', $scope.edit);

  $scope.getAudioUrl = function(fileHash) {
    return $sce.trustAsResourceUrl('/upload/' + fileHash);
  };

  $scope.addComment = function(content) {
    var commentObj = {
      content: content,
      projectId: $scope.projectId,
      author: $rootScope.rootUsername
    };
    MusicFactory.addNewComment(commentObj)
      .then(function(results) {
        $state.reload();
        console.log('successfully added comment to db');
      })
      .catch(function(err) {
        console.log('experienced err add new comment to db:', err.message);
      });
  };

  $scope.saveProjectComment = function(commentId, content) {
    console.log('ID:', commentId);
    console.log('content:', content);
    MusicFactory.saveProjectComment(commentId, content)
      .then(function(results) {
        console.log('results updating comment from backend:', results);
        $state.reload();
        console.log('successfully saved comment');
      })
      .catch(function(err) {
        console.log('err save project comment', err.stack);
      })
    };

  $scope.deleteComment = function(commentId) {
    MusicFactory.removeComment(commentId)
      .then(function(results) {
        console.log('successfully deleted comment from db');
        $state.reload();
      })
      .catch(function(err) {
        console.log('experienced err deleting comment to db:', err.message);
      });
  }


  $scope.deleteFile = function(fileId) {
    MusicFactory.removeFile(fileId, $scope.projectId)
      .then(function() {
        $state.reload();
        $scope.edit = true;
        // console.log('editing is....', $scope.edit);
        console.log('success deleting file!');
      })
      .catch(function(err) {
        console.log('error removing file:', err.message);
      });
  }
  // console.log('edit status here', $scope.edit);

  MusicFactory.getProjectDetails($scope.projectId, $scope.edit)
    .then(function(results) {
      console.log('updated PROJECT DETAIL info', results);
      $scope.edit = results.data.editMode;
      if ($scope.edit === "true") {
        $scope.edit = true;
      } else {
        $scope.edit = false;
      }
      console.log('comment is a what......', $scope.editComment);
      console.log('loading edit', $scope.edit);
      $scope.allFiles = results.data.allFiles;
      $scope.allComments = results.data.allComments;

      $scope.alreadyRequested = results.data.alreadyRequested;
      $scope.project = results.data.projectInfo;
      $scope.projectId = results.data.projectInfo._id;
      $scope.owner = results.data.projectInfo.owner;
      $scope.requestedTypes = {};
      $scope.isCompleted = $scope.project.completed;
    })
    .catch(function(err) {
      console.log('encountered errors loading my projects detail page', err.message);
    });

    $scope.editProject = function() {
      $scope.hasMelody  = $scope.project.existingTypes.melody;
      $scope.hasLyrics = $scope.project.existingTypes.lyrics;
      $scope.hasVoice = $scope.project.existingTypes.voice;
      $scope.hasProduction = $scope.project.existingTypes.production;
      $scope.needsMelody = $scope.project.seekingTypes.melody;
      $scope.needsLyrics = $scope.project.seekingTypes.lyrics;
      $scope.needsVoice = $scope.project.seekingTypes.voice;
      $scope.needsProduction = $scope.project.seekingTypes.production;
      $scope.edit = true;
    };

    $scope.cancelProjectEdit = function() {
      $scope.edit = false;
      $state.reload();
    };

    $scope.saveProjectEdits = function(projectId) {
      console.log('DESCRIPT???', $scope.project.description);
      var updatedProjectObj = {
        description: $scope.project.description,
        has: {
          melody: $scope.hasMelody,
          lyrics: $scope.hasLyrics,
          voice: $scope.hasVoice,
          production: $scope.hasProduction
        },
        needs: {
          melody: $scope.needsMelody,
          lyrics: $scope.needsLyrics,
          voice: $scope.needsVoice,
          production: $scope.needsProduction
        }
      };
      console.log('updated project???', updatedProjectObj);

      MusicFactory.saveEdits(projectId, updatedProjectObj)
      .then(function(results) {
        $scope.edit = false;
        console.log('results updating project: ', results);
        $state.reload();
      })
      .catch(function(err) {
        console.log('encountered errors updating project:', err.message);
      });
    };

    $scope.deleteProject = function(projectId) {
      MusicFactory.deleteProject(projectId)
        .then(function(results) {
          console.log('any results removing project: ', results);
          $state.go('search');
        })
        .catch(function(err) {
          console.log('encountered errors deleting project:', err.message);
        });
    };

    $scope.completeProject = function(projectId, isCompleted) {
      MusicFactory.projectIsComplete(projectId, isCompleted)
        .then(function(results) {
          console.log('any results marking project complete: ', results);
          $state.reload();
        })
        .catch(function(err) {
          console.log('encountered errors marking project complete:', err.message);
        });
    };

    // for now, hard code sender until we have a $rootScope username
    // $scope.username = "Lulu";

    $scope.requestContribute = function() {

      // console.log('TYPE????:', $scope.checked)

      console.log('requestedTypes', $scope.requestedTypes);
      var requestTypes = {
        sender: $rootScope.rootUsername,
        owner: $scope.owner,
        description: $scope.description,
        request: $scope.requestedTypes,
        projectId: $scope.projectId
      };
      console.log('here are the request types::', requestTypes);

      MusicFactory.sendRequest(requestTypes)
        .then(function(results) {
          console.log('here are the request results:', results);
          $state.reload();
        })
        .catch(function(err) {
          console.log('error processing request to project owner:', err.message);
        });
    }

});
