const multer = require('multer');
const path = require('path');
const { v4: uuid } = require('uuid');
const config = require('../config');
const { ValidationError } = require('../utils/errors');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.upload.dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).slice(1);
    const uniqueName = `${Date.now()}-${uuid()}.${ext}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  if (!config.upload.allowedTypes.includes(file.mimetype)) {
    const error = new ValidationError(
      `Invalid file type. Allowed types: ${config.upload.allowedExtensions.join(', ')}`
    );
    return cb(error);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.upload.maxSize,
  },
});

module.exports = upload;
