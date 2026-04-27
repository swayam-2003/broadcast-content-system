const contentService = require('../services/content.service');
const { ValidationError } = require('../utils/errors');
const logger = require('../utils/logger');

class ContentController {
  async upload(req, res, next) {
    try {
      if (!req.file) {
        throw new ValidationError('File is required');
      }

      const { title, subject, description, startTime, endTime, rotationOrder, rotationDuration } = req.body;

      const content = await contentService.uploadContent(req.file, req.user.userId, {
        title,
        subject,
        description,
        startTime,
        endTime,
        rotationOrder,
        rotationDuration,
      });

      res.status(201).json({
        success: true,
        message: 'Content uploaded successfully and awaiting approval',
        content,
      });
    } catch (err) {
      next(err);
    }
  }

  async getMyContent(req, res, next) {
    try {
      const content = await contentService.getTeacherContent(req.user.userId);
      res.json({
        success: true,
        count: content.length,
        content,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ContentController();
