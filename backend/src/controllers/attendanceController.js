const Attendance = require('../models/Attendance');
const Assignment = require('../models/Assignment');
const User = require('../models/User');
const moment = require('moment-timezone');

// Helper: normalize date to 00:00:00 in America/Lima timezone
function normalizeDate(date) {
  if (typeof date === 'string') {
    const [year, month, day] = date.split('-').map(Number);
    return moment.tz({ year, month: month - 1, day }, 'America/Lima').startOf('day').toDate();
  }
  const d = moment.tz(date, 'America/Lima');
  return d.startOf('day').toDate();
}

exports.markAttendance = async (req, res) => {
  try {
    const { date, workerId, status, observation } = req.body;
    if (!date || !workerId || !status) return res.status(400).json({ msg: 'date, workerId and status are required' });

    const d = normalizeDate(new Date(date));

    const assignment = await Assignment.findOne({
      startDate: { $lte: d },
      endDate: { $gte: d }
    }).lean();
    if (!assignment) return res.status(400).json({ msg: 'No assignment for the date' });

    // Validate encargado is assigned for this date
    const encAssign = assignment.assignments.find(a => a.encargado.toString() === req.user._id.toString());
    if (!encAssign && req.user.role !== 'ADMIN') return res.status(403).json({ msg: 'You are not assigned for this date' });

    // Check if attendance for this date is already finalized
    const existingFinalized = await Attendance.findOne({ date: d, finalized: true });
    if (existingFinalized) return res.status(400).json({ msg: 'Attendance for this date is already finalized' });

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

exports.finalizeAttendance = async (req, res) => {
  try {
    const { date } = req.body;
    if (!date) return res.status(400).json({ msg: 'date is required' });

    const d = normalizeDate(new Date(date));

    const assignment = await Assignment.findOne({
      startDate: { $lte: d },
      endDate: { $gte: d }
    }).lean();
    if (!assignment) return res.status(400).json({ msg: 'No assignment for the date' });

    // Validate encargado is assigned for this date
    const encAssign = assignment.assignments.find(a => a.encargado.toString() === req.user._id.toString());
    if (!encAssign && req.user.role !== 'ADMIN') return res.status(403).json({ msg: 'You are not assigned for this date' });

    // Get all workers for this encargado's area and turno
    const workers = await User.find({ role: 'WORKER', area: encAssign.area, turno: encAssign.turno }).select('_id');
    const workerIds = workers.map(w => w._id.toString());

    // Check if all workers have attendance marked
    const markedAttendances = await Attendance.find({ date: d, worker: { $in: workerIds } });
    if (markedAttendances.length < workerIds.length) {
      return res.status(400).json({ msg: 'Not all workers have attendance marked' });
    }

    // Finalize all attendances for this date and area/turno
    await Attendance.updateMany(
      { date: d, worker: { $in: workerIds } },
      { finalized: true }
    );

    res.json({ msg: 'Attendance finalized for the date' });
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

    // If encargado, filter by their assigned area and turno for the period
    if (req.user.role === 'ENCARGADO') {
      // Get all assignments where the encargado is assigned
      const assignments = await Assignment.find({
        assignments: { $elemMatch: { encargado: req.user._id } }
      }).lean();
      if (assignments.length > 0) {
        // Collect all areas and turnos for this encargado across assignments
        const areas = [...new Set(assignments.flatMap(a => a.assignments.filter(as => as.encargado.toString() === req.user._id.toString()).map(as => as.area)))];
        const turnos = [...new Set(assignments.flatMap(a => a.assignments.filter(as => as.encargado.toString() === req.user._id.toString()).map(as => as.turno)))];
        q.area = { $in: areas };
        q.turno = { $in: turnos };
        // Also filter dates to only within assignment periods
        const dateFilters = assignments.map(a => ({
          date: { $gte: a.startDate, $lte: a.endDate }
        }));
        if (dateFilters.length > 0) {
          q.$or = dateFilters;
        }
      }
    }

    const docs = await Attendance.find(q).populate('worker recordedBy', 'name email role').sort({ date: -1 });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};
