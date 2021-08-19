const util = require("util");
const path = require("path");
const multer = require("multer");
const fs = require('fs')

var storage = multer.diskStorage({
    destination: (req, file, callback) => {
    var albumDir = [(process.env.FILES_DIR), req.user._id, "/",req.body.nameAlbum, "/"].join('');
    console.log(albumDir);
    // check if directory exists
    if (!fs.existsSync(albumDir)) {
    // if not create directory
        fs.mkdirSync(albumDir);
    }
    callback(null, albumDir);
  },
  filename: (req, file, callback) => {
    const match = ["image/x-canon-cr2", "image/raw", "image/png", "image/jpeg"];

    if (match.indexOf(file.mimetype) === -1) {
      var message = `${file.originalname} is invalid. Only accept RAW format.`;
      return callback(message, null);
    }
    

    var filename = `${file.originalname}`;
    callback(null, filename);
  }
});

var uploadFiles = multer({ storage: storage }).array("multi-files", 15);
var uploadFilesMiddleware = util.promisify(uploadFiles);
module.exports = uploadFilesMiddleware;