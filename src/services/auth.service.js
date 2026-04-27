const bcrypt = require('bcryptjs');
const jwt = require('jwt-simple');
const { v4: uuid } = require('uuid');
const { query } = require('../utils/db');
const { ValidationError, UnauthorizedError } = require('../utils/errors');
const config = require('../config');
const logger = require('../utils/logger');

class AuthService {
  async register(email, password, name, role) {
    // Validate input
    if (!email || !password || !name || !role) {
      throw new ValidationError('Email, password, name, and role are required');
    }

    if (!['principal', 'teacher'].includes(role)) {
      throw new ValidationError('Role must be either principal or teacher');
    }

    // Check if user exists
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      throw new ValidationError('User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const userId = uuid();
    const result = await query(
      'INSERT INTO users (id, email, password_hash, name, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, name, role',
      [userId, email, passwordHash, name, role]
    );

    logger.info(`User registered: ${email}`);
    return result.rows[0];
  }

  async login(email, password) {
    // Validate input
    if (!email || !password) {
      throw new ValidationError('Email and password are required');
    }

    // Find user
    const result = await query('SELECT id, email, password_hash, name, role FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const user = result.rows[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Generate JWT
    const token = this.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    logger.info(`User logged in: ${email}`);
    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  generateToken(payload) {
    return jwt.encode(payload, config.jwt.secret);
  }

  verifyToken(token) {
    try {
      return jwt.decode(token, config.jwt.secret);
    } catch (err) {
      throw new UnauthorizedError('Invalid or expired token');
    }
  }
}

module.exports = new AuthService();
