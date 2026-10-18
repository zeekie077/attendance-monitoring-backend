const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.8.4']);

const mongoose = require('mongoose');
const User = require('./models/User');
const Class = require('./models/Class');
const Attendance = require('./models/Attendance');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://chavezvincent004_db_user:Admin123456@cluster0.kpvkenz.mongodb.net/attendance_db?retryWrites=true&w=majority';

async function seedDB() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      family: 4
    });
    console.log('Connected successfully!');

    await User.deleteMany({});
    await Class.deleteMany({});
    await Attendance.deleteMany({});

    const teacher = await User.create({
      username: 'prof_smith',
      password_hash: 'hashed_pass_2',
      role: 'Teacher',
      first_name: 'John',
      last_name: 'Smith'
    });

    const student1 = await User.create({
      username: 'juan_delacruz',
      password_hash: 'hashed_pass_3',
      role: 'Student',
      student_number: '2023-10001',
      first_name: 'Juan',
      last_name: 'Dela Cruz',
      course: 'BSIT',
      section: '3A'
    });

    const student2 = await User.create({
      username: 'maria_santos',
      password_hash: 'hashed_pass_4',
      role: 'Student',
      student_number: '2023-10002',
      first_name: 'Maria',
      last_name: 'Santos',
      course: 'BSIT',
      section: '3A'
    });

    const myClass = await Class.create({
      teacher_id: teacher._id,
      subject_code: 'IT301',
      subject_name: 'Web Application Development',
      section: '3A',
      schedule: 'MWF 10:00 AM - 12:00 PM',
      enrolled_students: [student1._id, student2._id]
    });

    await Attendance.create([
      { class_id: myClass._id, student_id: student1._id, status: 'Present', remarks: 'On time' },
      { class_id: myClass._id, student_id: student2._id, status: 'Late', remarks: 'Traffic' }
    ]);

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding database:', err);
    process.exit(1);
  }
}

seedDB();