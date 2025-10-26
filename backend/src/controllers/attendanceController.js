const Attendance = require('../models/Attendance');
const Assignment = require('../models/Assignment');
const User = require('../models/User');

// Helper: same week start logic (duplicate or import)
function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0,0,0,0);
  return d;
}

exports.markAttendance = async (req, res) => {
  try {
    const { date, workerId, status, observation } = req.body;
    if (!date || !workerId || !status) return res.status(400).json({ msg: 'date, workerId and status are required' });

    const d = new Date(date);
    const weekStart = getWeekStart(d);

    const assignment = await Assignment.findOne({ weekStart }).lean();
    if (!assignment) return res.status(400).json({ msg: 'No assignment for the week' });

    // Validate encargado is assigned for this week
    const encAssign = assignment.assignments.find(a => a.encargado.toString() === req.user._id.toString());
    if (!encAssign && req.user.role !== 'ADMIN') return res.status(403).json({ msg: 'You are not assigned for this week' });

    // Check worker exists
    const worker = await User.findById(workerId);
    if (!worker) return res.status(404).json({ msg: 'Worker not found' });

    // Always use area and turno from assignment (for admin, use the first assignment or worker's area if none)
    const area = encAssign ? encAssign.area : (assignment.assignments[0]?.area || worker.area);
    const turno = encAssign ? encAssign.turno : (assignment.assignments[0]?.turno || 1);

    const payload = {
      date: d,
      worker: workerId,
      recordedBy: req.user._id,
      area,
      turno,
      status,
      observation
    };

    const record = await Attendance.findOneAndUpdate(
      { date: d, worker: workerId },
      payload,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json(record);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.getAttendanceReport = async (req, res) => {
  try {
    const { from, to, workerId, area, turno } = req.query;
    const q = {};
    if (workerId) q.worker = workerId;
    else if (req.user.role === 'WORKER') q.worker = req.user._id; // Workers see only their own
    if (from || to) q.date = {};
    if (from) q.date.$gte = new Date(from);
    if (to) q.date.$lte = new Date(to);
    if (area) q.area = area;
    if (turno) q.turno = turno;

    // If encargado, filter by their assigned area and turno
    if (req.user.role === 'ENCARGADO') {
      const today = new Date();
      const ws = getWeekStart(today);
      const assignment = await Assignment.findOne({ weekStart: ws }).lean();
      if (assignment) {
        const encAssign = assignment.assignments.find(a => a.encargado.toString() === req.user._id.toString());
        if (encAssign) {
          q.area = encAssign.area;
          q.turno = encAssign.turno;
        }
      }
    }

    const docs = await Attendance.find(q).populate('worker recordedBy', 'name email role').sort({ date: -1 });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};
