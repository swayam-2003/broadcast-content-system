const schedulerService = require('../services/scheduler.service');
const { NotFoundError } = require('../utils/errors');
const logger = require('../utils/logger');

class BroadcastController {
  async getLiveContent(req, res, next) {
    try {
      const { teacherId } = req.params;

      if (!teacherId) {
        throw new NotFoundError('Teacher not found');
      }

      const activeContent = await schedulerService.getCurrentActiveContent(teacherId);

      // If no active content, return appropriate message
      if (activeContent.length === 0) {
        return res.json({
          success: true,
          message: 'No content available',
          content: [],
        });
      }

      res.json({
        success: true,
        message: 'Active content retrieved successfully',
        content: activeContent,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new BroadcastController();
