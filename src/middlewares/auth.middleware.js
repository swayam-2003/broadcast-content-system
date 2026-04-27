const authService = require('../services/auth.service');
const { UnauthorizedError, ForbiddenError } = require('../utils/errors');
const logger = require('../utils/logger');

class AuthMiddleware {
  verifyToken(req, res, next) {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedError('Authorization header missing or invalid');
      }

      const token = authHeader.slice(7); // Remove 'Bearer ' prefix
      const decoded = authService.verifyToken(token);

      req.user = decoded;
      next();
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AuthMiddleware();
