const mongoose = require('mongoose');

const AssignmentSchema = new mongoose.Schema({
  startDate: { type: Date, required: true }, // ISO date for start (user-selected)
  endDate: { type: Date, required: true }, // required end date for the assignment range
  assignments: [{
    encargado: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    area: { type: String, enum: ['Area 1','Area 2'], required: true },
    turno: { type: String, enum: ['dia','noche'], required: true } // 'dia'=Dia, 'noche'=Noche
  }],
  finalized: { type: Boolean, default: false }, // new field to mark if the entire period is finalized
  finalizedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // encargado who finalized
  finalizedAt: { type: Date }, // when it was finalized
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

AssignmentSchema.index({ startDate: 1 }, { unique: true });

module.exports = mongoose.model('Assignment', AssignmentSchema);
