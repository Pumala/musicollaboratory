const mongoose      = require('mongoose');
const bluebird      = require('bluebird');
const express       = require('express');
const bodyParser    = require('body-parser');
const uuidV4        = require('uuid/v4');
const moment        = require('moment');
// BCRYPT
const bcrypt        = require('bcrypt-promise');
const saltRounds = 10;
const myPlaintextPassword = 's0/\/\P4$$w0rD';
const someOtherPlaintextPassword = 'not_bacon';

const app           = express();
mongoose.Promise    = bluebird;
const ObjectId      = mongoose.Schema.ObjectId;

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
  existingTypes: [String], // Melody, Lyrics, Voice, Production
  seekingTypes: [String], // Melody, Lyrics, Voice, Production
  files: [String] // uploading files ( mp3, lyrics ), // file hash name
});

const File = mongoose.model('File', {
  _id: { type: String, required: true, unique: true }, // file hash name
  name: { type: String, required: true },
  originalName: { type: String, required: true },
  owner: String, // username
  path: String
});

const AuthToken = mongoose.model('AuthToken', {
  _id: { type: String, required: true, unique: true },
  expires: { type: Date, required: true }
});

require('./experiment/file.js')(app);


app.listen(3000, function() {
  console.log('The server has started to listen........');
});
