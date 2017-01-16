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
  inbox: [ ObjectId ], // Request Id
  outbox: [ ObjectId ],
  requests: [ ObjectId ],
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

const Comment = mongoose.model('Comment', {
  content: String,
  date: Date,
  author: String
});

const Message = mongoose.model('Message', {
    projectId: ObjectId,
    projectName: String,
    to: { type: String, required: true },
    from: { type: String, required: true },
    requestTypes: [String], // Melody, Lyrics, Voice, Production
    description: String,
    date: Date,
    request: Boolean
});

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

  var author = request.body.author;
  var content = request.body.content;
  var projectId = request.body.projectId;

  // create a new instnace of a comment and save it to a variable
  var newComment = new Comment({
    content: content,
    date: new Date(),
    author: author
  });

  // save new comment to the db
  // find the project the comment was posted in
  bluebird.all([ newComment.save(), Project.findOne({ _id: projectId }) ])
    .spread(function(comment, project) {
      // assign comment id to a variable
      var commentId = comment._id;

      // assign project comments to a variable
      var projectComments = project.comments;
      // add the comment id to the project comments array
      projectComments.push(commentId);

      // update the projects comments array in the db to include new comment
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
      response.status(500);
      response.json({
        error: err.message
      });
    });

});

// ****************************************
//         DELETE COMMENT FROM DB
// ***************************************
app.delete('/api/comment/delete/:commentid/:projectid', function(request, response) {

  var commentId = request.params.commentid;
  var projectId = request.params.projectid;

  // remove the comment from the db
  // find the project the comment belongs to
  bluebird.all([
    Comment.remove({ _id: commentId }),
    Project.findOne({ _id: projectId })
  ])
  .then(function(removedComment, projectInfo) {
    // save the project comments to a variable
    var projectComments = projectInfo.comments;

    // find the index of the comment id in the projects comments array
    var removeIndex = projectComments.indexOf(commentId);
    // remove the comment id from the projects comments array by the index
    projectComments.splice(removeIndex, 1);

    // update the project info with the updated projects comments
    // that no longer has the comment id in it
    return Project.update({
      _id: projectId
    }, {
      $set: {
        comments: projectComments
      }
    });

  })
  .then(function(updatedProject) {
    return response.json({
      message: 'successfully deleted comment from db'
    });
  })
  .catch(function(err) {
    console.log('experienced err deleting comment from db', err.message);
    response.status(500);
    response.json({
      error: err.message
    });
  });

});

// ********************************
//          LIST ALL PROJECTS
// *******************************
app.get('/api/search/allprojects', function(request, response) {

  // for now we find projects (max 20) in the db
  Project.find().limit(20)
    .then(function(allProjects) {
      console.log('all the projects:', allProjects);
      // send all the projects to the front end
      return response.json(allProjects)
    })
    .catch(function(err) {
      console.log('encountered err finding all the projects:', err.message);
      response.status(500);
      response.json({
        error: err.message
      });
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

  // find projects that meet any of the conditions (types) and is not yet completed
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
    return response.json(results);
  })
  .catch(function(err) {
    console.log('error querying for projects:', err.message);
    response.status(500);
    response.json({
      error: err.message
    });
  });

});

// ********************************************************************
//          DELETE PROJECT AND REMOVE PROJECT ID FROM USER PROJECTS
// *******************************************************************
app.put('/api/remove/project', function(request, response) {

  var projectId = request.body._id;
  var projectMembers = request.body.members;

  // below make 2 QUERIES
  // 1. update all project members that have the project id in their projects array with the project id removed
  // 2. remove the project from the db
  bluebird.all([ User.update(
      {
        _id: {
        $in: projectMembers
        }
      },
      { $pull: { projects: projectId } },
      { multi: true }
      ), Project.remove({ _id: projectId })
    ])
    .spread(function(updatedUsers, removedProject) {
      return response.json("SUCCESS!!! removing project form db...");
    })
    .catch(function(err) {
      console.log('error removing project from db:', err.message);
      response.status(500);
      response.json({
        error: err.message
      });
    });

});
// *****************+++++++****************************
//          SAVE COMMENT
// *****************+++++++***************************
app.put('/api/comment/save', function(request, response) {
  console.log('saving comment::', request.body);

  // update the comment content info
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
      response.status(500);
      response.json({
        error: err.message
      });
    });
});

// *****************+++++++****************************
//          MARK PROJECT AS COMPLETE or INCOMPLETE
// *****************+++++++***************************
app.put('/api/complete/project', function(request, response) {
  var projectId = request.body.projectId;
  var isCompleted = request.body.isCompleted;

  // update the project completed status: boolean value
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
      response.status(500);
      response.json({
        error: err.message
      });
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

  // update a project's description, along with types it currently has and types they are seeking
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
      response.status(500);
      response.json({
        error: err.message
      });
    })

});
// ********************************
//          EDIT USER BIO
// *******************************
app.put('/api/edit/user/bio', function(request, response) {
  console.log('update bio params:', request.body);

  var bio = request.body.bio;
  var username = request.body.username;

  // update the user's bio content
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
      response.status(500);
      response.json({
        error: err.message
      });
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
        avatar: "default_user_avatar.png",
        musicanType: [],
        projects: [],
        inbox: [],
        outbox: [],
        requests: [],
        token: { id: randomToken, expires: expiresDate}
      });

      // save the new user to the db
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
      response.status(500);
      response.json({
        error: err.message
      });
    });

});

// ********************************
//          LOGOUT
// *******************************
app.put('/api/logout', function(request, response) {

  console.log('deleting this token from the db', request.body);

  var username = request.body.username;
  var tokenId = request.body.token;

  // update the user's token to an empty string and set its expiration date to null
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
      response.status(500);
      response.json({
        error: err.message
      });
    });
});

// ********************************
//          PROJECT DETAIL PAGE
// *******************************
app.get('/api/project/:projectid/:username', function(request, response) {

  var projectId = request.params.projectid;
  var username = request.params.username;

  // make 2 QUERIES
  // 1. find the project info
  // 2. find the user info
  bluebird.all([
      Project.findOne({ _id: projectId }),
      User.findOne({ _id: username })
    ])
    .spread(function(projectInfo, userInfo) {
      // assign the project files, comments, and avatar to variables
      var projectFiles = projectInfo.files;
      var projectComments = projectInfo.comments;
      var projectAvatar = projectInfo.avatar;

      // use the variables above in the queries below
      return [ projectInfo, userInfo, File.find({
          _id: {
            $in: projectFiles
          }
        }), Comment.find({
          _id: {
            $in: projectComments
          }
        }), File.findOne({ _id: projectAvatar })
      ];
    })
    .spread(function(projectInfo, userInfo, allFiles, allComments, projectAvatar) {
      return response.json({
        allFiles: allFiles,
        allComments: allComments,
        projectInfo: projectInfo,
        userInfo: userInfo,
        projectAvatar: projectAvatar
      });
    })
    .catch(function(err) {
      console.log(err.message);
      response.status(500);
      response.json({
        error: err.message
      });
    });

});

// ******************************************************
//         CREATE/UPLOAD NEW USER AVATAR FILE
// *****************************************************
app.post('/api/upload/avatar/user/:username', upload.single('file'), function(request, response) {

  var username = request.params.username;

  var myFile = request.file;

  var originalName = myFile.originalname;
  var filename = myFile.filename;
  var path = myFile.path;
  var destination = myFile.destination;
  var size = myFile.size;
  var mimetype = myFile.mimetype;
  var extension = originalName.split(".").pop();
  var fileType = null;

  // all the supported image extensions in an array
  var allImages = ["png", "jpg", "jpeg", "bmp", "tif", "gif", "tiff"];

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

  bluebird.all([ newFile.save(), User.update({
        _id: username
      }, {
        $set: {
          avatar: filename
        }
      })
    ])
    .spread(function(savedFile, updatedUser) {
      return response.json({
        message: 'sucesss adding new avatar to user info in db'
      })
    })
    .catch(function(err) {
      console.log('encountered err saving image file to db...', err.message);
      response.status(500);
      response.json({
        error: err.message
      });
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

  var originalName = myFile.originalname;
  var filename = myFile.filename;
  var path = myFile.path;
  var destination = myFile.destination;
  var size = myFile.size;
  var mimetype = myFile.mimetype;
  var extension = originalName.split(".").pop();
  var fileType = null;

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

  bluebird.all([ newFile.save(), Project.update({
        _id: projectId
      }, {
        $set: {
          avatar: filename
        }
      })
    ])
    .spread(function(savedFile, updatedProjectInfo) {
      return response.json({
        message: 'sucesss adding new avatar to project in db'
      })
    })
    .catch(function(err) {
      console.log('encountered err saving project avatar file to db...', err.message);
      response.status(500);
      response.json({
        error: err.message
      });
    });

});

// *****************************************************
//         CREATE/UPLOAD NEW DOCUMENT/ AUDIO FILES
// ****************************************************
app.post('/api/upload/:username/:projectid', upload.single('file'), function(request, response) {

  var username = request.params.username;
  var projectId = request.params.projectid;

  var myFile = request.file;
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



  // make 2 QUERIES
  // 1. save the file to the db
  // 2. update the project files array (use the $addToSet operator to push the filename to the array)
  bluebird.all([
      newFile.save(),
      Project.update(
        { _id: projectId },
        { $addToSet: { files: filename } }
      )
    ])
    .spread(function(savedFile, updatedProject) {
      return response.json({
        message: 'sucesss saving new avatar to project in db'
      });
    })
    .catch(function(err) {
      console.log('encountered error saving file to user info:', err.message);
      response.status(500);
      response.json({
        error: err.message
      });
    });

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
      response.status(500);
      response.json({
        error: err.message
      });
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
  var projectName = data.projectName;

  var requestTypes = getTypes([requestTypes]);

  var newInbox = new Message({
    projectId: projectId,
    projectName: projectName,
    to: projectOwner,
    from: sender,
    requestTypes: requestTypes,
    description: description,
    date: new Date(),
    request: true
  });

  var newOutbox = new Message({
    projectId: projectId,
    projectName: projectName,
    to: projectOwner,
    from: sender,
    requestTypes: requestTypes,
    description: description,
    date: new Date(),
    request: true
  });

  bluebird.all([
      newInbox.save(),
      newOutbox.save()
    ])
    .spread(function(newOutbox, newInbox) {
      var newOutboxId = newOutbox._id;
      var newInboxId = newInbox._id;

      return [ User.update(
          {  _id: sender },
          { $addToSet: { outbox: newOutboxId, requests: projectId } }
        ), User.update(
          {   _id: projectOwner },
          { $addToSet: { inbox: newInboxId } }
        )
      ];
    })
    .spread(function(updatedUser, updatedProjectOwner) {
      return response.json({
        message: 'success adding new request!'
      })
    })
    .catch(function(err) {
      console.log('error saving new request...', err.message);
      response.status(500);
      response.json({
        error: err.message
      });
    });

});

// ********************************************
//          RETRIEVE ALL USER REQUESTS
// *******************************************
app.get('/api/get/requests/:username', function(request, response) {

  var username = request.params.username;

  User.findOne({ _id: username })
    .then(function(userInfo) {
      var userInbox = userInfo.inbox;
      var userOutbox = userInfo.outbox;

      return [ Message.find({
        _id: {
          $in: userInbox
        }
      }), Message.find({
          _id: {
            $in: userOutbox
          }
        })
      ];
    })
    .spread(function(inbox, outbox) {
      return response.json({
        inbox: inbox,
        outbox: outbox
      });
    })
    .catch(function(err) {
      console.log('error retrieving all the requests:', err.message);
      response.status(500);
      response.json({
        error: err.message
      });
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
      var userAvatar = userInfo.avatar;

      return [ userInfo, Project.find({
        _id: {
          $in: allProjects
        }
      }), File.findOne({
        _id: userAvatar
      }) ];

    })
    .spread(function(userInfo, allProjects, avatarInfo) {
      console.log('all user projects:', allProjects);
      return response.json({
        userInfo: userInfo,
        allProjects: allProjects,
        avatarInfo
      })
    })
    .catch(function(err) {
      console.log('encountered errors retrieving profile data:', err.message);
      response.status(500);
      response.json({
        error: err.message
      });
    });

});
// *****************************************
//          DELETE PROJECT AVATAR
// ****************************************
app.delete('/api/avatar/delete/project/:projectid/:projectavatarid', function(request, response) {

  var projectId = request.params.projectid;
  var projectAvatarId = request.params.projectavatarid;

  // 1. delete the project avatar from the db
  // 2. update the project avatar to use the default project avatar

  bluebird.all([
    File.remove({ _id: projectAvatarId}),
      Project.update({
        _id: projectId
      }, {
        $set: {
          avatar: "default_project_avatar.png"
        }
      })
   ])
   .then(function(removedFile, updatedProjectInfo) {
     return response.json({
       message: "success removing project avatar from db"
     });
   })
   .catch(function() {
     console.log('encountered errors deleting profile avatar:', err.message);
     response.status(500);
     response.json({
       error: err.message
     });
   });

});

// *****************************************
//          DELETE USER AVATAR
// ****************************************
app.delete('/api/user/avatar/delete/:avatarid/:username', function(request, response) {

  var avatarId = request.params.avatarid;
  var username = request.params.username;

  bluebird.all([
    File.remove({ _id: avatarId }),
    User.update({
        _id: username
      }, {
        $set: {
          avatar: "default_user_avatar.png"
        }
      })
    ])
    .then(function(removedFile, updatedUser) {
      console.log('success deleting user avatar');
      return response.json({
        message: 'success deleting user avatar'
      })
    })
    .catch(function(err) {
      console.log('encountered errors deleting profile avatar:', err.message);
      response.status(500);
      response.json({
        error: err.message
      });
    });

});

// ********************************
//          CREATE NEW PROJECT
// *******************************
app.post('/api/new/project', upload.single('file'), function(request, response) {

  var results = request.body;
  var owner = results.owner;
  var projectHas = results.has;
  var projectNeeds = results.needs;

  var newProject = new Project({
    name: results.name,
    created: new Date(),
    description: results.description,
    avatar: 'default_project_avatar.png',
    existingTypes: projectHas,
    seekingTypes: projectNeeds,
    files: [],
    members: [owner],
    owner: owner,
    completed: false
  });

  newProject.save()
    .then(function(savedProject) {

      var projectId = savedProject._id;

      return [ User.update({
          _id: owner
        }, {
          $addToSet: {
            projects: projectId
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
      response.status(500);
      response.json({
        error: err.message
      });
    });

});

// ********************************
//          DELETE REQUEST
// *******************************
app.delete('/api/request/delete/:requestid/:inbox_or_outbox/:user', function(request, response) {

  var inboxOrOutbox = request.params.inbox_or_outbox;
  var requestId = request.params.requestid;
  var userId = request.params.user;

  bluebird.all([
      Message.remove({ _id: requestId }),
      User.update(
        { _id: userId },
        { $pull: { inbox: requestId, outbox: requestId } }
      )
    ])
    .spread(function(deleteRequest, updatedUser) {
      return response.json({
        message: "we deleted the request from the db and from the user's " + inboxOrOutbox
      });
    })
    .catch(function(err) {
      console.log('error attempting to delete request from db:', err.message);
      response.status(500);
      response.json({
        error: err.message
      });
    });

});

// ***************************************************************
//          DELETE REQUEST and POST NEW MESSAGE ABOUT DECLINE
// **************************************************************
app.post('/api/request/decline', function(request, response) {

  var requestInfo = request.body;

  var newInbox = new Message({
    projectId: requestInfo._id,
    projectName: requestInfo.projectName,
    to: requestInfo.from,
    from: requestInfo.to,
    requestTypes: requestInfo.requestTypes,
    description: 'Sorry, unfortunately your request to join ' + requestInfo.projectName + ' has been declined.',
    date: new Date(),
    request: false
  });

  var newOutbox = new Message({
    projectId: requestInfo._id,
    projectName: requestInfo.projectName,
    to: requestInfo.from,
    from: requestInfo.to,
    requestTypes: requestInfo.requestTypes,
    description: 'Sorry, unfortunately your request to join ' + requestInfo.projectName + ' has been declined.',
    date: new Date(),
    request: false
  });

  bluebird.all([
    newInbox.save(),
    newOutbox.save(),
    Message.remove({ _id: requestInfo._id })
  ])
  .spread(function(newInbox, newOutbox, deletedRequest) {

    var newInboxId = newInbox._id;
    var newOutboxId = newOutbox._id;

    return [ User.update({
        _id: requestInfo.from
      }, {
        $addToSet: {
          inbox: newInboxId
        }
      }), User.update({
        _id: requestInfo.to
      }, {
        $addToSet: {
          outbox: newOutboxId
        }
      })
    ];

  })
  .spread(function(updatedUser, updatedProjectOwner) {

    return response.json({
      message: "we deleted the request from the db"
    });
  })
  .catch(function(err) {
    console.log('error attempting to delete request from db:', err.message);
    response.status(500);
    response.json({
      error: err.message
    });
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

  var newInbox = new Message({
      projectId: projectId,
      projectName: projectName,
      to: username,
      from: projectOwner,
      requestTypes: acceptedTypes2, // Melody, Lyrics, Voice, Production
      description: note,
      date: new Date(),
      request: false
  });

  var newOutbox = new Message({
      projectId: projectId,
      projectName: projectName,
      to: username,
      from: projectOwner,
      requestTypes: acceptedTypes2, // Melody, Lyrics, Voice, Production
      description: note,
      date: new Date(),
      request: false
  });

// delete request
  bluebird.all([
    newInbox.save(),
    newOutbox.save(),
    Message.remove({ _id: requestId }),
    Project.findOne( { _id: projectId}),
    User.findOne({ _id: username }),
    User.findOne({ _id: projectOwner }),
   ])
    .spread(function(newInbox, newOutbox, acceptRequest, acceptProject, acceptUser, projectOwner) {
      var newInboxId = newInbox._id;
      var newOutboxId = newOutbox._id;
      var userInbox = acceptUser.inbox;
      var projectOwnerOutbox = projectOwner.outbox;
      projectOwnerOutbox.push(newOutboxId);
      userInbox.push(newInboxId);

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
            projects: projectsArr,
            inbox: userInbox
          }
        }), User.update({
          _id: projectOwner
          }, {
            $set: {
              outbox: projectOwnerOutbox
            }
          }), Project.update({
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
    .spread(function(updatedUser, updatedProjectOwner, updatedProject) {
      console.log('updated user:', updatedUser);
      console.log('updated project:', updatedProject);

      return response.json({
        message: "in accept, accepted the request from the db"
      });
    })
    .catch(function(err) {
      console.log('error attempting to delete request from db:', err.message);
      response.status(500);
      response.json({
        error: err.message
      });
    });

})

// ***********************************************************************
//          GET PROJECT INFO AND FILES BELONGING TO THAT PROJECT
// **********************************************************************
app.get('/api/project/file/upload/new/:projectId', function(request, response) {

  var projectId = request.params.projectId;

  Project.findOne({ _id: projectId })
    .then(function(projInfo) {
      var projFiles = projInfo.files;

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
      response.status(500);
      response.json({
        error: err.message
      });
    });

});

// *****************************************
//          DELETE FILE FROM PROJECT
// ****************************************
app.delete('/api/:projectid/file/remove/:fileid', function(request, response) {

  var projectId = request.params.projectid;
  var fileId = request.params.fileid;

  bluebird.all([
      File.remove({ _id: fileId }),
      Project.update({
        _id: projectId
      }, {
        $pull: {
          files: fileId
        }
      })
    ])
    .spread(function(removedFile, updatedProject) {

      return response.json({
        message: 'success deleting file!'
      });
    })
    .catch(function(err) {
      console.log('error deleting file...', err.message);
      response.status(500);
      response.json({
        error: err.message
      });
    });

});

app.listen(3000, function() {
  console.log('The server has started to listen........');
});
