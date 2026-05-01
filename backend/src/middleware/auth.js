const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const authHeader = req.header('Authorization');
  console.log(`[Auth] Request to ${req.path} - Header present: ${!!authHeader}`);
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    // Check for session-based auth (cookies) as fallback
    if (req.session && req.session.userId) {
      req.user = { 
        userId: req.session.userId, 
        role: req.session.role 
      };
      return next();
    }
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const secret = process.env.JWT_SECRET || 'nexa_support_secret_key_12345';
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    return next();
  } catch (error) {
    console.error('JWT Verification Error:', error.message);
    return res.status(401).json({ error: 'Invalid token.' });
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  return next();
};

const protect = authMiddleware;
const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  return next();
};

module.exports = { authMiddleware, adminMiddleware, protect, authorize };