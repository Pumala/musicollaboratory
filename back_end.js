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
  projects: [ObjectId], // Project Id
  token: String // token
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
    senderName: { type: String, required: true },
    projectOwner: { type: String, required: true },
    requestTypes: {
      melody: Boolean,
      lyrics: Boolean,
      voice: Boolean,
      production: Boolean
    }, // Melody, Lyrics, Voice, Production
    projectId: ObjectId,
    description: String,
    date: Date
});

const File = mongoose.model('File', {
  _id: { type: String, required: true, unique: true }, // file hash name
  originalName: { type: String, required: true },
  owner: String, // username
  path: String
});

const AuthToken = mongoose.model('AuthToken', {
  _id: { type: String, required: true, unique: true },
  expires: { type: Date, required: true }
});

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

app.post('/api/search/projects', function(request, response) {

  var needsInfo = request.body.needsInfo;

  var needsArr = getTypes([needsInfo]);
  //
  console.log(needsInfo);
  console.log('Needs Arr:', needsArr);

  // seekingTypes: {
  //   melody: Boolean,
  //   lyrics: Boolean,
  //   voice: Boolean,
  //   production: Boolean
  // }, // Melody, Lyrics, Voice, Production

  // Project.find({
  //   $or: [
  //     { seekingTypes.melody: needsInfo.melody }
  //   ]
  //     seekingTypes.melody: {
  //       $in: [needsArr]
  //     }
  //   })
  //   .then(function(results) {
  //     console.log('projects results:', results);
  //     return response.json(results);
  //   })
  //   .catch(function(err) {
  //     console.log('error querying for projects:', err.message);
  //   });

  var conditions = [];

  for (key in needsInfo) {
    if (needsInfo[key]) {
      var seek = "seekingTypes." + key;
      var cond = {};
      cond[seek] = needsInfo[key];
      conditions.push(cond);
    }
  }

  console.log('the CONDITIONS:', conditions);
  // { 'seekingType.voice': true }

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

app.post('/api/signup', function(request, response) {
  console.log('SIGNUP INFO:', request.body);
  var data = request.data;

  var firstName = data.firstName;
  var lastName = data.lastName;
  var username = data.username;
  var email = data.email;
  var password = data.password;

  var newUser = {
    firstName: firstName,
    lastName: lastName,
    email: email,
    password: password,
    joined: new Date(),
    bio: "",
    musicanType: [],
    projects: [],
    token: ""
  }

  newUser.save();

  // const User = mongoose.model( 'User', {
  //   _id: { type: String, required: true, unique: true }, // username
  //   firstName: { type: String, required: true },
  //   lastName: { type: String, required: true },
  //   email: { type: String, required: true },
  //   password: { type: String },
  //   joined: Date,
  //   bio: String,
  //   musicanType: [String], // Melody, Lyrics, Voice, Production
  //   projects: [ObjectId], // Project Id
  //   token: String // token
  // });

});

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

app.post('/upload', upload.single('file'), function(req, res) {

  console.log('reached this API');

  // hard-coded for now
  var username = 'Lulu';

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

  var projectId = "5859c2268dc69cbea0550bd2";

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

  console.log('HOLA!!');
});

// Send request to project owner
app.post('/api/request', function(request, response) {
  // const Request = mongoose.model('Request', {
  //     senderName: { type: String, required: true },
  //     projectOwner: String,
  //     requestTypes: String, // Melody, Lyrics, Voice, Production
  //     projectId: ObjectId,
  //     description: String,
  //     date: Date
  // });
  console.log('request.body is:', request.body);
  var projectOwner = request.body.owner;

  var requestTypes = request.body.request;

  var requestTypes = getTypes(requestTypes);

  // var newRequest = new Request ({
  //   senderName:
  // })
  console.log(requestTypes);

});

app.post('/api/new/project', function(request, response) {

  console.log(request.body);

  //  hard code for now until we have sign up/login functionality set up
  var owner = 'sunny';

  var results = request.body;
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

  newProject.save();

  return 'Created new project!';

});


app.listen(3000, function() {
  console.log('The server has started to listen........');
});
