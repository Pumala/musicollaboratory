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
    url: '/profile/{username}/messages',
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

app.run(function($rootScope, $cookies, $http, $state) {
  $rootScope.factoryCookieData = $cookies.getObject('cookieData') ? $cookies.getObject('cookieData') : null;
  // console.log('factory cookies?:', $cookies.getObject('cookieData'));
  if ($rootScope.factoryCookieData) {
    $rootScope.rootUsername = $cookies.getObject('cookieData')._id;
    // $rootScope.rootToken = $cookies.getObject('cookieData').authToken.id;
    // console.log('root token???', $cookies.getObject('cookieData').authToken);
    // console.log('root user?', $rootScope.rootUsername);
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
    });
  };

})

app.factory('MusicFactory', function($http, FileUploader, $rootScope, $state, $cookies) {
  var service = {};

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

  service.getProjectDetails = function(projectId) {
    console.log('RED RED');
    console.log('project id is....', projectId);
    var url = '/api/project/' + projectId + '/' + $rootScope.rootUsername;
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
    var url = "/api/project/file/upload/new/" + projectId;
    return $http({
      method: 'GET',
      url: url
    });
  };

  service.getRequests = function() {
    console.log('on my goodnesss.....');
    var url = '/api/get/requests/' + $rootScope.rootUsername;
    return $http({
      method: 'GET',
      url: url
    });
  };

  service.declineRequest = function(requestInfo) {
    var url = '/api/request/decline';
    return $http({
      method: 'POST',
      url: url,
      data: requestInfo
    });
  };

  service.deleteRequest = function(requestId, in_or_out, user) {
    var url = '/api/request/delete/' + requestId + '/' + in_or_out + '/' + user;
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

  service.deleteProject = function(projectInfo) {
    console.log('do you know WHAT');
    var url = '/api/remove/project/';
    return $http({
      method: 'PUT',
      url: url,
      data: projectInfo
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

  service.removeComment = function(commentId, projectId) {
    var url = '/api/comment/delete/' + commentId + '/' + projectId;
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
    });
  };

  service.deleteCurrUserAvatar = function(userAvatarId) {
    var url = '/api/user/avatar/delete/' + userAvatarId + '/' + $rootScope.rootUsername;
    return $http({
      method: 'DELETE',
      url: url
    });
  };

  service.deleteCurrProjectAvatar = function(projectId, projectAvatarId) {
    var url = '/api/avatar/delete/project/' + projectId + '/' + projectAvatarId;
    return $http({
      method: 'DELETE',
      url: url,
    });
  };

  service.redirectProjectPage = function() {
    if ($cookies.getObject("nextProjectUrl")) {
      var redirectProjectId = $cookies.getObject("nextProjectUrl");
      console.log('please: ', redirectProjectId);
      $cookies.remove("nextProjectUrl");
      $state.go('myproject', { project_id: redirectProjectId });
    } else {
      $state.go('profile', {username: $rootScope.rootUsername});
    };
  };

  return service;

});

app.controller('FileController', function($timeout, $scope, MusicFactory, $rootScope, $state, FileUploader) {

  var uploader = $scope.uploader = new FileUploader({
    url: '/api/upload/' + $rootScope.rootUsername + '/' + $scope.projectId
  });

  uploader.onCompleteAll = function() {
    $scope.$emit('newEditMode', false);
  };

  uploader.onSuccessItem = function(fileItem, response, status, headers) {
    // so far, do nothing
  };
});

// takes control of user avatars
app.controller('UserAvatarController', function($timeout, $scope, $rootScope, $state, FileUploader) {

  var uploader = $scope.uploader = new FileUploader({
    url: '/api/upload/avatar/user/' + $rootScope.rootUsername
  });

  uploader.onCompleteAll = function() {
    console.log('in user avatar');
    $scope.$emit('newEditMode', false);
    console.log('pleep pleep');
  };

});

// takes control of projects avatar
app.controller('ProjectAvatarController', function($timeout, $scope, $rootScope, $state, FileUploader) {

  console.log('id here?', $scope.projectId);
  var uploader = $scope.uploader = new FileUploader({
    url: '/api/upload/avatar/project/' + $scope.projectId + '/' + $rootScope.rootUsername
  });
  uploader.onCompleteAll = function() {
    console.log('hello i am here');
    $scope.$emit('newEditMode', false);
    console.log('new edit mode');
  };

});

// ***************************************
//          PROJECT FILE CONTROLLER
// **************************************
app.controller('ProjectFileController', function($scope, MusicFactory, $state, $stateParams, $rootScope) {
  $scope.projectId = $stateParams.projectid;

  $scope.$on('newEditMode', function(event, editVal) {
    $scope.loadProjectFilePage();
  });

  $scope.deleteFile = function(fileId) {
    MusicFactory.removeFile(fileId, $scope.projectId)
      .then(function() {
        $scope.loadProjectFilePage();
        console.log('success deleting file!');
      })
      .catch(function(err) {
        console.log('error removing file:', err.message);
      });
  }

  $scope.loadProjectFilePage = function() {
    MusicFactory.FileUploadService($scope.projectId)
      .then(function(projectInfo) {
        console.log('success sending project info!', projectInfo.data);
        $scope.projectInfo = projectInfo.data.projectInfo;
        $scope.allFiles = projectInfo.data.allFiles;
      })
      .catch(function(err) {
        console.log('err in ProjectFileController', err.stack);
      });
  };

  // call this initially when page loads
  $scope.loadProjectFilePage();

});

// ********************************
//          HOME CONTROLLER
// *******************************
app.controller('HomeController', function($scope, $state) {
  // so far, nothing happens here
});

// ********************************
//          REQUEST CONTROLLER
// *******************************
app.controller('RequestsController', function($scope, $stateParams, MusicFactory, $state) {
  $scope.username = $stateParams.username;
  $scope.typeRequest = {};

  $scope.loadRequestPage = function() {
    MusicFactory.getRequests()
      .then(function(results) {
        console.log("INBOX:", results.data.inbox);
        console.log("OUTBOX:", results.data.outbox);
        $scope.inbox = results.data.inbox;
        $scope.outbox = results.data.outbox;
      })
      .catch(function(err) {
        console.log('err getting requests:', err.message);
      });
  };

  // load request page initially
  $scope.loadRequestPage();

  // delete request
  $scope.deleteRequest = function(requestId, in_or_out, user) {
    console.log('who AM I???', user);
    MusicFactory.deleteRequest(requestId, in_or_out, user)
      .then(function(results) {
        console.log('success deleting the old request::', results);
        $scope.loadRequestPage();
      })
      .catch(function(err) {
        console.log('error deleting request::', err.message);
      });
  };

  $scope.declineRequest = function(requestInfo) {
    console.log('hellowwww');
    console.log('reqestedInfo:', requestInfo);
    MusicFactory.declineRequest(requestInfo)
      .then(function(results) {
        console.log('success deleting the old request::', results);
        $scope.loadRequestPage();
      })
      .catch(function(err) {
        console.log('error deleting request::', err.message);
      });
  };

  $scope.acceptRequest = function(requestId, projectId, username, projectName, acceptedRequestTypes) {
    var requestObj = {
      requestId: requestId,
      typeRequest: acceptedRequestTypes,
      projectId: projectId,
      username: username,
      projectName: projectName
    };
    console.log('new reqest obj::', requestObj);

    MusicFactory.serviceAcceptRequest(requestObj)
      .then(function(results) {
        console.log('success accepting request::', results);
        $scope.loadRequestPage();
      })
      .catch(function(err) {
        console.log('error accepting request::', err.message);
      });
  }

});

// ********************************
//          USER CONTROLLER
// *******************************
app.controller('UserController', function($scope, $sce, $state, $stateParams, MusicFactory) {
  $scope.currUser = $stateParams.username;

  $scope.$on('newEditMode', function(event, editVal) {
    console.log('SEND OFF:', editVal);
    console.log('nothing but birds');

    $scope.loadProfilePage();
    $scope.edit = true;
    console.log('edit mode:', $scope.edit);
  });

  $scope.saveBio = function() {
    console.log($scope.description);
    MusicFactory.updateBio($scope.description)
    .then(function(results) {
      $scope.loadProfilePage();
      $scope.edit = false;
      // console.log('updated user bio:', results);
      // $scope.edit = false;
    })
    .catch(function(err) {
      console.log('encountered errors updating user bio:', err.message);
    });

  };

  $scope.getAudioUrl = function(fileHash, currProjectName, currProjectId) {
    console.log(fileHash);
    $scope.audioTrack = $sce.trustAsResourceUrl('/upload/' + fileHash);
    $scope.currProjectName = currProjectName;
    $scope.currProjectId = currProjectId;
  };

  $scope.allAudios = ["mp3", "wav", "m4a"];

  $scope.isAudioFile = function(filename) {
    if (filename) {
      var etx = filename.split(".").pop();
      var index = $scope.allAudios.indexOf(etx);
      if (index > -1) {
        return true;
      }
    } else {
      return false;
    }
  };

  // makes a service call to pass data to the backend to render the user profile page
  $scope.loadProfilePage = function() {
    MusicFactory.getUserProfile($scope.currUser)
      .then(function(results) {
        console.log('user profile results:', results);
        $scope.allProjects = results.data.allProjects;
        $scope.userInfo = results.data.userInfo;
        $scope.description = results.data.userInfo.bio.length === 0 ? "Add a bio..." : results.data.userInfo.bio;
        $scope.avatarInfo = results.data.avatarInfo;
      })
      .catch(function(err) {
        console.log('encountered errors retrieving user profile data', err.message);
      });
  };

  // load page initially
  $scope.loadProfilePage();

  $scope.deleteUserAvatar = function(avatarId) {
    console.log('avatar id right....', avatarId);
    MusicFactory.deleteCurrUserAvatar(avatarId)
      .then(function(results) {
        $scope.loadProfilePage();
        $scope.edit = true;
        console.log('success deleting user avatar');
      })
      .catch(function(err) {
        console.log('experienced err deleting user avatar');
      });
  };

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

        // $state.go('profile', { username: $rootScope.rootUsername});
        MusicFactory.redirectProjectPage();
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

        MusicFactory.redirectProjectPage();

      })
      .catch(function(err) {
        console.log('experienced err submitting login info:', err.message);
      });
  }

});

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
    if (filename) {
      var etx = filename.split(".").pop();
      var index = $scope.allAudios.indexOf(etx);
      if (index > -1) {
        return true;
      }
    } else {
      return false;
    }
  };

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

  $scope.loadAllProjectsPage = function() {
    MusicFactory.allProjects()
      .then(function(results) {
        $scope.allProjects = results.data;
      })
      .catch(function(err) {
        console.log('encountered error loading all projects:', err.message);
      });
  };

  // load all projects page initially
  $scope.loadAllProjectsPage();

  $scope.reloadSearch = function() {
    $scope.loadAllProjectsPage();
  };

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
  };

});

// ***********************************************************************
//                        USER PROJECTS CONTROLLER
// **********************************************************************
app.controller('UserProjectsController', function($scope, $sce, $cookies, $state, $stateParams, $rootScope, MusicFactory) {

  $scope.projectId = $stateParams.project_id;

  if ($rootScope.rootUsername) {
    console.log('user exists');
  } else {
    console.log('user does not exist');
    // if user is not logged in
    // save the project id they wanted to go to in a cookie
    $cookies.putObject('nextProjectUrl', $scope.projectId)
    $state.go("login");
  };


  $scope.melody = false;
  $scope.lyrics = false;
  $scope.voice = false;
  $scope.production = false;
  $scope.editComment = false;

  console.log('setting up');

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
        // later on refactor this code by
        // creating another api call
        // where the backend makes a query and only passes the project comments
        $scope.content = "";
        $scope.loadProjectDetails();
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
        $scope.loadProjectDetails();
        console.log('successfully saved comment');
      })
      .catch(function(err) {
        console.log('err save project comment', err.stack);
      })
    };

  $scope.deleteComment = function(commentId) {
    MusicFactory.removeComment(commentId, $scope.projectId)
      .then(function(results) {
        console.log('successfully deleted comment from db');
        $scope.loadProjectDetails();
      })
      .catch(function(err) {
        console.log('experienced err deleting comment to db:', err.message);
      });
  };

  $scope.deleteProjectAvatar = function(projectAvatarId) {
    MusicFactory.deleteCurrProjectAvatar($scope.projectId, projectAvatarId)
      .then(function(results) {
        console.log('success deleting the project avatar');
        $scope.loadProjectDetails();
      })
      .catch(function(err) {
        console.log('error deleting the project avatar:', err.message);
      });
  };

  $scope.deleteFile = function(fileId) {
    MusicFactory.removeFile(fileId, $scope.projectId)
      .then(function() {
        $scope.loadProjectDetails();
        $scope.edit = true;
        // console.log('editing is....', $scope.edit);
        console.log('success deleting file!');
      })
      .catch(function(err) {
        console.log('error removing file:', err.message);
      });
  }
  // console.log('edit status here', $scope.edit);

  $scope.loadProjectDetails = function() {
    MusicFactory.getProjectDetails($scope.projectId)
      .then(function(results) {
        console.log('updated PROJECT DETAIL info', results);
        // $scope.edit = results.data.editMode;
        console.log('what is edit before?', $scope.edit);
        console.log('comment is a what......', $scope.editComment);
        console.log('loading edit', $scope.edit);
        // $scope.edit = false;
        $scope.allFiles = results.data.allFiles;
        $scope.allComments = results.data.allComments;
        $scope.projectAvatar = results.data.projectAvatar;

        $scope.userInfo = results.data.userInfo;
        $scope.project = results.data.projectInfo;
        $scope.projectId = results.data.projectInfo._id;
        $scope.owner = results.data.projectInfo.owner;
        $scope.requestedTypes = {};
        $scope.isCompleted = $scope.project.completed;
      })
      .catch(function(err) {
        console.log('encountered errors loading my projects detail page', err.message);
      });
  };

  // load project details once when page loads
  $scope.loadProjectDetails();

  $scope.$on('newEditMode', function(event, editVal) {
    console.log('SEND OFF:', editVal);
    console.log('nothing but birds');

    $scope.loadProjectDetails();
    console.log('edit mode:', $scope.edit);
  });

    $scope.editProject = function() {
      $scope.origHasTypes  = jQuery.extend({}, $scope.project.existingTypes);
      $scope.origNeedsTypes  = jQuery.extend({}, $scope.project.seekingTypes);

      $scope.edit = true;
      $scope.origDescription = $scope.project.description;
    };

    $scope.cancelProjectEdit = function() {
      $scope.edit = false;
      $scope.project.description = $scope.origDescription;
      $scope.project.existingTypes = $scope.origHasTypes;
      $scope.project.seekingTypes = $scope.origNeedsTypes;
    };

    $scope.saveProjectEdits = function(projectId) {
      var updatedProjectObj = {
        description: $scope.project.description,
        has: $scope.project.existingTypes,
        needs: $scope.project.seekingTypes
      };
      // console.log('updated project???', updatedProjectObj);
      MusicFactory.saveEdits(projectId, updatedProjectObj)
      .then(function(results) {
        $scope.edit = false;
        // console.log('results updating project: ', results);
        $scope.loadProjectDetails();
      })
      .catch(function(err) {
        console.log('encountered errors updating project:', err.message);
      });
    };

    $scope.deleteProject = function(projectId) {
      console.log('lalalalalalala....', $scope.project);
      MusicFactory.deleteProject($scope.project)
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
          $scope.loadProjectDetails();
        })
        .catch(function(err) {
          console.log('encountered errors marking project complete:', err.message);
        });
    };

    $scope.requestContribute = function() {
      var requestTypes = {
        sender: $rootScope.rootUsername,
        owner: $scope.owner,
        description: $scope.description,
        request: $scope.requestedTypes,
        projectId: $scope.projectId,
        projectName: $scope.project.name
      };
      console.log('here are the request types::', requestTypes);

      MusicFactory.sendRequest(requestTypes)
        .then(function(results) {
          console.log('here are the request results:', results);
          $scope.loadProjectDetails();
        })
        .catch(function(err) {
          console.log('error processing request to project owner:', err.message);
        });
    };

});
