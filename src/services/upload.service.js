const path = require('path');
const fs = require('fs').promises;
const config = require('../config');
const { ValidationError } = require('../utils/errors');

class UploadService {
  validateFileUpload(file) {
    if (!file) {
      throw new ValidationError('File is required');
    }

    if (file.size > config.upload.maxSize) {
      throw new ValidationError(
        `File size exceeds limit of ${config.upload.maxSize / (1024 * 1024)}MB`
      );
    }

    if (!config.upload.allowedTypes.includes(file.mimetype)) {
      throw new ValidationError(
        `Invalid file type. Allowed types: ${config.upload.allowedExtensions.join(', ')}`
      );
    }

    return true;
  }

  getFileMetadata(file) {
    if (!file) {
      throw new ValidationError('File is required');
    }

    return {
      filename: file.filename,
      filePath: path.join(config.upload.dir, file.filename),
      fileType: file.mimetype,
      fileSize: file.size,
    };
  }
}

module.exports = new UploadService();
