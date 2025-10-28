const mongoose = require('mongoose');
const Assignment = require('../models/Assignment');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
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
    console.log('Buscando asignaciones para usuario:', req.user.role);

    // 2. Verificar la conexión a la base de datos
    if (mongoose.connection.readyState !== 1) {
      console.error('MongoDB no está conectado');
      return res.status(500).json({ msg: 'Database connection not ready' });
    }

    // 3. Buscar asignaciones según el rol
    let filter = { finalized: false };

    if (req.user.role === 'ADMIN') {
      // Para admin, mostrar asignaciones activas actuales
      filter.startDate = { $lte: today };
      filter.endDate = { $gte: today };
    } else if (req.user.role === 'ENCARGADO') {
      // Para encargados, mostrar todas sus asignaciones no finalizadas
      filter.assignments = { $elemMatch: { encargado: req.user._id } };
    }

    const assignments = await Assignment.find(filter)
      .populate({
        path: 'assignments.encargado',
        select: 'name email area role turno',
        model: 'User'
      })
      .sort({ startDate: -1 }); // Más recientes primero

    console.log(`Encontradas ${assignments.length} asignaciones`);

    // 4. Filtrar y validar asignaciones dentro de cada documento
    const validAssignments = assignments.map(assignment => {
      const validAssigns = assignment.assignments.filter(a => {
        const isValid = a && a.encargado && a.area && a.turno;
        if (!isValid) {
          console.log('Asignación inválida encontrada:', a);
        }
        return isValid;
      });

      return {
        ...assignment.toObject(),
        assignments: validAssigns
      };
    }).filter(assignment => assignment.assignments.length > 0);

    console.log(`Asignaciones válidas encontradas: ${validAssignments.length}`);

    if (validAssignments.length === 0) {
      return res.status(404).json({ msg: 'No assignments found' });
    }

    // 5. Siempre devolver array para consistencia
    res.json(validAssignments);

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

    // Find the assignment first to get its details
    const assignment = await Assignment.findById(id);
    if (!assignment) return res.status(404).json({ msg: 'Assignment not found' });

    // Delete related attendance records
    // Get all area/turno combinations from the assignment
    const areaTurnoCombos = assignment.assignments.map(a => ({ area: a.area, turno: a.turno }));

    // Delete attendance records within the assignment date range that match area/turno
    const attendanceDeleteResult = await Attendance.deleteMany({
      date: { $gte: assignment.startDate, $lte: assignment.endDate },
      $or: areaTurnoCombos
    });

    // Now delete the assignment
    const deletedAssignment = await Assignment.findByIdAndDelete(id).populate('assignments.encargado', 'name email area turno');

    res.json({
      msg: 'Assignment and related attendance records deleted',
      deleted: deletedAssignment,
      attendanceDeletedCount: attendanceDeleteResult.deletedCount
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};
