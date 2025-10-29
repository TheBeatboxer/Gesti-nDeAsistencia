const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Helper: normalize date to 00:00:00
function normalizeDate(date) {
  const d = new Date(date);
  d.setHours(0,0,0,0);
  return d;
}

exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, area, turno, linea, puesto, codigo } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ msg: 'name, email, password, role required' });
    }
    // Only ADMIN can create users
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ msg: 'Only admin can create users' });
    }
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ msg: 'Email already exists' });
    const user = new User({ name, email, password, role, area, turno, linea, puesto, codigo });
    await user.save();
    res.status(201).json({ msg: 'User created', user: { id: user._id, name, email, role, area, turno, linea, puesto, codigo } });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.listAll = async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'ADMIN') {
      // Admin can see all users
      filter = {};
    } else if (req.user.role === 'ENCARGADO') {
      // Encargado can only see workers in their assigned area and turno
      const today = normalizeDate(new Date());
      const assignment = await Assignment.findOne({
        startDate: { $lte: today },
        endDate: { $gte: today }
      }).lean();
      if (assignment) {
        const encAssign = assignment.assignments.find(a => a.encargado.toString() === req.user._id.toString());
        if (encAssign) {
          filter = { role: 'WORKER', area: encAssign.area, turno: encAssign.turno };
        } else {
          filter = { _id: null }; // No workers if no assignment
        }
      } else {
        filter = { _id: null };
      }
    } else {
      // Workers see nothing
      filter = { _id: null };
    }
    const users = await User.find(filter).select('-password');
    res.json(users);
  } catch (err) { res.status(500).json({ msg: err.message }); }
};

exports.getById = async (req, res) => {
  try {
    const u = await User.findById(req.params.id).select('-password');
    if (!u) return res.status(404).json({ msg: 'Not found' });
    res.json(u);
  } catch (err) { res.status(500).json({ msg: err.message }); }
};

exports.updateUser = async (req, res) => {
  try {
    // Only ADMIN can update users
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ msg: 'Only admin can update users' });
    }
    const u = await User.findById(req.params.id);
    if (!u) return res.status(404).json({ msg: 'User not found' });

    // Update fields
    if (req.body.name !== undefined) u.name = req.body.name;
    if (req.body.email !== undefined) u.email = req.body.email;
    if (req.body.role !== undefined) u.role = req.body.role;
    if (req.body.area !== undefined) u.area = req.body.area;
    if (req.body.turno !== undefined) u.turno = req.body.turno;
    if (req.body.linea !== undefined) u.linea = req.body.linea;
    if (req.body.puesto !== undefined) u.puesto = req.body.puesto;
    if (req.body.codigo !== undefined) u.codigo = req.body.codigo;
    if (req.body.password) {
      u.password = req.body.password; // Plain text, pre-save hook will hash it
    }

    await u.save();
    const updatedUser = await User.findById(req.params.id).select('-password');
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    // Only ADMIN can delete users
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ msg: 'Only admin can delete users' });
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Deleted' });
  } catch (err) { res.status(500).json({ msg: err.message }); }
};
