const util = require("util");
const multer = require("multer");
const {GridFsStorage} = require("multer-gridfs-storage");

var storage = new GridFsStorage({
  url: process.env.MONGO_CONNECTION,
  options: { useNewUrlParser: true, useUnifiedTopology: true },
  file: (req, file) => {
    const match = ["image/CR2", "image/RAW"];

    if (match.indexOf(file.mimetype) === -1) {
      const filename = `${Date.now()}-astrophoto-${file.originalname}`;
      return filename;
    }

    return {
      bucketName: "fs",
      filename: `${Date.now()}-astrophoto-${file.originalname}`
    };
  }
});

var uploadFiles = multer({ storage: storage }).array("multi-files", 10);
var uploadFilesMiddleware = util.promisify(uploadFiles);
module.exports = uploadFilesMiddleware;