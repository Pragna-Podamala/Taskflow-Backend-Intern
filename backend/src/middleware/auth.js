const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { errorResponse } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * Protect routes — verifies JWT and attaches user to req
 */
const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return errorResponse(res, 'Access denied. No token provided.', 401);
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return errorResponse(res, 'Token expired. Please log in again.', 401);
      }
      return errorResponse(res, 'Invalid token. Please log in again.', 401);
    }

    // Check user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return errorResponse(res, 'The user belonging to this token no longer exists.', 401);
    }

    // Check if user is active
    if (!currentUser.isActive) {
      return errorResponse(res, 'Your account has been deactivated. Contact support.', 403);
    }

    // Check if password was changed after token was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
      return errorResponse(res, 'Password recently changed. Please log in again.', 401);
    }

    req.user = currentUser;
    next();
  } catch (error) {
    logger.error(`Auth middleware error: ${error.message}`);
    return errorResponse(res, 'Authentication failed.', 500);
  }
};

/**
 * Role-based access control
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return errorResponse(
        res,
        `Access denied. Role '${req.user.role}' is not authorized for this action.`,
        403
      );
    }
    next();
  };
};

/**
 * Optional auth — attaches user if token present, but doesn't block
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (user && user.isActive) req.user = user;
    }
  } catch {
    // Silently ignore — optional auth
  }
  next();
};

module.exports = { protect, authorize, optionalAuth };
