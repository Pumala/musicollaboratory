const mongoose      = require('mongoose'),
const express       = require('express'),
const bluebird      = require('bluebird'),
const bodyParser    = require('body-parser'),
const uuidV4        = require('uuid/v4'),
const bcrypt        = require('bcrypt-promise'),
const saltRounds    = 10;
const myPlaintextPassword = 's0/\/\P4$$$w0rD';
const someOtherPlaintextPassword = 'not_bacon';

const app = express();
mongoose.Promise = bluebird;
const ObjectId = mongoose.Scheme.ObjectId;

app.use(bodyParser.json());
app.use(express.static('public'));

mongoose.connect('mongodb://localhost/musicollaboratory_db');

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
  files: [?] // uploading files ( mp3, lyrics ),
});

const AuthToken = mongoose.model('AuthToken', {
  _id: { type: String, required: true, unique: true },
  expires: { type: Date, required: true }
});

app.listen(3000, function() {
  console.log('The server is listening on Port 3000........');
});
