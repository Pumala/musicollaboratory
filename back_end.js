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
  avatar: String,
  musicanType: [String], // Melody, Lyrics, Voice, Production
  projects: [ ObjectId ], // Project Id
  requests: [ ObjectId ], // Request Id
  token: { id: String, expires: Date } // token
});

const File = mongoose.model('File', {
  _id: { type: String, required: true, unique: true }, // file hash name
  created: Date,
  originalName: { type: String, required: true },
  owner: String, // username
  path: String,
  project: ObjectId,
  type: String
});

const Project = mongoose.model('Project', {
  name: { type: String, required: true },
  created: Date,
  description: String,
  avatar: String,
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
  completed: Boolean,
  comments: [ObjectId]
});

comments: [12313132131312313]

const Comment = mongoose.model('Comment', {
  content: String,
  date: Date,
  author: String
});

const Message = mongoose.model('Message', {
    projectId: ObjectId,
    to: { type: String, required: true },
    from: { type: String, required: true },
    requestTypes: [String], // Melody, Lyrics, Voice, Production
    description: String,
    date: Date,
    request: Boolean
});

// const Message = mongoose.model('Message', {
//     projectId: ObjectId,
//     to: { type: String, required: true },
//     from: { type: String, required: true },
//     requestTypes: Object, // Melody, Lyrics, Voice, Production
//     description: String,
//     date: Date
// });

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

// *******************************************
//          ADD NEW COMMENT TO PROJECT
// ******************************************
app.post('/api/comment/new', function(request, response) {
  // const Comment = mongoose.model('Comment', {
  //   content: String,
  //   date: Date,
  //   author: String
  // });

  var author = request.body.author;
  var content = request.body.content;
  var projectId = request.body.projectId;

  var newComment = new Comment({
    content: content,
    date: new Date(),
    author: author
  });

  // save new comment to the db
  bluebird.all([ newComment.save(), Project.findOne({ _id: projectId }) ])
    .spread(function(comment, project) {
      // assign comment id to a variable
      var commentId = comment._id;

      // assign project comments to a variable
      var projectComments = project.comments;
      // add the comment id to the project comments array
      projectComments.push(commentId);

      // update the projects comments in the db
      return Project.update({
          _id: projectId
        }, {
          $set: {
            comments: projectComments
          }
        })
    })
    .then(function(updatedProject) {
      return response.json({
        message: 'The comment was successfully added to the db!'
      });
    })
    .catch(function(err) {
      console.log('encountered err adding the comment to the db: ', err.message);
    });

});

// ****************************************
//         DELETE COMMENT FROM DB
// ***************************************
app.delete('/api/comment/delete/:commentid', function(request, response) {

  var commentId = request.params.commentid;

  Comment.remove({ _id: commentId })
    .then(function(results) {
      return response.json({
        message: 'successfully deleted comment from db'
      });
    })
    .catch(function(err) {
      console.log('experienced err deleting comment from db', err.message);
    });

});

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
      $or: conditions,
      $and: [
        {
        completed: false
      }
      ]
    })
    .then(function(results) {
      console.log('HELLO!!!!');
      // console.log('projects results:', results);
      return response.json(results);
    })
    .catch(function(err) {
      console.log('error querying for projects:', err.message);
    });

  // Project.find({
  //     $or: conditions
  //   })
  //   .then(function(results) {
  //     console.log('projects results:', results);
  //     return response.json(results);
  //   })
  //   .catch(function(err) {
  //     console.log('error querying for projects:', err.message);
  //   });

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
//          SAVE COMMENT
// *****************+++++++***************************
app.put('/api/comment/save', function(request, response) {
  console.log('saving comment::', request.body);
  Comment.update({
      _id: request.body.commentId
    }, {
      $set: {
        content: request.body.content
      }
    })
    .then(function(updatedComment) {
      response.json({
        message: 'success updating comment in db'
      });
    })
    .catch(function(err) {
      console.log('experiences err updating comment', err.message);
    });
});

// *****************+++++++****************************
//          MARK PROJECT AS COMPLETE or INCOMPLETE
// *****************+++++++***************************
app.put('/api/complete/project', function(request, response) {
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
//          EDIT USER BIO
// *******************************
app.put('/api/edit/user/bio', function(request, response) {
  console.log('update bio params:', request.body);

  var bio = request.body.bio;
  var username = request.body.username;

  User.update({
      _id: username
    }, {
      $set: {
        bio: bio
      }
    })
    .then(function(updatedBio) {
      return response.json({
        message: 'sucess updating user bio'
      })
    })
    .catch(function(err) {
      console.log('experienced error updating user bio', err.message);
    });

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
        avatar: "user_avatar.png",
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

  console.log('deleting this token from the db', request.body);

  var username = request.body.username;
  var tokenId = request.body.token;

  User.update({
      _id: username
    }, {
      $set: {
        token: { id: "", expires: null }
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
app.get('/api/project/:projectid/:username/:editmode', function(request, response) {

  console.log('getting project details::', request.params);

  var projectId = request.params.projectid;
  var username = request.params.username;
  var editMode = request.params.editmode;

  // console.log('PARAMS?', request.params);

  if (username === 'undefined') {
    Project.findOne({ _id: projectId })
      .then(function(projectInfo) {
        var projectFiles = projectInfo.files;
        return [ File.find({
          _id: {
            $in: projectFiles
          }
        }), projectInfo ];
      })
      .spread(function(allFiles, projectInfo) {
        return response.json({
          allFiles: allFiles,
          projectInfo: projectInfo
        });
      })
      .catch(function(err) {
        console.log('encountered err retrieving project details:', err.message);
      })
  }

  // make a query to check if user has already requested to contribute
  User.findOne({ _id: username })
    .then(function(userInfo) {
      var userRequests = userInfo.requests;
      console.log('what am i doing',userInfo);

      return Message.find({
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
      console.log('projectInfo::', projectInfo.files);
      var projectFiles = projectInfo.files;
      var projectComments = projectInfo.comments;
      return [projectInfo, alreadyRequested, File.find({
        _id: {
          $in: projectFiles
        }
      }), Comment.find({
        _id: {
          $in: projectComments
        }
      }) ];
    })
    .spread(function(projectInfo, alreadyRequested, allFiles, allComments) {
      console.log('all the files::', allFiles);
      return response.json({
        allFiles: allFiles,
        allComments: allComments,
        projectInfo: projectInfo,
        alreadyRequested: alreadyRequested,
        editMode: editMode
      });
    })
    .catch(function(err) {
      console.log(err.message);
    });

});



// ******************************************************
//         CREATE/UPLOAD NEW USER AVATAR FILE
// *****************************************************
app.post('/api/upload/avatar/user/:username', upload.single('file'), function(request, response) {

  var username = request.params.username;

  var myFile = request.file;
  // console.log('this is the file:', myFile);

  var originalName = myFile.originalname;
  var filename = myFile.filename;
  var path = myFile.path;
  var destination = myFile.destination;
  var size = myFile.size;
  var mimetype = myFile.mimetype;
  var extension = originalName.split(".").pop();
  var fileType = null;

  // offer 1 types => img file
  console.log('exten???', extension);

  var allImages = ["png", "jpg", "jpeg", "bmp", "tiff", "gif", "tiff"];

  if (allImages.indexOf(extension.toLowerCase()) > -1) {
    fileType = "image";
    console.log("Heaven");
  } else {
    console.log("Hell");
    return response.json({
      message: "File is unsupported. Please choose a file with one of the following extensions: png, jpg, txt, jpeg, bmp, tiff, gif, tif."
    });
  }

  var newFile = new File({
    _id: filename,
    created: new Date(),
    originalName: originalName,
    owner: username,
    path: path,
    project: null,
    type: fileType
  });

  newFile.save();

  console.log('ending Audio');

  User.update({
      _id: username
    }, {
      $set: {
        avatar: filename
      }
    })
    .then(function(userInfo) {
      console.log('user user user......info', userInfo);
      return response.json({
        message: 'sucesss adding new avatar to user info in db'
      })
    })
    .catch(function(err) {
      console.log('encountered err saving image file to db...', err.message);
    });

});




// ******************************************************
//         CREATE/UPLOAD NEW PROJECT AVATAR FILE
// *****************************************************
app.post('/api/upload/avatar/project/:projectid/:username', upload.single('file'), function(request, response) {

  console.log('project avatar API');

  var projectId = request.params.projectid;
  var username = request.params.username;

  var myFile = request.file;
  // console.log('this is the file:', myFile);

  var originalName = myFile.originalname;
  var filename = myFile.filename;
  var path = myFile.path;
  var destination = myFile.destination;
  var size = myFile.size;
  var mimetype = myFile.mimetype;
  var extension = originalName.split(".").pop();
  var fileType = null;

  // offer 1 types => img file
  console.log('exten???', extension);

  var allImages = ["png", "jpg", "jpeg", "bmp", "tiff", "gif", "tif"];

  if (allImages.indexOf(extension.toLowerCase()) > -1) {
    fileType = "image";
    console.log("Heaven");
  } else {
    console.log("Hell");
    return response.json({
      message: "File is unsupported. Please choose a file with one of the following extensions: png, jpg, txt, jpeg, bmp, tiff, gif, tiff."
    });
  }

  var newFile = new File({
    _id: filename,
    created: new Date(),
    originalName: originalName,
    owner: username,
    path: path,
    project: projectId,
    type: fileType
  });

  newFile.save();

  console.log('ending AVATAR FOR PROJECTS');

  Project.update({
      _id: projectId
    }, {
      $set: {
        avatar: filename
      }
    })
    .then(function(projectInfo) {
      console.log('project......info', projectInfo);
      return response.json({
        message: 'sucesss adding new avatar to project in db'
      })
    })
    .catch(function(err) {
      console.log('encountered err saving project avatar file to db...', err.message);
    });

});



// *****************************************************
//         CREATE/UPLOAD NEW DOCUMENT/ AUDIO FILES
// ****************************************************
app.post('/api/upload/:username/:projectid', upload.single('file'), function(request, response) {

  console.log('inside AUDIO');

  // hard-coded for now
  var username = request.params.username;
  var projectId = request.params.projectid;

  var myFile = request.file;
  console.log('this is the file:', myFile);
  var originalName = myFile.originalname;
  var filename = myFile.filename;
  var path = myFile.path;
  var destination = myFile.destination;
  var size = myFile.size;
  var mimetype = myFile.mimetype;
  var extension = originalName.split(".").pop();
  var fileType = null;
  // offer 2 types => docs or audio files

  var allDocs = ["doc", "docx", "txt", "pdf", "rtf"];
  var allAudios = ["mp3", "wav", "m4a"];

  if (allDocs.indexOf(extension.toLowerCase()) > -1) {
    console.log("Heaven");
    fileType = "document";
  } else if (allAudios.indexOf(extension.toLowerCase()) > -1) {
    fileType = "audio";
    console.log("Hell");
  } else {
    return response.json({
      message: "File is unsupported. Please choose a file with one of the following extensions: doc, docx, txt, pdf, rtf, mp3, wav, m4a."
    });
  }

  var newFile = new File({
    _id: filename,
    created: new Date(),
    originalName: originalName,
    owner: username,
    path: path,
    project: projectId,
    type: fileType
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
      console.log('do they match???', comparePasswords);
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
      console.log('updated??', userInfo);

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
  console.log('types: ', requestTypes);

  var newMessage = new Message({
    projectId: projectId,
    to: projectOwner,
    from: sender,
    requestTypes: requestTypes,
    description: description,
    date: new Date(),
    request: true
  });

  bluebird.all([ User.findOne({ _id: sender }), newMessage.save() ])
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
    Message.find({ from: username}),
    Message.find({ to: username })
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
    created: new Date(),
    description: results.description,
    avatar: 'note.png',
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


// ********************************
//          DELETE REQUEST
// *******************************
app.delete('/api/request/delete/:requestid', function(request, response) {

  console.log(request.params.requestid);
  var requestId = request.params.requestid;

  Message.remove({ _id: requestId })
    .then(function(deleteRequest) {
      return response.json({
        message: "hello we deleted the request from the db"
      });
    })
    .catch(function(err) {
      console.log('error attempting to delete request from db:', err.message);
    });
});

// ****************************************************
//          ACCEPT REQUEST TO JOIN PROJECT
// ***************************************************
app.put('/api/request/accept', function(request, response) {
  console.log(request.body.requestInfo);
  var data = request.body.requestInfo;

  var requestId = data.requestId;
  var typeRequest = data.typeRequest;
  var projectId = data.projectId;
  var username = data.username;
  var projectName = data.projectName;

  var projectOwner = request.body.projectOwner;

  var acceptedTypes = [];

  for (type in typeRequest) {
    if (typeRequest[type]) {
      acceptedTypes.push(type);
    }
  };

  var acceptedTypes2 = "";

  if (acceptedTypes.length === 2) {
    acceptedTypes2 = acceptedTypes[0] + " and " + acceptedTypes[1];
  } else if (acceptedTypes.length > 2) {
    var lastIndex = acceptedTypes.length - 1;
    acceptedTypes.forEach(function(type, index) {
      if (index !== lastIndex) {
        acceptedTypes2 += type + ", ";
      } else {
        acceptedTypes2 += "and " + type;
      }
    });
  } else {
    acceptedTypes2 = acceptedTypes;
  }

  // console.log('accepted types here::', acceptedTypes2);

  var note = "Your request for contributing " + acceptedTypes2 + " for " + projectName + " has been approved.";

  var newMessage = new Message({
      projectId: projectId,
      to: username,
      from: projectOwner,
      requestTypes: acceptedTypes2, // Melody, Lyrics, Voice, Production
      description: note,
      date: new Date(),
      request: false
  });

  newMessage.save();

// delete request
  bluebird.all([
    Message.remove({ _id: requestId }),
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

      var projectsArr = acceptUser.projects;
      projectsArr.push(projectId);

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

      return response.json({
        message: "in accept, accepted the request from the db"
      });
    })
    .catch(function(err) {
      console.log('error attempting to delete request from db:', err.message);
    });

})

// ***********************************************************************
//          GET PROJECT INFO AND FILES BELONGING TO THAT PROJECT
// **********************************************************************
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

// *****************************************
//          DELETE FILE FROM PROJECT
// ****************************************
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
