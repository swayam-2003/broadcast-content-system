const { Router } = require('express');
const authController = require('../controllers/auth.controller');
const { authLimiter } = require('../middlewares/rate-limit.middleware');

const router = Router();

// BONUS 1: Rate limiting on auth endpoints
router.post('/register', authLimiter, (req, res, next) => authController.register(req, res, next));
router.post('/login', authLimiter, (req, res, next) => authController.login(req, res, next));

module.exports = router;
