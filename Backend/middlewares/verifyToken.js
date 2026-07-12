const jwt = require('jsonwebtoken');
const UserModel = require('../models/UserModel');

async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : req.cookies?.token;

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized request. Please login' });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user is blocked
    const user = await UserModel.findById(req.user.id);
    if (user && user.blocked) {
      return res.status(403).json({ message: 'Your account has been blocked' });
    }
    
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

module.exports = { verifyToken };
