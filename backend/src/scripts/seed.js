require('dotenv').config();
const mongoose = require('mongoose');
const moment = require('moment-timezone');
const User = require('../models/User');
const Assignment = require('../models/Assignment');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Assignment.deleteMany({});
    console.log('Cleared existing data');

    // Create admin
    const admin = new User({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'admin123',
      role: 'ADMIN',
      area: 'Area 1',
      turno: 'dia'
    });
    await admin.save();
    console.log('Admin created');

    // Create encargados
    const encargados = [
      { name: 'Encargado Area 1 Día', email: 'enc1@example.com', password: 'enc123', role: 'ENCARGADO', area: 'Area 1', turno: 'dia' },
      { name: 'Encargado Area 1 Noche', email: 'enc2@example.com', password: 'enc123', role: 'ENCARGADO', area: 'Area 1', turno: 'noche' },
      { name: 'Encargado Area 2 Día', email: 'enc3@example.com', password: 'enc123', role: 'ENCARGADO', area: 'Area 2', turno: 'dia' },
      { name: 'Encargado Area 2 Noche', email: 'enc4@example.com', password: 'enc123', role: 'ENCARGADO', area: 'Area 2', turno: 'noche' }
    ];

    const createdEncargados = [];
    for (const enc of encargados) {
      const user = new User(enc);
      await user.save();
      createdEncargados.push(user);
    }
    console.log('Encargados created');

    // Create workers: 10 per area per turno (40 total)
    const workers = [];
    let workerCounter = 1;
    for (let areaIdx = 0; areaIdx < 2; areaIdx++) {
      const area = areaIdx === 0 ? 'Area 1' : 'Area 2';
      for (let turnoIdx = 0; turnoIdx < 2; turnoIdx++) {
        const turno = turnoIdx === 0 ? 'dia' : 'noche';
        for (let i = 1; i <= 10; i++) {
          const worker = new User({
            name: `Trabajador ${area} Turno ${turno} #${i}`,
            email: `worker${workerCounter}@example.com`,
            password: 'worker123',
            role: 'WORKER',
            area,
            turno
          });
          await worker.save();
          workers.push(worker);
          workerCounter++;
        }
      }
    }
    console.log('Workers created');

    // Helper: normalize date to 00:00:00 in America/Lima timezone
    function normalizeDate(date) {
      const limaTZ = 'America/Lima';
      if (typeof date === 'string') {
        return moment.tz(date, limaTZ).startOf('day').toDate();
      }
      return moment(date).tz(limaTZ).startOf('day').toDate();
    }

    // Create a current week assignment
    const today = normalizeDate(new Date());
    const startDate = new Date(today);
    const day = startDate.getDay(); // 0 (Sun) - 6 (Sat)
    const diff = (day === 0 ? -6 : 1) - day;
    startDate.setDate(startDate.getDate() + diff);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);

    const assignment = new Assignment({
      startDate,
      endDate,
      assignments: createdEncargados.map(enc => ({
        encargado: enc._id,
        area: enc.area,
        turno: enc.turno
      })),
      createdBy: admin._id
    });
    await assignment.save();
    console.log('Assignment created');

    console.log('Seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seed();
