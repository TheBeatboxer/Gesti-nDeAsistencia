const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.authMiddleware = async (req, res, next) => {
  try {
    // 1. Obtener y validar el token
    const token = req.header('Authorization')?.replace('Bearer ','') || req.query.token;
    if(!token) {
      console.log('Auth Error: No token provided');
      return res.status(401).json({ msg: 'No token provided' });
    }

    // 2. Verificar el token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      console.log('JWT Verification Error:', jwtError.message);
      return res.status(401).json({ msg: 'Invalid token', error: jwtError.message });
    }

    // 3. Buscar el usuario
    const user = await User.findById(decoded.id).select('-password');
    if(!user) {
      console.log('Auth Error: User not found for token');
      return res.status(401).json({ msg: 'User not found' });
    }

    // 4. Verificar si el usuario está activo (opcional, pero buena práctica)
    // Aquí puedes agregar lógica adicional si es necesario

    // 5. Usuario encontrado
    console.log('Auth Success:', {
      userId: user._id,
      role: user.role,
      path: req.path,
      method: req.method
    });

    req.user = user;
    next();
  } catch(err) {
    console.error('Auth Middleware Error:', err);
    return res.status(500).json({ msg: 'Server error in auth' });
  }
};

exports.authorizeRoles = (...roles) => (req, res, next) => {
  try {
    if (!req.user) {
      console.log('Authorization Error: No user in request');
      return res.status(403).json({ msg: 'No user found in request' });
    }

    if (!roles.includes(req.user.role)) {
      console.log('Authorization Error: Invalid role', {
        userRole: req.user.role,
        requiredRoles: roles,
        path: req.path,
        method: req.method
      });
      return res.status(403).json({ 
        msg: 'Insufficient permissions',
        userRole: req.user.role,
        requiredRoles: roles
      });
    }

    console.log('Authorization Success:', {
      userId: req.user._id,
      role: req.user.role,
      path: req.path
    });
    next();
  } catch (err) {
    console.error('Authorization Middleware Error:', err);
    return res.status(500).json({ msg: 'Server error in authorization' });
  }
};
