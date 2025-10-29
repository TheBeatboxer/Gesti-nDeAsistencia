const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['ADMIN','ENCARGADO','WORKER'], default: 'WORKER' },
  area: { type: String, enum: ['Manufactura','Envasado','Soporte'], default: 'Manufactura' },
  linea: { type: String },
  puesto: { type: String },
  codigo: { type: String },
  turno: { type: String, enum: ['dia','noche'], default: 'dia' },
  createdAt: { type: Date, default: Date.now }
});

UserSchema.pre('save', async function(next){
  if(!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.comparePassword = function(password){
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', UserSchema);
