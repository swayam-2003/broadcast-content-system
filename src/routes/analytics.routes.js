const { Router } = require('express');
const analyticsController = require('../controllers/analytics.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const rbacMiddleware = require('../middlewares/rbac.middleware');

const router = Router();

// Principal only - view all subject stats
router.get(
  '/stats',
  authMiddleware.verifyToken,
  rbacMiddleware.requireRole('principal'),
  (req, res, next) => analyticsController.getStats(req, res, next)
);

// Principal only - most active subject
router.get(
  '/most-active',
  authMiddleware.verifyToken,
  rbacMiddleware.requireRole('principal'),
  (req, res, next) => analyticsController.getMostActive(req, res, next)
);

// Teacher only - view own teacher stats
router.get(
  '/teacher-stats',
  authMiddleware.verifyToken,
  rbacMiddleware.requireRole('teacher'),
  (req, res, next) => analyticsController.getTeacherStats(req, res, next)
);

// Principal only - specific content stats
router.get(
  '/content/:contentId',
  authMiddleware.verifyToken,
  rbacMiddleware.requireRole('principal'),
  (req, res, next) => analyticsController.getContentStats(req, res, next)
);

// Principal only - trending content
router.get(
  '/trending',
  authMiddleware.verifyToken,
  rbacMiddleware.requireRole('principal'),
  (req, res, next) => analyticsController.getTrending(req, res, next)
);

module.exports = router;
