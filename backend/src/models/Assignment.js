const mongoose = require('mongoose');

const AssignmentSchema = new mongoose.Schema({
  startDate: { type: Date, required: true }, // ISO date for start (user-selected)
  endDate: { type: Date, required: true }, // required end date for the assignment range
  assignments: [{
    encargado: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    area: { type: String, enum: ['Manufactura','Envasado'], required: true },
    turno: { type: Number, enum: [1,2], required: true } // 1=Dia, 2=Noche
  }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

AssignmentSchema.index({ startDate: 1 }, { unique: true });

module.exports = mongoose.model('Assignment', AssignmentSchema);
