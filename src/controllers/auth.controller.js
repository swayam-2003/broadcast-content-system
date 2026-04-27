const authService = require('../services/auth.service');
const { ValidationError } = require('../utils/errors');
const logger = require('../utils/logger');

class AuthController {
  async register(req, res, next) {
    try {
      const { email, password, name, role } = req.body;

      const user = await authService.register(email, password, name, role);
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        user,
      });
    } catch (err) {
      next(err);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        throw new ValidationError('Email and password are required');
      }

      const result = await authService.login(email, password);
      res.json({
        success: true,
        message: 'Login successful',
        token: result.token,
        user: result.user,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AuthController();
