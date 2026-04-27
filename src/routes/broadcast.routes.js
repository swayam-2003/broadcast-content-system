const { Router } = require('express');
const broadcastController = require('../controllers/broadcast.controller');
const { publicLimiter } = require('../middlewares/rate-limit.middleware');

const router = Router();

// Public endpoint - no authentication required
// BONUS 1: Rate Limiting applied
router.get(
  '/live/:teacherId',
  publicLimiter,
  (req, res, next) => broadcastController.getLiveContent(req, res, next)
);

module.exports = router;
