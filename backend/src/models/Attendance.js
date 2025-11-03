const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  worker: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // encargado who marked
  area: { type: String, enum: ['Area 1','Area 2'] },
  turno: { type: String, enum: ['dia','noche'] },
  status: { type: String, enum: ['P','T','F'], required: true },
  observation: { type: String },
  finalized: { type: Boolean, default: false }, // new field to mark if attendance for this date is finalized
  createdAt: { type: Date, default: Date.now }
});

AttendanceSchema.index({ date: 1, worker: 1 }, { unique: true }); // only one record per day per worker

module.exports = mongoose.model('Attendance', AttendanceSchema);
