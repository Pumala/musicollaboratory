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


app.listen(3000, function() {
  console.log('The server is listening on Port 3000........');
});
