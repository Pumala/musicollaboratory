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
  owner: String
});

const Request = mongoose.model('Request', {
    projectId: ObjectId,
    projectOwner: { type: String, required: true },
    senderName: { type: String, required: true },
    requestTypes: [String], // Melody, Lyrics, Voice, Production
    description: String,
    date: Date
});

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
app.get('/api/project/:projectid', function(request, response) {

  var projectId = request.params.projectid;

  Project.findOne({ _id: projectId })
    .then(function(projectInfo) {
      return response.json(projectInfo);
    })
    .catch(function(err) {
      console.log('encountered errors retrieving project info from db:', err.message);
    });

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

  newRequest.save();

  return "request was added to db....."

});

// ********************************************
//          RETRIEVE ALL USER REQUESTS
// *******************************************
app.get('/api/requests/:username', function(request, response) {

  var username = request.params.username;

  Request.find()
    .then(function(allRequests) {
      return response.json({
        allRequests: allRequests
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
    owner: owner
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

app.get('/api/project/upload/:projectId', function(request, response) {

  var projectId = request.params.projectId;

  Project.findOne({ _id: projectId })
    .then(function(projInfo) {
      return response.json({
        projInfo: projInfo
      });
      // console.log(projInfo);
    })
    .catch(function(err) {
      console.log('encountered errors retrieving project data form upload:', err.message);
    });

});

app.listen(3000, function() {
  console.log('The server has started to listen........');
});
