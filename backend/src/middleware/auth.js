const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.authMiddleware = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ','') || req.query.token;
  if(!token) return res.status(401).json({ msg: 'No token' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if(!user) return res.status(401).json({ msg: 'Invalid token' });
    req.user = user;
    next();
  } catch(err) {
    return res.status(401).json({ msg: 'Token invalid', err: err.message });
  }
};

exports.authorizeRoles = (...roles) => (req, res, next) => {
  if(!req.user || !roles.includes(req.user.role)) return res.status(403).json({ msg: 'Forbidden' });
  next();
};
