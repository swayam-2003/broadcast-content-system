const { body, validationResult } = require('express-validator');
const { ValidationError } = require('../utils/errors');

class ValidatorMiddleware {
  validateLoginRegister() {
    return [
      body('email').isEmail().withMessage('Invalid email address'),
      body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
      body('name').if((value, { req }) => req.method === 'POST' && req.path === '/api/auth/register')
        .notEmpty().withMessage('Name is required'),
    ];
  }

  validateContentUpload() {
    return [
      body('title').notEmpty().withMessage('Title is required'),
      body('subject').notEmpty().withMessage('Subject is required'),
      body('startTime').optional().isISO8601().withMessage('Invalid start time format'),
      body('endTime').optional().isISO8601().withMessage('Invalid end time format'),
      body('rotationOrder').optional().isInt().withMessage('Rotation order must be an integer'),
      body('rotationDuration').optional().isInt({ min: 1 }).withMessage('Rotation duration must be a positive integer'),
    ];
  }

  handleValidationErrors(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const messages = errors.array().map(err => err.msg);
      return next(new ValidationError(messages.join(', ')));
    }
    next();
  }
}

module.exports = new ValidatorMiddleware();
