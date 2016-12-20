module.exports = function (app) {
  const multer        = require('multer');
  // where to store the files => upload
  const upload     = multer({ dest: __dirname+'/../public/upload' });

  app.post('/api/upload', upload.single('myFile'), uploadImage);

  function uploadImage (req, res) {
    var myFile = req.file;
    console.log('this is the file:', myFile);
    var originalName = myFile.originalname;
    var filename = myFile.filename;
    var path = myFile.path;
    var destination = myFile.destination;
    var size = myFile.size;
    var mimetype = myFile.mimetype;

    // return myFile;
    res.send(myFile);
  }

};
