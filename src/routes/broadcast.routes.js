const { Router } = require('express');
const broadcastController = require('../controllers/broadcast.controller');

const router = Router();

// Public endpoint - no authentication required
router.get(
  '/live/:teacherId',
  (req, res, next) => broadcastController.getLiveContent(req, res, next)
);

module.exports = router;
