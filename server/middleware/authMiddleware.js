import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  // Check cookies first for HTTP-Only token
  if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  } 
  // Fallback to Bearer token in headers
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ status: 'error', message: 'Not authorized, no token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user) {
      return res.status(401).json({ status: 'error', message: 'User not found' });
    }

    if (user.isBanned) {
      return res.status(403).json({ status: 'error', message: 'Account is banned. Contact support.' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ status: 'error', message: 'Not authorized, token failed or expired' });
  }
};

export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ status: 'error', message: 'Access denied. Admin only.' });
  }
};

export const checkCredits = (amount) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ status: 'error', message: 'Not authorized' });
      }

      if (req.user.credits < amount) {
        return res.status(402).json({ 
          status: 'error', 
          message: `Insufficient credits. This action requires ${amount} credits.`,
          requiredCredits: amount,
          currentCredits: req.user.credits
        });
      }

      next();
    } catch (error) {
      console.error('Check credits error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to verify credits' });
    }
  };
};
