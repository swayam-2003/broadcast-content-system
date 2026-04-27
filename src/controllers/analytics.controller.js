const analyticsService = require('../services/analytics.service');
const logger = require('../utils/logger');

class AnalyticsController {
  async getStats(req, res, next) {
    try {
      const stats = await analyticsService.getSubjectStats();
      res.json({
        success: true,
        message: 'Subject statistics retrieved successfully',
        stats,
      });
    } catch (err) {
      next(err);
    }
  }

  async getMostActive(req, res, next) {
    try {
      const mostActive = await analyticsService.getMostActiveSubject();
      res.json({
        success: true,
        message: 'Most active subject retrieved successfully',
        mostActive: mostActive || { message: 'No data available' },
      });
    } catch (err) {
      next(err);
    }
  }

  async getTeacherStats(req, res, next) {
    try {
      const stats = await analyticsService.getTeacherStats(req.user.userId);
      res.json({
        success: true,
        message: 'Teacher statistics retrieved successfully',
        stats,
      });
    } catch (err) {
      next(err);
    }
  }

  async getContentStats(req, res, next) {
    try {
      const { contentId } = req.params;
      const stats = await analyticsService.getContentStats(contentId);

      if (!stats) {
        return res.json({
          success: true,
          message: 'No statistics available for this content',
          stats: null,
        });
      }

      res.json({
        success: true,
        message: 'Content statistics retrieved successfully',
        stats,
      });
    } catch (err) {
      next(err);
    }
  }

  async getTrending(req, res, next) {
    try {
      const { days = 7 } = req.query;
      const trending = await analyticsService.getTrendingContent(parseInt(days));

      res.json({
        success: true,
        message: 'Trending content retrieved successfully',
        trending,
        period: `Last ${days} days`,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AnalyticsController();
