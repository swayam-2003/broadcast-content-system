const contentModel = require('../models/content.model');
const uploadService = require('./upload.service');
const { ValidationError, NotFoundError } = require('../utils/errors');
const logger = require('../utils/logger');

class ContentService {
  async uploadContent(file, userId, contentMetadata) {
    if (!file) {
      throw new ValidationError('File is required');
    }

    const { title, subject, description, startTime, endTime, rotationOrder, rotationDuration } = contentMetadata;

    // Validate required fields
    if (!title) {
      throw new ValidationError('Title is required');
    }

    if (!subject) {
      throw new ValidationError('Subject is required');
    }

    // Validate time window
    if (startTime && endTime) {
      if (new Date(startTime) >= new Date(endTime)) {
        throw new ValidationError('Start time must be before end time');
      }
    }

    // Validate rotation order
    if (rotationOrder && isNaN(parseInt(rotationOrder))) {
      throw new ValidationError('Rotation order must be a number');
    }

    // Get file metadata
    const fileMetadata = uploadService.getFileMetadata(file);

    // Create content record
    const contentData = {
      title,
      subject,
      description: description || null,
      filePath: fileMetadata.filePath,
      fileType: fileMetadata.fileType,
      fileSize: fileMetadata.fileSize,
      uploadedBy: userId,
      startTime: startTime || null,
      endTime: endTime || null,
      rotationOrder: rotationOrder || 0,
      rotationDuration: rotationDuration || 5,
    };

    const content = await contentModel.create(contentData);
    logger.info(`Content uploaded: ${content.id} by user ${userId}`);
    
    return content;
  }

  async getTeacherContent(userId) {
    const content = await contentModel.findByTeacher(userId);
    return content;
  }

  async getContentById(contentId) {
    const content = await contentModel.findById(contentId);
    if (!content) {
      throw new NotFoundError('Content not found');
    }
    return content;
  }
}

module.exports = new ContentService();
