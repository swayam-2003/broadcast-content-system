const { Router } = require('express');
const approvalController = require('../controllers/approval.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const rbacMiddleware = require('../middlewares/rbac.middleware');

const router = Router();

// Get pending content (principal only)
router.get(
  '/pending',
  authMiddleware.verifyToken,
  rbacMiddleware.requireRole('principal'),
  (req, res, next) => approvalController.getPending(req, res, next)
);

// Get all content (principal only)
router.get(
  '/all',
  authMiddleware.verifyToken,
  rbacMiddleware.requireRole('principal'),
  (req, res, next) => approvalController.getAll(req, res, next)
);

// Approve content (principal only)
router.post(
  '/approve/:contentId',
  authMiddleware.verifyToken,
  rbacMiddleware.requireRole('principal'),
  (req, res, next) => approvalController.approve(req, res, next)
);

// Reject content (principal only)
router.post(
  '/reject/:contentId',
  authMiddleware.verifyToken,
  rbacMiddleware.requireRole('principal'),
  (req, res, next) => approvalController.reject(req, res, next)
);

module.exports = router;
