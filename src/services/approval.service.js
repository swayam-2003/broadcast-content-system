const contentModel = require('../models/content.model');
const { ValidationError, NotFoundError, ForbiddenError } = require('../utils/errors');
const logger = require('../utils/logger');

class ApprovalService {
  async getPendingContent() {
    const content = await contentModel.findPending();
    return content;
  }

  async getAllContent() {
    const content = await contentModel.findAll();
    return content;
  }

  async approveContent(contentId, principalId) {
    const content = await contentModel.findById(contentId);

    if (!content) {
      throw new NotFoundError('Content not found');
    }

    if (content.status !== 'pending') {
      throw new ValidationError(`Content status is ${content.status}, only pending content can be approved`);
    }

    const approvedContent = await contentModel.approve(contentId, principalId);
    logger.info(`Content approved: ${contentId} by principal ${principalId}`);
    
    return approvedContent;
  }

  async rejectContent(contentId, principalId, reason) {
    if (!reason) {
      throw new ValidationError('Rejection reason is required');
    }

    const content = await contentModel.findById(contentId);

    if (!content) {
      throw new NotFoundError('Content not found');
    }

    if (content.status !== 'pending') {
      throw new ValidationError(`Content status is ${content.status}, only pending content can be rejected`);
    }

    const rejectedContent = await contentModel.reject(contentId, reason);
    logger.info(`Content rejected: ${contentId} by principal ${principalId}`);
    
    return rejectedContent;
  }
}

module.exports = new ApprovalService();
