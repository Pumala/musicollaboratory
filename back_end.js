const mongoose      = require('mongoose');
const bluebird      = require('bluebird');
const express       = require('express');
const path          = require('path');
const bodyParser    = require('body-parser');
const uuid          = require('uuid/v4');
const moment        = require('moment');
// BCRYPT
const bcrypt        = require('bcrypt-promise');
const saltRounds = 10;
const myPlaintextPassword = 's0/\/\P4$$w0rD';
const someOtherPlaintextPassword = 'not_bacon';

const app           = express();
mongoose.Promise    = bluebird;
const ObjectId      = mongoose.Schema.ObjectId;

// module.exports        = function (app) {
const multer        = require('multer');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/upload');
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const id = uuid();
    cb(null, id + ext);
  }
});

// where to store the files => upload
const upload        = multer({
  storage
});

app.use(bodyParser.json());
app.use(express.static('public'));

// NEW DB
mongoose.connect('mongodb://localhost/musicollab_db');

// Schemas
const User = mongoose.model( 'User', {
  _id: { type: String, required: true, unique: true }, // username
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String },
  joined: Date,
  bio: String,
  musicanType: [String], // Melody, Lyrics, Voice, Production
  projects: [ ObjectId ], // Project Id
  requests: [ ObjectId ], // Request Id
  token: { id: String, expires: Date } // token
});

const File = mongoose.model('File', {
  _id: { type: String, required: true, unique: true }, // file hash name
  originalName: { type: String, required: true },
  owner: String, // username
  path: String,
  project: ObjectId
});

const Project = mongoose.model('Project', {
  name: { type: String, required: true },
  description: String,
  existingTypes: {
    melody: Boolean,
    lyrics: Boolean,
    voice: Boolean,
    production: Boolean
  }, // Melody, Lyrics, Voice, Production
  seekingTypes: {
    melody: Boolean,
    lyrics: Boolean,
    voice: Boolean,
    production: Boolean
  }, // Melody, Lyrics, Voice, Production
  files: [String], // uploading files ( mp3, lyrics ), // file hash name
  members: [String],
  owner: String,
  completed: Boolean
});

const Request = mongoose.model('Request', {
    projectId: ObjectId,
    projectOwner: { type: String, required: true },
    senderName: { type: String, required: true },
    requestTypes: [String], // Melody, Lyrics, Voice, Production
    description: String,
    date: Date
});

// TO DO !!!!!!!!!!!!!!!!
// update project detail page => edit project page
// update request center page !!!!

// const AuthToken = mongoose.model('AuthToken', {
//   _id: { type: String, required: true, unique: true },
//   expires: { type: Date, required: true }
// });

// require('./experiment/file.js')(app);

function getTypes(typesArr) {
  var arr = [];
  for(var i = 0; i < typesArr.length; i++) {
    for (var key in typesArr[i]) {
      if (typesArr[i][key])
      arr.push(key);
    }
  }
  return arr;
};

// ********************************
//          LIST ALL PROJECTS
// *******************************
app.get('/api/search/allprojects', function(request, response) {

  Project.find().limit(20)
    .then(function(allProjects) {
      console.log('all the projects:', allProjects);
      return response.json(allProjects)
    })
    .catch(function(err) {
      console.log('encountered err finding all the projects:', err.message);
    });
});

// ********************************
//          SEARCH FOR PROJECTS
// *******************************
app.post('/api/search/projects', function(request, response) {

  var needsInfo = request.body.needsInfo;

  var needsArr = getTypes([needsInfo]);

  var conditions = [];

  for (key in needsInfo) {
    if (needsInfo[key]) {
      var seek = "seekingTypes." + key;
      var cond = {};
      cond[seek] = needsInfo[key];
      conditions.push(cond);
    }
  };

  Project.find({
      $or: conditions
    })
    .then(function(results) {
      console.log('projects results:', results);
      return response.json(results);
    })
    .catch(function(err) {
      console.log('error querying for projects:', err.message);
    });

});

// ********************************
//          DELETE PROJECT
// *******************************
app.delete('/api/remove/project/:projectid', function(request, response) {
  console.log('PARAMS?',request.params);
  var projectId = request.params.projectid;

  Project.remove({ _id: projectId })
    .then(function(removedProject) {
      return response.json({
        message: 'removed project from db'
      })
    })
    .catch(function(err) {
      console.log('encountered err removing project from db', err.message);
    })

});

// *****************+++++++****************************
//          MARK PROJECT AS COMPLETE or UNCOMPLETE
// *****************+++++++***************************
app.put('/api/complete/project', function(request, response) {

  console.log('params?', request.body);
  var projectId = request.body.projectId;
  var isCompleted = request.body.isCompleted;

  Project.update({
      _id: projectId
    }, {
      $set: {
        completed: isCompleted
      }
    })
    .then(function(completedProject) {
      console.log('updated as complete?', completedProject);
      return response.json({
        message: 'mark project as complete in db'
      })
    })
    .catch(function(err) {
      console.log('encountered err marking project complete in db', err.message);
    });

});

// *****************+++++++****************************
//                    EDIT PROJECT
// *****************+++++++***************************
app.put('/api/edit/project', function(request, response) {

  console.log(request.body);

  var projectId = request.body.projectId;
  var description = request.body.projectInfo.description;
  var hasTypes = request.body.projectInfo.has;
  var needsTypes = request.body.projectInfo.needs;

  Project.update({
      _id: projectId
    }, {
      $set: {
        description: description,
        existingTypes: hasTypes,
        seekingTypes: needsTypes
      }
    })
    .then(function(updatedProjectInfo) {
      console.log('results updating', updatedProjectInfo);
      return response.json({
        message: 'sucess updating project info!'
      });
    })
    .catch(function(err) {
      console.log('encountered errors updating project info:', err.message);
    })

});

// ********************************
//          USER SIGNUP
// *******************************
app.post('/api/signup', function(request, response) {
  console.log('SIGNUP INFO:', request.body);
  var data = request.body;

  var firstName = data.firstName;
  var lastName = data.lastName;
  var username = data.username;
  var email = data.email;
  var password = data.password;

  // generate a new salt
  bluebird.all([ bcrypt.genSalt(saltRounds) ])
    .spread(function(salt) {
      // return an encrypted password
      return bcrypt.hash(password, salt);
    })
    .then(function(hash) {

      // generate a random token
      var randomToken = uuid();
      // create a date for when the token expires
      // 30 days form now
      var expiresDate = new Date();
      expiresDate = expiresDate.setDate(expiresDate.getDate() + 30);

      // create a new instance of user
      var newUser = new User({
        _id: username,
        firstName: firstName,
        lastName: lastName,
        email: email,
        password: hash,
        joined: new Date(),
        bio: "",
        musicanType: [],
        projects: [],
        requests: [],
        token: { id: randomToken, expires: expiresDate}
      });

      return newUser.save();
    })
    .then(function(newUser) {
      console.log('check user here:', newUser);

      return response.json({
        userInfo: newUser
      });
    })
    .catch(function(err) {
      console.log('error saving new user to db!!!', err.message);
    });

});

// ********************************
//          LOGOUT
// *******************************
app.put('/api/logout', function(request, response) {

  console.log('deleting this token from the db', request.params.tokenid);

  var username = request.body.username;
  var tokenId = request.body.token;

  User.update({
      _id: username
    }, {
      $set: {
        token: {}
      }
    })
    .then(function(loggedOut) {
      response.json({
        message: 'deleted token'
      });
    })
    .catch(function(err) {
      console.log("error deleting token", err.stack);
    });
});


// ********************************
//          PROJECT DETAIL PAGE
// *******************************
app.get('/api/project/:projectid/:username', function(request, response) {

  var projectId = request.params.projectid;
  var username = request.params.username;

  console.log('PARAMS?', request.params);

  // make a query to check if user has already requested to contribute
  User.findOne({ _id: username })
    .then(function(userInfo) {
      var userRequests = userInfo.requests;
      console.log('what am i doing',userInfo);

      return Request.find({
        _id: {
          $in: userRequests
        }
      });
    })
    .then(function(userRequestInfo) {
      // console.log('INFO INFO INFO:', userRequestInfo);
      var alreadyRequested = false;

      userRequestInfo.forEach(function(request) {
        if (String(request.projectId) === String(projectId)) {
          console.log('YES YES YES YES');
          alreadyRequested = true;
        }
      });

      return [ Project.findOne({ _id: projectId }), alreadyRequested]
    })
    .spread(function(projectInfo, alreadyRequested) {
      return response.json({
        projectInfo: projectInfo,
        alreadyRequested: alreadyRequested
      });
    })
    .catch(function(err) {
      console.log(err.message);
    })

  // bluebird.all([ User.findOne({ _id: username }),
  //   Project.findOne({ _id: projectId })
  // ])
  //   .spread(function(userInfo, projectInfo) {
  //     var userRequests = userInfo.requests;
  //
  //     // loop through each request to see if any of them were requests
  //     // to this particular project
  //     // use the request id to compare
  //     userRequests.forEach(function(request) {
  //   })



  // Request.findOne({
  //   $and: [
  //     {
  //       projectId: projectId
  //     },
  //     {
  //       senderName: username
  //     }
  //   ]
  // });

  //
  // Project.findOne({ _id: projectId })
  //   .then(function(projectInfo) {
  //     return response.json(projectInfo);
  //   })
  //   .catch(function(err) {
  //     console.log('encountered errors retrieving project info from db:', err.message);
  //   });

});

// ********************************
//          CREATE NEW PROJECT
// *******************************

// ********************************
//         CREATE/UPLOAD NEW FILE
// *******************************
app.post('/api/upload/:username/:projectid', upload.single('file'), function(req, res) {

  console.log('reached this API', req.params);

  // hard-coded for now
  var username = req.params.username;
  var projectId = req.params.projectid;

  var myFile = req.file;
  console.log('this is the file:', myFile);
  var originalName = myFile.originalname;
  var filename = myFile.filename;
  var path = myFile.path;
  var destination = myFile.destination;
  var size = myFile.size;
  var mimetype = myFile.mimetype;

  var newFile = new File({
    _id: filename,
    originalName: originalName,
    owner: username,
    path: path
  });

  newFile.save();

  // make a query to find the project for which the file belongs to
  // then update its files array
  Project.findOne({ _id: projectId })
    .then(function(projectInfo) {
      var updatedFiles = projectInfo.files;

      updatedFiles.push(filename); // add filename hash

      return Project.update({
        _id: projectId
      }, {
        $set: {
          files: updatedFiles
        }
      });

    })
    .catch(function(err) {
      console.log('encountered error saving file to user info:', err.message);
    })

});

// ********************************
//              LOGIN
// *******************************
app.post('/api/login', function(request, response) {
  var data = request.body;
  var username = data.username;
  var password = data.password;

  User.findOne({ _id: username })
    .then(function(userInfo) {
      if (userInfo === null) {
        return response.json({
          message: 'User does not exist!'
        });
      }
      console.log('user info??', userInfo);
      var hash = userInfo.password;

      // compare the passwords to see if they match
      return bcrypt.compare(password, hash);
    })
    .then(function(comparePasswords) {
      if (comparePasswords) {
        // generate a random token
        var randomToken = uuid();

        // create a date for when the token expires
        // 30 days form now
        var expiresDate = new Date();
        expiresDate = expiresDate.setDate(expiresDate.getDate() + 30);

        return [ User.update({
            _id: username
          }, {
            $set: {
              token: {
                id: randomToken, expires: expiresDate
              }
            }
          }), User.findOne({ _id: username }) ];
      } else {
        return response.json({
          message: 'Passwords do not match!'
        })
      }
    })
    .spread(function(updated, userInfo) {
      return response.json({
        userInfo: userInfo
      });
    })
    .catch(function(err) {
      console.log('encountered error logging in!', err.message)
    });

});

// ********************************************
//          CREATE A CONTRIBUTION REQUEST
// *******************************************
app.post('/api/request/new', function(request, response) {

  console.log('request.body is:', request.body);
  var data = request.body;

  var sender = data.sender;
  var projectOwner = data.owner;
  var requestTypes = data.request;
  var projectId = data.projectId;
  var description = data.description;

  var requestTypes = getTypes([requestTypes]);

  console.log('requesting these types....', typeof projectId);
  console.log(projectOwner);
  console.log(sender);
  console.log(description);

  var newRequest = new Request({
    projectId: projectId,
    projectOwner: projectOwner,
    senderName: sender,
    requestTypes: requestTypes,
    description: description,
    date: new Date()
  });

  bluebird.all([ User.findOne({ _id: sender }), newRequest.save() ])
    .spread(function(userInfo, newRequest) {
      var requestId = newRequest._id;
      var userRequests = userInfo.requests;

      userRequests.push(requestId);
      console.log(userRequests);
      return User.update({
        _id: sender
      }, {
        $set: {
          requests: userRequests
        }
      });
    })
    .then(function(updatedUser) {
      return response.json({
        message: 'success adding new request!'
      })
    })
    .catch(function(err) {
      console.log('error saving new request...', err.message);
    });



  // return "request was added to db....."

});

// ********************************************
//          RETRIEVE ALL USER REQUESTS
// *******************************************
app.get('/api/requests/:username', function(request, response) {

  var username = request.params.username;

  bluebird.all([
    Request.find({ senderName: username}),
    Request.find({ projectOwner: username })
  ])
    .spread(function(sendRequests, receiveRequests) {

      var sendProjectsArr = [];

      sendRequests.forEach(function(request) {
        sendProjectsArr.push(request.projectId);
      });

      var receiveProjectsArr = [];

      receiveRequests.forEach(function(request) {
        receiveProjectsArr.push(request.projectId);
      });

      return [ Project.find({
        _id: {
          $in: receiveProjectsArr
        }
      }), Project.find({
        _id: {
          $in: sendProjectsArr
        }
      }), receiveRequests, sendRequests ];

    })
    .spread(function(receiveProjects, sendProjects, receiveRequests, sendRequests) {

        return response.json({
          receiveProjects: receiveProjects,
          sendProjects: sendProjects,
          receiveRequests: receiveRequests,
          sendRequests: sendRequests
        });
      })
      .catch(function(err) {
      console.log('error retrieving all the requests:', err.message);
      });

});

// ********************************
//          USER PROFILE
// *******************************
app.get('/api/profile/:username', function(request, response) {

  var username = request.params.username;

  User.findOne({ _id: username })
    .then(function(userInfo) {

      // an array of project ids
      var allProjects = userInfo.projects;
      console.log('user projects:', allProjects);

      return [ userInfo, Project.find({
        _id: {
          $in: allProjects
        }
      })];

    })
    .spread(function(userInfo, allProjects) {
      console.log('all user projects:', allProjects);
      return response.json({
        userInfo: userInfo,
        allProjects: allProjects
      })
    })
    .catch(function(err) {
      console.log('encountered errors retrieving profile data:', err.message);
    });

});

// ********************************
//          CREATE NEW PROJECT
// *******************************
app.post('/api/new/project', upload.single('file'), function(request, response) {

  console.log(request.body);

  //  hard code for now until we have sign up/login functionality set up
  // var owner = results.owner;

  var results = request.body;
  var owner = results.owner;
  var projectHas = results.has;
  var projectNeeds = results.needs;

  var newProject = new Project({
    name: results.name,
    description: results.description,
    existingTypes: projectHas,
    seekingTypes: projectNeeds,
    files: [],
    members: [owner],
    owner: owner,
    completed: false
  });

  bluebird.all([ newProject.save(), User.findOne({ _id: owner }) ])
    .spread(function(savedProject, userInfo) {

      var projectId = savedProject._id;
      var userProjects = userInfo.projects;
      var updatedUserProjects = userProjects.concat([projectId]);

      return [ User.update({
          _id: owner
        }, {
          $set: {
            projects: updatedUserProjects
          }
        }), projectId
      ];
    })
    .spread(function(updatedUserProjects, projectId) {
      return response.json({
        projectId: projectId
      });
    })
    .catch(function(err) {
      console.log('encountered error adding new project:', err.message);
    });

});

app.delete('/api/request/delete/:requestid', function(request, response) {

  console.log(request.params.requestid);
  var requestId = request.params.requestid;

  Request.remove({ _id: requestId })
    .then(function(deleteRequest) {
      return response.json({
        message: "hello we deleted the request from the db"
      });
    })
    .catch(function(err) {
      console.log('error attempting to delete request from db:', err.message);
    });
});

app.put('/api/request/accept', function(request, response) {
  console.log(request.body.requestInfo);
  var data = request.body.requestInfo;

  var requestId = data.requestId;
  var typeRequest = data.typeRequest;
  var projectId = data.projectId;
  var username = data.username;


//delete request
  bluebird.all([
    Request.remove({ _id: requestId }),
    Project.findOne( { _id: projectId}),
    User.findOne( { _id: username} )
   ])
    .spread(function(acceptRequest, acceptProject, acceptUser) {
      console.log('project info:', acceptProject);
      console.log('USER INFO', acceptUser.projects);

      var projectMembers = acceptProject.members;
      projectMembers.push(username);

      console.log('updated members:', projectMembers);

      var projectSeekingObj = acceptProject.seekingTypes;
      var projectExistingObj = acceptProject.existingTypes;

      console.log('current seeking types:', projectSeekingObj);

      // updates what the project is seeeking
      for (key in projectSeekingObj) {
        for (type in typeRequest) {
          if (key === type) {
            projectSeekingObj[key] = false;
          }
        }
      }

      // update what types exist in the project
      for (key in projectExistingObj) {
        for (type in typeRequest) {
          if (key === type) {
            projectExistingObj[key] = true;
          }
        }
      }

      console.log('updated project seeking obj:', projectSeekingObj);
      console.log('updated project existing obj:', projectExistingObj);

      // for (key in projectSeekingObj) {
      //   console.log('key:', key);
      // }


      var projectsArr = acceptUser.projects;
      projectsArr.push(projectId);

      // Project.update({
      //   _id: projectId
      // }, {
      //   $set: {
      //     seekingTypes: projectSeekingObj,
      //     existingTypes: projectExistingObj,
      //     members: projectMembers
      //   }
      // })

      return [ User.update({
        _id: username
        }, {
          $set: {
            projects: projectsArr
          }
        }),
        Project.update({
          _id: projectId
        }, {
          $set: {
            seekingTypes: projectSeekingObj,
            existingTypes: projectExistingObj,
            members: projectMembers
          }
        })
      ];
    })
    .spread(function(updatedUser, updatedProject) {
      console.log('updated user:', updatedUser);
      console.log('updated project:', updatedProject);

      // return response.json({
      //   message: "in accept, accepted the request from the db"
      // });
    })
    .catch(function(err) {
      console.log('error attempting to delete request from db:', err.message);
    });


})

app.get('/api/project/file/upload/:projectId', function(request, response) {
  console.log('.........YUP......', request.params);
  var projectId = request.params.projectId;

  Project.findOne({ _id: projectId })
    .then(function(projInfo) {
      var projFiles = projInfo.files;

      console.log('..........files..........', projFiles);
      return [ File.find({
          _id: {
            $in: projFiles
          }
        }), projInfo
      ];

    })
    .spread(function(fileInfo, projInfo) {
      return response.json({
        allFiles: fileInfo,
        projInfo: projInfo
      });
    })
    .catch(function(err) {
      console.log('encountered errors retrieving project data form upload:', err.message);
    });

  // Project.findOne({ _id: projectId })
  //   .then(function(projInfo) {
  //     return response.json({
  //       projInfo: projInfo
  //     });
  //     // console.log(projInfo);
  //   })
  //   .catch(function(err) {
  //     console.log('encountered errors retrieving project data form upload:', err.message);
  //   });

});


app.delete('/api/:projectid/file/remove/:fileid', function(request, response) {

  console.log(request.params);

  var projectId = request.params.projectid;
  var fileId = request.params.fileid;

  bluebird.all([
      File.remove({ _id: fileId }),
      Project.findOne({ _id: projectId })
    ])
    .spread(function(removedFile, projectInfo) {
      var projectFiles = projectInfo.files;
      console.log('before', projectFiles);

      var removeIndex = projectFiles.indexOf(fileId);
      projectFiles.splice(removeIndex, 1);

      return Project.update({
        _id: projectId
      }, {
        $set: {
          files: projectFiles
        }
      });

    })
    .then(function(updatedProject) {
      return response.json({
        message: 'success deleting file!'
      });
    })
    .catch(function(err) {
      console.log('error deleting file...', err.message);
    });
  // File.remove({ _id: fileId })
  //   .then(function(removedFile) {
  //     return response.json({
  //       message: 'success deleting file!'
  //     });
  //   })
  //   .catch(function(err) {
  //     console.log('error removing file....', err.message);
  //   });

  // console.log('file ID:', fileId);
});

app.listen(3000, function() {
  console.log('The server has started to listen........');
});
