const { Router } = require('express');
const contentController = require('../controllers/content.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const rbacMiddleware = require('../middlewares/rbac.middleware');
const uploadMiddleware = require('../middlewares/upload.middleware');

const router = Router();

// Upload content (teacher only)
router.post(
  '/upload',
  authMiddleware.verifyToken,
  rbacMiddleware.requireRole('teacher'),
  uploadMiddleware.single('file'),
  (req, res, next) => contentController.upload(req, res, next)
);

// Get my content (teacher only)
router.get(
  '/my-content',
  authMiddleware.verifyToken,
  rbacMiddleware.requireRole('teacher'),
  (req, res, next) => contentController.getMyContent(req, res, next)
);

module.exports = router;
