const util = require("util");
const path = require("path");
const multer = require("multer");
const fs = require('fs')

var storage = multer.diskStorage({
    destination: (req, file, callback) => {
      if(req.body.album === "new")
      {
        var albumDir = [(process.env.FILES_DIR), req.user._id, "/",req.body.newAlbum, "/"].join('');
      }
      else
      {
        var albumDir = [(process.env.FILES_DIR), req.user._id, "/",req.body.existAlbum, "/"].join('');
      }
      console.log(albumDir);
      // check if directory exists
      if (!fs.existsSync(albumDir)) {
      // if not create directory
        fs.mkdirSync(albumDir);
      }
    callback(null, albumDir);
  },
  filename: (req, file, callback) => {
    const match = ["image/x-canon-cr2", "image/raw", "image/x-sony-arw",
                   "image/x-pentax-pef", "image/x-nikon-nef"];

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