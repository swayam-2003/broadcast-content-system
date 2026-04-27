const approvalService = require('../services/approval.service');
const contentModel = require('../models/content.model');
const { ValidationError } = require('../utils/errors');
const logger = require('../utils/logger');

class ApprovalController {
  async getPending(req, res, next) {
    try {
      const { page = 1, limit = 10, subject, status = 'pending' } = req.query;

      const filters = { status };
      if (subject) filters.subject = subject;

      const result = await contentModel.findWithFilters(
        filters,
        parseInt(page),
        parseInt(limit)
      );

      res.json({
        success: true,
        ...result,
      });
    } catch (err) {
      next(err);
    }
  }

  async getAll(req, res, next) {
    try {
      const { page = 1, limit = 10, subject, status, teacher } = req.query;

      const filters = {};
      if (subject) filters.subject = subject;
      if (status) filters.status = status;
      if (teacher) filters.teacher = teacher;

      const result = await contentModel.findWithFilters(
        filters,
        parseInt(page),
        parseInt(limit)
      );

      res.json({
        success: true,
        ...result,
      });
    } catch (err) {
      next(err);
    }
  }

  async approve(req, res, next) {
    try {
      const { contentId } = req.params;

      if (!contentId) {
        throw new ValidationError('Content ID is required');
      }

      const content = await approvalService.approveContent(contentId, req.user.userId);
      res.json({
        success: true,
        message: 'Content approved successfully',
        content,
      });
    } catch (err) {
      next(err);
    }
  }

  async reject(req, res, next) {
    try {
      const { contentId } = req.params;
      const { rejectionReason } = req.body;

      if (!contentId) {
        throw new ValidationError('Content ID is required');
      }

      if (!rejectionReason) {
        throw new ValidationError('Rejection reason is required');
      }

      const content = await approvalService.rejectContent(contentId, req.user.userId, rejectionReason);
      res.json({
        success: true,
        message: 'Content rejected successfully',
        content,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ApprovalController();
