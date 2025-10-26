const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Helper: same week start logic (duplicate or import)
function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0,0,0,0);
  return d;
}

exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, area, turno } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ msg: 'name, email, password, role required' });
    }
    // Only ADMIN can create users
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ msg: 'Only admin can create users' });
    }
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ msg: 'Email already exists' });
    const user = new User({ name, email, password, role, area, turno });
    await user.save();
    res.status(201).json({ msg: 'User created', user: { id: user._id, name, email, role, area, turno } });
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
      const today = new Date();
      const ws = getWeekStart(today);
      const assignment = await Assignment.findOne({ weekStart: ws }).lean();
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
    const payload = { ...req.body };
    if (payload.password) {
      const salt = await bcrypt.genSalt(10);
      payload.password = await bcrypt.hash(payload.password, salt);
    } else {
      delete payload.password; // Don't update password if not provided
    }
    const u = await User.findByIdAndUpdate(req.params.id, payload, { new: true }).select('-password');
    res.json(u);
  } catch (err) { res.status(500).json({ msg: err.message }); }
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
