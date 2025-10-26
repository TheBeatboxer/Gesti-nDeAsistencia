const Assignment = require('../models/Assignment');
const User = require('../models/User');

// Helper: normalize to Monday 00:00:00
function getWeekStart(date) {
  let d = new Date(date);
  if (isNaN(d.getTime())) {
    // If invalid date, use current date
    d = new Date();
  }
  const day = d.getDay(); // 0 (Sun) - 6 (Sat)
  // calculate Monday
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0,0,0,0);
  d.setMinutes(0);
  d.setSeconds(0);
  d.setMilliseconds(0);
  return d;
}
exports.createOrUpdateAssignment = async (req, res) => {
  try {
    const { weekStart, assignments } = req.body;
    if (!weekStart || !Array.isArray(assignments)) {
      return res.status(400).json({ msg: 'weekStart and assignments required' });
    }
    // Validate assignments: ensure no duplicate encargados, and all have required fields
    const encargados = assignments.map(a => a.encargado);
    if (new Set(encargados).size !== encargados.length) {
      return res.status(400).json({ msg: 'Duplicate encargados in assignment' });
    }
    for (const a of assignments) {
      if (!a.encargado || !a.area || !a.turno) {
        return res.status(400).json({ msg: 'Each assignment must have encargado, area, turno' });
      }
    }
    const ws = getWeekStart(new Date(weekStart));
    const doc = await Assignment.findOneAndUpdate(
      { weekStart: ws },
      { weekStart: ws, assignments, createdBy: req.user._id },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).populate('assignments.encargado', 'name email area role turno');
    // Filter out assignments with null or invalid encargados
    doc.assignments = doc.assignments.filter(a => a.encargado);
    res.json(doc);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.getAssignmentForWeek = async (req, res) => {
  try {
    const ws = getWeekStart(new Date(req.params.weekStart));
    const doc = await Assignment.findOne({ weekStart: ws }).populate('assignments.encargado', 'name email area role turno');
    if (!doc) return res.status(404).json({ msg: 'No assignment for week' });
    // Filter out assignments with null or invalid encargados
    doc.assignments = doc.assignments.filter(a => a.encargado);
    res.json(doc);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.getCurrentAssignment = async (req, res) => {
  try {
    const today = new Date();
    const ws = getWeekStart(today);
    const doc = await Assignment.findOne({ weekStart: ws }).populate('assignments.encargado', 'name email area role turno');
    if (!doc) return res.status(404).json({ msg: 'No current assignment' });
    // Filter out assignments with null or invalid encargados
    doc.assignments = doc.assignments.filter(a => a.encargado);
    res.json(doc);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.rotateAssignments = async (req, res) => {
  try {
    // get latest assignment by weekStart
    const latest = await Assignment.findOne({}).sort({ weekStart: -1 }).lean();
    const nextWeekStart = (() => {
      const d = latest ? new Date(latest.weekStart) : new Date();
      d.setDate(d.getDate() + 7);
      return getWeekStart(d);
    })();

    let newAssignments = [];
    if (latest && Array.isArray(latest.assignments) && latest.assignments.length > 0) {
      // Full rotation: swap turno 1<->2, and swap area Manufactura<->Envasado
      newAssignments = latest.assignments.map(a => ({
        encargado: a.encargado,
        area: a.area === 'Manufactura' ? 'Envasado' : 'Manufactura',
        turno: a.turno === 1 ? 2 : 1
      }));
    } else {
      // Initialize from existing encargados
      const encargados = await User.find({ role: 'ENCARGADO' }).lean();
      newAssignments = encargados.map((u) => ({
        encargado: u._id,
        area: u.area || 'Manufactura',
        turno: u.turno || 1
      }));
    }

    const created = await Assignment.create({ weekStart: nextWeekStart, assignments: newAssignments, createdBy: req.user._id });
    const populated = await Assignment.findById(created._id).populate('assignments.encargado', 'name email area role turno');
    // Filter out assignments with null or invalid encargados
    populated.assignments = populated.assignments.filter(a => a.encargado);
    res.json(populated);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// simple endpoints to list workers / encargados
exports.getWorkers = async (req, res) => {
  try {
    // If encargado, filter workers by their assigned area and turno
    let filter = { role: 'WORKER' };
    if (req.user.role === 'ENCARGADO') {
      // Get current assignment for the encargado
      const today = new Date();
      const ws = getWeekStart(today);
      const assignment = await Assignment.findOne({ weekStart: ws }).lean();
      if (assignment) {
        const encAssign = assignment.assignments.find(a => a.encargado.toString() === req.user._id.toString());
        if (encAssign) {
          filter.area = encAssign.area;
          filter.turno = encAssign.turno;
        }
      }
    }
    const workers = await User.find(filter).select('name email area turno');
    res.json(workers);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.getEncargados = async (req, res) => {
  try {
    const enc = await User.find({ role: 'ENCARGADO' }).select('name email area turno');
    res.json(enc);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};
