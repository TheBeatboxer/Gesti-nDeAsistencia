const Attendance = require('../models/Attendance');
const Assignment = require('../models/Assignment');
const User = require('../models/User');
const moment = require('moment-timezone');

// Helper: normalize date to 00:00:00 in America/Lima timezone
function normalizeDate(date) {
  const limaTZ = 'America/Lima';
  // If the date is a string like 'YYYY-MM-DD', parse it explicitly in Lima TZ
  if (typeof date === 'string') {
    return moment.tz(date, 'YYYY-MM-DD', limaTZ).startOf('day').toDate();
  }
  // If it's a Date object, convert to Lima TZ and normalize to start of day
  return moment(date).tz(limaTZ).startOf('day').toDate();
}

exports.markAttendance = async (req, res) => {
  try {
    const { date, workerId, status, observation } = req.body;
    if (!date || !workerId || !status) return res.status(400).json({ msg: 'date, workerId and status are required' });

  console.log('markAttendance payload:', { date, workerId, status });
  const d = normalizeDate(date);
  console.log('Normalized date (Lima startOfDay):', d);

    const assignment = await Assignment.findOne({
      startDate: { $lte: d },
      endDate: { $gte: d }
    }).lean();
    console.log('Assignment lookup result for date:', assignment ? assignment._id : null);
    if (!assignment) {
      console.log('No assignment found for date:', d);
      return res.status(400).json({ msg: 'No assignment for the date' });
    }

    // Validate encargado is assigned for this date
    const encAssign = assignment.assignments.find(a => a.encargado.toString() === req.user._id.toString());
    if (!encAssign && req.user.role !== 'ADMIN') return res.status(403).json({ msg: 'You are not assigned for this date' });



    // Check worker exists
    const worker = await User.findById(workerId);
    if (!worker) return res.status(404).json({ msg: 'Worker not found' });

    // Always use area and turno from assignment (for admin, use the first assignment or worker's area if none)
    const area = encAssign ? encAssign.area : (assignment.assignments[0]?.area || worker.area);
    const turno = encAssign ? encAssign.turno : (assignment.assignments[0]?.turno || 'dia');

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

    console.log('finalizeAttendance payload:', { date, userId: req.user._id });
    const d = normalizeDate(date);
    console.log('Normalized finalize date (Lima startOfDay):', d);

    const assignment = await Assignment.findOne({
      startDate: { $lte: d },
      endDate: { $gte: d }
    }).lean();
    console.log('Assignment lookup for finalize:', assignment ? assignment._id : null);
    if (!assignment) {
      console.log('No assignment found for finalize date:', d);
      return res.status(400).json({ msg: 'No assignment for the date' });
    }

    // Validate encargado is assigned for this date
    const encAssign = assignment.assignments.find(a => String(a.encargado) === String(req.user._id));
    if (!encAssign && req.user.role !== 'ADMIN') {
      console.log('User not assigned for finalize date:', req.user._id);
      return res.status(403).json({ msg: 'You are not assigned for this date' });
    }

    // Get all workers for this encargado's area and turno
    const areaToUse = encAssign ? encAssign.area : (assignment.assignments[0]?.area);
    const turnoToUse = encAssign ? encAssign.turno : (assignment.assignments[0]?.turno || 'dia');
    const workers = await User.find({ role: 'WORKER', area: areaToUse, turno: turnoToUse }).select('_id');
    const workerIds = workers.map(w => w._id.toString());

    if (workerIds.length === 0) {
      console.log('No workers found for area/turno:', { area: areaToUse, turno: turnoToUse });
      return res.status(400).json({ msg: 'No workers found for the assignment area/turno' });
    }

    // Check if all workers have attendance marked
    const markedAttendances = await Attendance.find({ date: d, worker: { $in: workerIds } });
    if (markedAttendances.length < workerIds.length) {
      console.log('Marked attendances count less than workers:', { marked: markedAttendances.length, total: workerIds.length });
      return res.status(400).json({ msg: 'Not all workers have attendance marked' });
    }


    // Mark attendance as finalized (keeping for compatibility but not blocking marking)
    const updateResult = await Attendance.updateMany(
      { date: d, worker: { $in: workerIds } },
      { finalized: true }
    );
    console.log('Attendance finalize update result:', updateResult);

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
