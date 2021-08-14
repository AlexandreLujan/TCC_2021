const util = require("util");
const multer = require("multer");
const {GridFsStorage} = require("multer-gridfs-storage");

var storage = new GridFsStorage({
  url: process.env.MONGO_URL_1,
  options: { useNewUrlParser: true, useUnifiedTopology: true },
  file: (req, file) => {
    const match = ["image/RAW", "image/CR2"];
    return new Promise((resolve, reject) => {
      if (match.indexOf(file.mimetype) === -1) {
          resolve({
              bucketName: req.user._id,
              filename: `${file.originalname}`
          })
      } else {
          reject(Error("File type has been rejected"));
      }
    });  
  }
});

var uploadFiles = multer({ storage: storage }).array("multi-files", 10);
var uploadFilesMiddleware = util.promisify(uploadFiles);
module.exports = uploadFilesMiddleware;