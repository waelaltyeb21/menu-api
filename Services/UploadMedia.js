const multer = require("multer");
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // Max Uploaded File 2 MB
});

module.exports = upload;

// {
//   destination: (req, file, cb) => {
//     // Restaurant Folder Images
//     cb(null, `uploads/`);
//   },
//   filename: async (req, file, cb) => {
//     console.log("File1: ", file.buffer);
//     console.log("File2: ", req.file.buffer);
//     cb(null, file.originalname);
//   },
// }