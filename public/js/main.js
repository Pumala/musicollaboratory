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
    name: "myproject",
    url: "/myproject/{project_id}",
    templateUrl: "templates/myproject.html",
    controller: "MyProjectsController"
  })
  .state({
    name: "profile",
    url: "/profile/{username}",
    templateUrl: "templates/user_profile.html",
    controller: "UserController"
  });

  $urlRouterProvider.otherwise('/');
});

app.factory('MusicFactory', function($http, $rootScope, $state, $cookies) {
  var service = {};

  $rootScope.factoryCookieData = $cookies.getObject('cookieData') ? $cookies.getObject('cookieData') : null;
  console.log('factory cookies?:', $cookies.getObject('cookieData'));
  if ($rootScope.factoryCookieData) {
    $rootScope.rootUsername = $cookies.getObject('cookieData').userInfo._id;
    $rootScope.rootToken = $cookies.getObject('cookieData').tokenInfo._id;

    console.log('root token???', $cookies.getObject('cookieData').tokenInfo._id);
  }

  $rootScope.rootLogout = function() {
    var url = '/api/logout/' + $rootScope.rootToken;
    return $http({
      method: 'DELETE',
      url: url
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
      console.log('err logging out:', eerr.message);
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

  service.getProjectDetails = function(projectId) {
    var url = '/api/project/' + projectId;
    return $http({
      method: 'GET',
      url: url
    });
  };

  service.sendRequest = function(requestInfo) {
    var url = '/api/request';
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
  }

  return service;

});

app.controller('FileController', function($scope, FileUploader) {
  var uploader = $scope.uploader = new FileUploader({
    url: '/upload'
  });

  uploader.onCompleteAll = function() {
    console.info('onCompleteAll');
  };
});

app.controller('HomeController', function($scope, $state) {

});

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
        // console.log('results submitting new user info:', results.data)
        $rootScope.rootUsername = results.data.userInfo._id;
        $rootScope.rootToken = results.data.tokenInfo._id;

        $cookies.putObject('cookieData', results.data);
        $rootScope.factoryCookieData = $cookies.putObject('cookieData', results.data);

        $state.go('home');
      })
      .catch(function(err) {
        console.log('error submitting new user info:', err.message);
      });
  }

});

app.controller('LoginController', function($scope, $state, MusicFactory) {

  $scope.submitLogin = function() {
    var submitInfo = {
      username: $scope.username,
      password: $scope.password
    };
    MusicFactory.submitLoginInfo(submitInfo)
      .then(function(results) {
        console.log('success submitting login info', results);
      })
      .catch(function(err) {
        console.log('experienced err submitting login info:', err.message);
      });
  }

});

app.controller('SearchController', function($scope, $state, $sce, MusicFactory) {
  $scope.needsMelody = false;
  $scope.needsLyrics = false;
  $scope.needsVoice = false;
  $scope.needsProduction = false;
  $scope.getAudioUrl = function(fileHash) {
    return $sce.trustAsResourceUrl('/upload/' + fileHash);
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

app.controller('ProjectsController', function($scope, $state) {

  console.log('hellow inside the projects');


});

app.controller('NewProjectsController', function($scope, MusicFactory) {
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
        console.log('resuls from adding new project:', results);
      })
      .catch(function(err) {
        console.log('encountered error adding new project::', err.message);
      });
  }

});

app.controller('MyProjectsController', function($scope, $stateParams, MusicFactory) {
  $scope.projectId = $stateParams.project_id;
  $scope.melody = false;
  $scope.lyrics = false;
  $scope.voice = false;
  $scope.production = false;

  console.log($scope.projectId);

  MusicFactory.getProjectDetails($scope.projectId)
    .then(function(results) {
      console.log('here are the project details::', results.data);
      $scope.project = results.data;
      $scope.owner = results.data.owner;
      $scope.requestedTypes = {};
    })
    .catch(function(err) {
      console.log('encountered errors loading my projects detail page', err.message);
    });

    // for now, hard code sender until we have a $rootScope username
    $scope.username = "Lulu";

    $scope.requestContribute = function() {

      console.log('TYPE????:', $scope.checked)

      console.log('requestedTypes', $scope.requestedTypes);
      var requestTypes = {
        sender: $scope.username,
        owner: $scope.owner,
        description: $scope.description,
        request: $scope.requestedTypes
      };
      console.log('here are the request types::', requestTypes);

      // MusicFactory.sendRequest(requestTypes)
      //   .then(function(results) {
      //     console.log('here are the request results:', results);
      //   })
      //   .catch(function(err) {
      //     console.log('error processing request to project owner:', err.message);
      //   });
    }

});

// ====================
// DIRECTIVES
// ====================
// app.directive('ngFiles', ['$parse', function($parse) {
//
//   function fileLink(scope, element, attrs) {
//     var onChange = $parse(attrs.ngFiles);
//     element.on('change', function(event) {
//       onChange(scope, { $files: event.target.files });
//     });
//   };
//
//   return {
//     link: fileLink
//   }
//
// }])
//
// app.controller('ProjectsController', function($scope, $state, $cookies, $rootScope, TwitterFactory) {
//
//
//   $scope.formData = new FormData();
//   $scope.getTheFiles = function($files) {
//     console.log('FIles anyone??', $files);
//     angular.forEach($files, function(value, key) {
//       console.log('value?', value);
//       console.log('keyyy?', key);
//       console.log('form data step 1', $scope.formData);
//       // $scope.formData.push(key, value);
//       $scope.formData[key] = value;
//       console.log('form data step 2', $scope.formData);
//     });
//     console.log('form data??', $scope.formData);
//   };
//
//   $scope.uploadFiles = function() {
//     TwitterFactory.uploadFiles($scope.formData)
//       .then(function(results) {
//         console.log('here are the results:', results);
//       })
//       .catch(function(err) {
//         console.log('error uploading files:', err.message);
//       });
//   };
//
// });

// ====================
// SERVICES
// ====================
// app.factory('TwitterFactory', function($http, $rootScope, $state, $cookies) {
//   var service = {};
//
//   service.uploadFiles = function(formData) {
//     console.log('here is the form data::', formData);
//     return $http({
//       method: 'POST',
//       url: '/api/fileupload',
//       data: formData
//     })
//   };
//
//   // set it to cookieData if it exists, else null
//   $rootScope.factoryCookieData = $cookies.getObject('cookieData') ? $cookies.getObject('cookieData') : null;
//
//   // check if user is logged in
//   if ($rootScope.factoryCookieData) {
//
//     // check the token expiration date, only keep their session if not expired
//     // else, log the user out of the session
//     // var expDate = $cookies.getObject('cookieData').token.expires;
//     // console.log('expires?', expDate);
//     // console.log('TYPE?', typeof expDate);
//
//     // if so, then reassign the $rootScope variables
//
//     // update the likes array
//     // var data = $cookies.getObject('cookieData');
//     $rootScope.rootUsername = $cookies.getObject('cookieData')._id;
//     $rootScope.rootToken = $cookies.getObject('cookieData').token;
//     $rootScope.rootLikes = $cookies.getObject('cookieData').likes;
//     // data.likes = ...
//     // $cookies.putObject('cookieData', data);
//     console.log('WHO I LIKES::', $rootScope.rootLikes);
//     console.log('who is the root User??', $rootScope.rootUsername);
//   }
//
//   // LOGOUT
//   $rootScope.rootLogout = function() {
//     console.log('this is the token you want', $rootScope.rootToken.token);
//     // delete token
//     var url = "/api/logout/" + $rootScope.rootToken.token;
//     return $http({
//       method: 'DELETE',
//       url: url
//     })
//     .success(function(message) {
//       console.log('the message!!', message);
//       // reset all the $rootScope variables to null
//       $rootScope.rootUsername = null;
//       $rootScope.rootToken = null;
//       $rootScope.rootLikes = null;
//       $rootScope.factoryCookieData = null;
//       // kill the cookies
//       $cookies.remove('cookieData');
//       // redirect to home page
//       $state.go('home');
//     });
//
//   }
//
//   service.allTweets = function() {
//     var url = '/timeline';
//     return $http({
//       method: 'GET',
//       url: url
//     });
//   }
//
//   service.userProfile = function(username) {
//     var url = '/api/profile/' + username;
//     console.log('user anyone??', url);
//
//     return $http({
//       method: 'GET',
//       url: url
//     });
//   }
//
//   service.addNewTweet = function(username, newTweet) {
//     var url = '/api/newtweet';
//     return $http({
//       method: 'POST',
//       url: url,
//       data: {
//         username: username,
//         newTweet: newTweet
//       }
//     });
//   }
//
//   service.submitNewSignUp = function(signupInfo) {
//     console.log('nEW SIGNUP:', signupInfo)
//     var url = '/api/signup';
//     return $http({
//       method: 'POST',
//       url: url,
//       data: signupInfo
//     })
//   }
//
//   service.submitLoginInfo = function(loginInfo) {
//     console.log('the LOGIN INFO::', loginInfo);
//     var url = '/api/login';
//     return $http({
//       method: 'PUT',
//       url: url,
//       data: loginInfo
//     })
//   }
//
//   service.followUser = function(whoUserFollows) {
//     console.log('I am following this guy =>', whoUserFollows);
//     var url = '/api/follow';
//     return $http({
//       method: 'PUT',
//       url: url,
//       data: {
//         whoUserFollows: whoUserFollows,
//         user_id: $rootScope.rootUsername
//       }
//     })
//   }
//
//   service.unfollowUser = function(wasFollowing) {
//     console.log('was Following this guy =>', wasFollowing);
//     var url = '/api/unfollow';
//     return $http({
//       method: 'PUT',
//       url: url,
//       data: {
//         wasFollowing: wasFollowing,
//         user_id: $rootScope.rootUsername
//       }
//     });
//   }
//
//   service.removeTweet = function(tweetId) {
//     console.log('remove PLEASEEEE', tweetId);
//     var url = '/api/remove/' + tweetId;
//     return $http({
//       method: 'DELETE',
//       url: url
//     });
//   }
//
//   service.updateLikes = function(isLiked, tweetId) {
//     var url = '/api/edit/likes';
//     return $http({
//       method: 'PUT',
//       url: url,
//       data: {
//         isLiked: isLiked,
//         tweetId: tweetId,
//         username: $rootScope.rootUsername
//       }
//     });
//   }
//
//   service.updateRootLikes = function(likes) {
//
//
//     console.log('I KNOW WHO I AM for real!!!!', likes.likes);
//
//     console.log('BEFORE COOKIE::', $cookies.getObject('cookieData'));
//
//     var data = $cookies.getObject('cookieData');
//
//     data.likes = likes.likes;
//
//     $cookies.remove('cookieData');
//
//     $cookies.putObject('cookieData', data);
//
//     var newCookies = $cookies.getObject('cookieData');
//
//
//     console.log('DATA COOKIES::', data);
//     console.log('NEW COOKIES::', newCookies);
//
//     // var data = $cookies.getObject('cookieData');
//     //
//     // // data.likes = likes;
//     //
//     // console.log('COOKIES LIKES this data ::', data);
//     //
//     // $cookies.putObject('cookieData', data);
//     //
//     $rootScope.rootLikes = $cookies.getObject('cookieData').likes;
//     //
//     // console.log('UPDATED COOKIE::', $cookies.getObject('cookieData'));
//   }
//
//   service.search = function(search_keyword) {
//     var url = '/api/search/' + search_keyword;
//     return $http({
//       method: 'GET',
//       url: url
//     });
//   }
//
//   service.retweeting = function(retweetId) {
//     var url = '/api/retweet';
//     return $http({
//       method: 'POST',
//       url: url,
//       data: {
//         retweetId: retweetId,
//         username: $rootScope.rootUsername
//       }
//     })
//   }
//
//   return service;
// });
//

// // Search Results controller
// app.controller('SearchResultsController', function($scope, $stateParams, $rootScope, TwitterFactory) {
//   // console.log('state prarams::', $stateParams);
//
//   $scope.search = $stateParams.search_keyword;
//
//   console.log('state prarams::', $scope.search);
//
//   TwitterFactory.search($scope.search)
//     .success(function(info) {
//       // $state.reload();
//       $scope.allUsers = info.allUsers;
//       console.log('search results!', info.allUsers);
//     })
//     .error(function() {
//       console.log('error searching!!');
//     })
// })
//
// app.controller('HomeController', function($scope, $rootScope, $state, TwitterFactory) {
//   console.log('rootyyy:', $rootScope.rootUsername);
//
//   $scope.retweet = function(tweetId) {
//     if ($rootScope.rootUsername) {
//       TwitterFactory.retweeting(tweetId)
//         .success(function(results) {
//           console.log('retweeting results::', results);
//           $state.reload();
//         })
//         .error(function() {
//           console.log('error retweeting.....');
//         });
//     } else {
//       $state.go('login');
//     }
//   }
//
//   $scope.removeTweet = function(tweetId) {
//     console.log('tweeting this ID', tweetId);
//     TwitterFactory.removeTweet(tweetId)
//       .success(function(info) {
//         $state.reload();
//         console.log('removed the tweet!', info);
//       })
//       .error(function() {
//         console.log('error removing tweeet');
//       })
//   }
//
//   $scope.likeTweet = function(likes, tweetId) {
//     if ($rootScope.rootUsername) {
//       console.log(likes);
//       var index = likes.indexOf($rootScope.rootUsername);
//
//       if (index === -1) {
//         $scope.isLiked = true;
//       } else {
//         $scope.isLiked = false;
//       }
//       TwitterFactory.updateLikes($scope.isLiked, tweetId)
//         .success(function(likes) {
//           console.log('sucess liking!!', likes);
//           TwitterFactory.updateRootLikes(likes);
//           $state.reload();
//           // console.log('root likes:', $rootScope.rootLikes);
//           // console.log('root username:', $rootScope.rootUsername);
//         })
//         .error(function(err) {
//           console.log('error liking!!');
//         });
//     } else {
//       $state.go('login');
//     }
//   }
//
//   TwitterFactory.allTweets()
//     .success(function(allTweets) {
//       console.log('here is all the tweets for you:::', allTweets);
//       $scope.allTweets = allTweets.allTweets;
//       console.log('TWEETETETE', $rootScope.rootLikes);
//     })
//     .error(function(err) {
//       console.log('error!!!', err);
//     });
//
// });
//
// app.controller('SignUpController', function($scope, TwitterFactory, $state) {
//
//   $scope.submitSignUp = function() {
//     if ($scope.password === $scope.confirm_password && $scope.password.length > 3) {
//       var newUserInfo = {
//         username: $scope.username,
//         password: $scope.password,
//         firstName: $scope.firstName,
//         lastName: $scope.lastName,
//         email: $scope.email
//       }
//       TwitterFactory.submitNewSignUp(newUserInfo)
//         .success(function(info) {
//           $state.go('login');
//           console.log('NEW INFO::', info);
//           console.log('SUCCESS registering new user!!');
//         })
//         .error(function() {
//           console.log('encountered error submitting new user info!');
//         })
//     } else {
//       console.log('PASSWORDS DO NOT MATCH!!!');
//       return
//     }
//   }
//
// });
//
// app.controller('LoginController', function($scope, $state, $cookies, $rootScope, TwitterFactory) {
//
//   $scope.submitLogin = function() {
//     var loginInfo = {
//       username: $scope.username,
//       password: $scope.password
//     };
//
//     TwitterFactory.submitLoginInfo(loginInfo)
//       .success(function(userInfo) {
//
//         // check if there is an error
//         if (userInfo.error) {
//           // for now, reload the page
//           $state.reload();
//         } else {
//           // if the login was successful, save userInfo to cookiesData
//           $cookies.putObject('cookieData', userInfo.userInfo)
//
//           // store user login infor in $rootScope variables
//           $rootScope.rootUsername = userInfo.username;
//           $rootScope.rootLikes = userInfo.userInfo.likes;
//           $rootScope.rootToken = userInfo.token;
//           // redirect to home page
//           $state.go('home');
//         }
//
//       })
//       .error(function(err) {
//         console.log('LOGIN ERROR');
//         $state.go('login');
//       });
//   }
//
// });
//
// app.controller('UserController', function($scope, TwitterFactory, $state, $rootScope, $stateParams) {
//
//   $scope.username = $stateParams.username;
//
//   $scope.retweet = function(tweetId) {
//     if ($rootScope.rootUsername) {
//       TwitterFactory.retweeting(tweetId)
//         .success(function(results) {
//           console.log('retweeting results::', results);
//           $state.reload();
//         })
//         .error(function() {
//           console.log('error retweeting.....');
//         });
//     } else {
//       $state.go('login');
//     }
//   }
//
//   $scope.addTweet = function(newTweet) {
//     TwitterFactory.addNewTweet($scope.username, newTweet)
//       .success(function(tweet) {
//         console.log('inserted the new tweet!!::', tweet);
//         $state.reload();
//       })
//       .error(function(err) {
//         console.log('oh no!!! error!!!', err.message);
//       });
//   }
//
//   $scope.removeTweet = function(tweetId) {
//     console.log('tweeting this ID', tweetId);
//     TwitterFactory.removeTweet(tweetId)
//       .success(function(info) {
//         $state.reload();
//         console.log('removed the tweet!', info);
//       })
//       .error(function() {
//         console.log('error removing tweeet');
//       })
//   }
//
//   $scope.likeTweet = function(likes, tweetId) {
//     if ($rootScope.rootUsername) {
//
//       var index = likes.indexOf($rootScope.rootUsername);
//
//       if (index === -1) {
//         $scope.isLiked = true;
//       } else {
//         $scope.isLiked = false;
//       }
//
//       TwitterFactory.updateLikes($scope.isLiked, tweetId)
//         .success(function(likes) {
//           console.log('success liking!!', likes);
//           TwitterFactory.updateRootLikes(likes);
//           $state.reload();
//           console.log('root likes:', $rootScope.rootLikes);
//           console.log('root username:', $rootScope.rootUsername);
//         })
//         .error(function(err) {
//           console.log('error liking!!');
//         });
//     } else {
//       $state.go('login');
//     }
//   }
//
//   $scope.unfollow = function(username) {
//     console.log('I TRIED');
//     TwitterFactory.unfollowUser(username)
//       .success(function() {
//         $scope.isFollowing = false;
//         $state.reload();
//         console.log('success unfollowing');
//       })
//       .error(function(err) {
//         console.log('failed at unfollowing');
//       })
//   }
//
//   $scope.follow = function(username) {
//     if ($rootScope.rootUsername) {
//       TwitterFactory.followUser(username)
//         .success(function(info) {
//           $scope.isFollowing = true;
//           $state.reload();
//           console.log('THINK AGAIN!:', info);
//           console.log('SUCCESS FOLLOWING!!');
//         })
//         .error(function() {
//           console.log('encountered error following....');
//         });
//     } else {
//       $state.go('login');
//     }
//   }
//
//   TwitterFactory.userProfile($scope.username)
//     .success(function(allTweets) {
//       console.log('profile tweets coming in!!::', allTweets);
//       console.log('here is EVERYTHING COMING for you:::', allTweets.allTweets);
//
//       $scope.username = allTweets.userInfo._id;
//       $scope.numFollowing = allTweets.userInfo.following.length;
//       $scope.numFollowers = allTweets.userInfo.followers.length;
//       $scope.numLikes = allTweets.userInfo.likes.length;
//
//       $scope.numTweets = allTweets.numUserTweets;
//
//       $scope.allTweets = allTweets.allTweets;
//       console.log('username?', $scope.username);
//       console.log('rootScope???', $rootScope.rootUsername);
//       if ($rootScope.rootUsername) {
//         var followers = allTweets.userInfo.followers;
//         // check if user if currently following this person
//         if (followers.indexOf($rootScope.rootUsername) > -1) {
//           $scope.isFollowing = true;
//         } else {
//           $scope.isFollowing = false;
//         }
//       } else {
//         console.log('NOPE');
//       }
//     })
//     .error(function(err) {
//       console.log('oh no!!! error!!!', err.message);
//     });
// });
