const { query } = require('../utils/db');
const logger = require('../utils/logger');

class AnalyticsService {
  async recordAccess(contentId, subject, teacherId) {
    try {
      await query(
        `INSERT INTO content_analytics (content_id, teacher_id, subject, access_count, last_accessed)
         VALUES ($1, $2, $3, 1, CURRENT_TIMESTAMP)
         ON CONFLICT (content_id) DO UPDATE
         SET access_count = access_count + 1, last_accessed = CURRENT_TIMESTAMP`,
        [contentId, teacherId, subject]
      );
    } catch (err) {
      logger.error('Analytics record error', err);
      // Don't throw - analytics failure shouldn't break main flow
    }
  }

  async getMostActiveSubject() {
    try {
      const result = await query(
        `SELECT subject, SUM(access_count) as total_accesses
         FROM content_analytics
         GROUP BY subject
         ORDER BY total_accesses DESC
         LIMIT 1`
      );

      return result.rows[0] || null;
    } catch (err) {
      logger.error('Analytics most active error', err);
      return null;
    }
  }

  async getSubjectStats() {
    try {
      const result = await query(
        `SELECT subject, SUM(access_count) as total_accesses, COUNT(*) as content_count
         FROM content_analytics
         GROUP BY subject
         ORDER BY total_accesses DESC`
      );

      return result.rows;
    } catch (err) {
      logger.error('Analytics stats error', err);
      return [];
    }
  }

  async getTeacherStats(teacherId) {
    try {
      const result = await query(
        `SELECT subject, SUM(access_count) as total_accesses, COUNT(*) as content_count
         FROM content_analytics
         WHERE teacher_id = $1
         GROUP BY subject
         ORDER BY total_accesses DESC`,
        [teacherId]
      );

      return result.rows;
    } catch (err) {
      logger.error('Analytics teacher stats error', err);
      return [];
    }
  }

  async getContentStats(contentId) {
    try {
      const result = await query(
        `SELECT content_id, subject, access_count, last_accessed
         FROM content_analytics
         WHERE content_id = $1`,
        [contentId]
      );

      return result.rows[0] || null;
    } catch (err) {
      logger.error('Analytics content stats error', err);
      return null;
    }
  }

  async getTrendingContent(days = 7) {
    try {
      const result = await query(
        `SELECT c.id, c.title, c.subject, ca.access_count, ca.last_accessed
         FROM content_analytics ca
         JOIN content c ON ca.content_id = c.id
         WHERE ca.last_accessed > CURRENT_TIMESTAMP - INTERVAL '${days} days'
         ORDER BY ca.access_count DESC
         LIMIT 10`
      );

      return result.rows;
    } catch (err) {
      logger.error('Analytics trending error', err);
      return [];
    }
  }
}

module.exports = new AnalyticsService();
