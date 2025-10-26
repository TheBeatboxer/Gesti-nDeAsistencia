require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

async function run(){
  await mongoose.connect(process.env.MONGO_URI);
  // clear?
  // await User.deleteMany({});
  const users = [
    { name: 'Admin', email: 'admin@example.com', password: 'password123', role: 'ADMIN' },
    { name: 'Encargado Manufactura Dia', email: 'enc1@example.com', password: 'password123', role: 'ENCARGADO', area: 'Manufactura', turno: 1 },
    { name: 'Encargado Manufactura Noche', email: 'enc2@example.com', password: 'password123', role: 'ENCARGADO', area: 'Manufactura', turno: 2 },
    { name: 'Encargado Envasado Dia', email: 'enc3@example.com', password: 'password123', role: 'ENCARGADO', area: 'Envasado', turno: 1 },
    { name: 'Encargado Envasado Noche', email: 'enc4@example.com', password: 'password123', role: 'ENCARGADO', area: 'Envasado', turno: 2 }
  ];

  // Create 10 workers per area per turno
  const areas = ['Manufactura', 'Envasado'];
  const turnos = [1, 2];
  let workerId = 1;
  for (const area of areas) {
    for (const turno of turnos) {
      for (let i = 1; i <= 10; i++) {
        users.push({
          name: `Worker ${workerId}`,
          email: `w${workerId}@example.com`,
          password: 'password123',
          role: 'WORKER',
          area,
          turno
        });
        workerId++;
      }
    }
  }
  for(const u of users){
    const exists = await User.findOne({ email: u.email });
    if(!exists) {
      const user = new User(u);
      await user.save();
      console.log('Created', u.email);
    } else console.log('Exists', u.email);
  }
  mongoose.disconnect();
}
run().catch(e=>{ console.error(e); process.exit(1); });
