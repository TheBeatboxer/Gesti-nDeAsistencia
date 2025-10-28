const mongoose = require('mongoose');
const Assignment = require('../models/Assignment');
const User = require('../models/User');
const moment = require('moment-timezone');

// Asegurarse de que el modelo User esté registrado
if (!mongoose.models.User) {
    mongoose.model('User', User.schema);
}

// Helper: normalize date to 00:00:00 in America/Lima timezone
function normalizeDate(date) {
  // Asegurar que estamos usando la zona horaria de Lima
  const limaTZ = 'America/Lima';
  
  // Si es string, parsearlo
  if (typeof date === 'string') {
    return moment.tz(date, limaTZ).startOf('day').toDate();
  }
  
  // Si es Date, convertirlo a la zona horaria de Lima
  return moment(date).tz(limaTZ).startOf('day').toDate();
}
exports.createOrUpdateAssignment = async (req, res) => {
  try {
    const { startDate, endDate, assignments } = req.body;
    if (!startDate || !endDate || !Array.isArray(assignments)) {
      return res.status(400).json({ msg: 'startDate, endDate and assignments required' });
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
    // Normalize dates
    const sd = normalizeDate(startDate);
    const ed = normalizeDate(endDate);
    ed.setHours(23,59,59,999);

    const doc = await Assignment.findOneAndUpdate(
      { startDate: sd },
      { startDate: sd, endDate: ed, assignments, createdBy: req.user._id },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).populate('assignments.encargado', 'name email area role turno');
    // Filter out assignments with null or invalid encargados
    doc.assignments = doc.assignments.filter(a => a.encargado);
    res.json(doc);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.getAssignmentForDate = async (req, res) => {
  try {
    const date = normalizeDate(new Date(req.params.date));
    const doc = await Assignment.findOne({
      startDate: { $lte: date },
      endDate: { $gte: date }
    }).populate('assignments.encargado', 'name email area role turno');
    if (!doc) return res.status(404).json({ msg: 'No assignment for date' });
    // Filter out assignments with null or invalid encargados
    doc.assignments = doc.assignments.filter(a => a.encargado);
    res.json(doc);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.getCurrentAssignment = async (req, res) => {
  try {
    // 1. Normalizar la fecha actual
    const today = normalizeDate(new Date());
    console.log('Buscando asignación para fecha:', today);
    
    // 2. Verificar la conexión a la base de datos
    if (mongoose.connection.readyState !== 1) {
      console.error('MongoDB no está conectado');
      return res.status(500).json({ msg: 'Database connection not ready' });
    }

    // 3. Buscar la asignación actual
    console.log('Criterios de búsqueda:', {
      startDate: { $lte: today },
      endDate: { $gte: today }
    });

    const doc = await Assignment.findOne({
      startDate: { $lte: today },
      endDate: { $gte: today }
    }).populate({
      path: 'assignments.encargado',
      select: 'name email area role turno',
      model: 'User'
    });

    // 4. Manejar caso de no encontrar asignación
    if (!doc) {
      console.log('No se encontró asignación actual');
      return res.status(404).json({ msg: 'No current assignment' });
    }

    console.log('Asignación encontrada:', {
      _id: doc._id,
      startDate: doc.startDate,
      endDate: doc.endDate,
      assignmentsCount: doc.assignments.length
    });

    // 5. Filtrar y validar asignaciones
    const validAssignments = doc.assignments.filter(a => {
      const isValid = a && a.encargado && a.area && a.turno;
      if (!isValid) {
        console.log('Asignación inválida encontrada:', a);
      }
      return isValid;
    });

    console.log('Asignaciones válidas encontradas:', validAssignments.length);

    if (validAssignments.length === 0) {
      return res.status(404).json({ msg: 'No valid assignments found' });
    }

    // 6. Devolver resultado
    doc.assignments = validAssignments;
    res.json(doc);

  } catch (err) {
    console.error('Error en getCurrentAssignment:', err);
    res.status(500).json({
      msg: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// simple endpoints to list workers / encargados
exports.getWorkers = async (req, res) => {
  try {
    // If encargado, filter workers by their assigned area and turno
    let filter = { role: 'WORKER' };
    if (req.user.role === 'ENCARGADO') {
      // Get current assignment for the encargado
      const today = normalizeDate(new Date());
      const assignment = await Assignment.findOne({
        startDate: { $lte: today },
        endDate: { $gte: today }
      }).lean();
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

// List all assignments (history), newest first, with populated encargado info
exports.getAllAssignments = async (req, res) => {
  try {
    const docs = await Assignment.find({}).sort({ startDate: -1 }).populate('assignments.encargado', 'name email area turno');
    // For safety, filter null encargados inside each doc
    const sanitized = docs.map(d => {
      const doc = d.toObject ? d.toObject() : d;
      doc.assignments = (doc.assignments || []).filter(a => a.encargado);
      return doc;
    });
    res.json(sanitized);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Finalize current period for encargado
exports.finalizePeriod = async (req, res) => {
  try {
    // Get current assignment
    const today = normalizeDate(new Date());
    const assignment = await Assignment.findOne({
      startDate: { $lte: today },
      endDate: { $gte: today }
    });

    if (!assignment) {
      return res.status(404).json({ msg: 'No current assignment found' });
    }

    // Check if user is assigned as encargado in this assignment
    const encAssign = assignment.assignments.find(a => a.encargado.toString() === req.user._id.toString());
    if (!encAssign && req.user.role !== 'ADMIN') {
      return res.status(403).json({ msg: 'You are not assigned for this period' });
    }

    // Check if all days in the period are finalized for this encargado's area and turno
    const Attendance = require('../models/Attendance');
    const startDate = assignment.startDate;
    const endDate = assignment.endDate;

    // Get all dates in the period
    const dates = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d));
    }

    // Check attendance for each date
    for (const date of dates) {
      const normalizedDate = normalizeDate(date);
      const attendances = await Attendance.find({
        date: normalizedDate,
        area: encAssign.area,
        turno: encAssign.turno,
        finalized: true
      });

      const workers = await User.find({ role: 'WORKER', area: encAssign.area, turno: encAssign.turno });
      if (attendances.length < workers.length) {
        return res.status(400).json({ msg: `Not all days are finalized. Missing attendance for ${new Date(date).toLocaleDateString()}` });
      }
    }

    // Mark assignment as finalized
    assignment.finalized = true;
    assignment.finalizedBy = req.user._id;
    assignment.finalizedAt = new Date();
    await assignment.save();

    res.json({ msg: 'Period finalized successfully', assignment });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Get finalized periods for encargado
exports.getFinalizedPeriods = async (req, res) => {
  try {
    const assignments = await Assignment.find({
      finalized: true,
      assignments: { $elemMatch: { encargado: req.user._id } }
    }).sort({ finalizedAt: -1 }).populate('assignments.encargado', 'name email area turno').populate('finalizedBy', 'name');

    res.json(assignments);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Delete an assignment by id
exports.deleteAssignment = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ msg: 'Assignment id required' });
    const doc = await Assignment.findByIdAndDelete(id).populate('assignments.encargado', 'name email area turno');
    if (!doc) return res.status(404).json({ msg: 'Assignment not found' });
    res.json({ msg: 'Assignment deleted', deleted: doc });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};
