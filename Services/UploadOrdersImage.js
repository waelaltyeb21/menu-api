const multer = require("multer");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "Uploads/Images/");
  },
  filename: (req, file, cb) => {
    // cb(null, new Date().getTime());
    cb(null, `${file.originalname}${new Date().getTime()}.png`);
  },
});

const upload = multer({ storage });

module.exports = upload;
