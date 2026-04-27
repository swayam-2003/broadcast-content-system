const { ForbiddenError } = require('../utils/errors');

class RBACMiddleware {
  requireRole(...allowedRoles) {
    return (req, res, next) => {
      if (!req.user) {
        return next(new ForbiddenError('User not authenticated'));
      }

      if (!allowedRoles.includes(req.user.role)) {
        return next(new ForbiddenError(`This action requires one of these roles: ${allowedRoles.join(', ')}`));
      }

      next();
    };
  }
}

module.exports = new RBACMiddleware();
