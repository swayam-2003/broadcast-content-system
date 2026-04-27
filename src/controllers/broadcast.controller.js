const schedulerService = require('../services/scheduler.service');
const { CacheService } = require('../services/cache.service');
const analyticsService = require('../services/analytics.service');
const { NotFoundError } = require('../utils/errors');
const logger = require('../utils/logger');

class BroadcastController {
  async getLiveContent(req, res, next) {
    try {
      const { teacherId } = req.params;

      if (!teacherId) {
        throw new NotFoundError('Teacher not found');
      }

      // Try cache first (Redis Caching)
      const cacheKey = `live:${teacherId}`;
      const cached = await CacheService.get(cacheKey);
      if (cached) {
        return res.json({
          success: true,
          message: 'Active content retrieved successfully (cached)',
          content: cached,
          cached: true,
        });
      }

      // Get active content
      const activeContent = await schedulerService.getCurrentActiveContent(teacherId);

      // Record analytics 
      for (const item of activeContent) {
        await analyticsService.recordAccess(item.id, item.subject, teacherId);
      }

      // Cache result
      await CacheService.set(cacheKey, activeContent, 60); // Cache for 1 minute

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
        cached: false,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new BroadcastController();
