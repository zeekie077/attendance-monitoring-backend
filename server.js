const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.8.4']);

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const User = require('./models/User');
const Class = require('./models/Class');
const Attendance = require('./models/Attendance');

const app = express();
app.use(cors());
app.use(express.json());

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://chavezvincent004_db_user:Admin123456@cluster0.kpvkenz.mongodb.net/attendance_db?retryWrites=true&w=majority';

mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 10000,
  family: 4
})
.then(() => console.log('Connected to MongoDB Atlas'))
.catch(err => console.error('MongoDB connection error:', err));

// Helper Endpoint: GET /api/classes (Para madaling makuha ang class _id)
app.get('/api/classes', async (req, res) => {
  try {
    const classes = await Class.find({}).populate('teacher_id', 'first_name last_name');
    res.json(classes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// 1. GET /api/attendance/summary/:classId
app.get('/api/attendance/summary/:classId', async (req, res) => {
  try {
    const { classId } = req.params;

    // Filter para sa ngayong araw
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const summary = await Attendance.aggregate([
      {
        $match: {
          class_id: new mongoose.Types.ObjectId(classId),
          date: { $gte: startOfDay,$lte: endOfDay }
        }
      },
      {
        $group: {
          _id: null,
          total_records: { $sum: 1 },
          present_count: {
            $sum: {$cond: [{ $eq: ['$status', 'Present'] }, 1, 0] }
          },
          absent_count: {
            $sum: {$cond: [{ $eq: ['$status', 'Absent'] }, 1, 0] }
          },
          late_count: {
            $sum: {$cond: [{ $eq: ['$status', 'Late'] }, 1, 0] }
          },
          excused_count: {
            $sum: { $cond: [{$eq: ['$status', 'Excused'] }, 1, 0] } } } }, {$project: {
          _id: 0,
          total_records: 1,
          present_count: 1,
          absent_count: 1,
          late_count: 1,
          excused_count: 1,
          attendance_percentage: {
            $cond: [
              { $gt: ['$total_records', 0] }, {$round: [{ $multiply: [{$divide: ['$present_count', '$total_records'] }, 100] }, 2] },
              0
            ]
          }
        }
      }
    ]);

    const result = summary[0] || {
      total_records: 0,
      present_count: 0,
      absent_count: 0,
      late_count: 0,
      excused_count: 0,
      attendance_percentage: 0
    };

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// 2. GET /api/attendance/class/:classId
app.get('/api/attendance/class/:classId', async (req, res) => {
  try {
    const { classId } = req.params;

    const records = await Attendance.find({ class_id: classId })
      .populate('student_id', 'student_number first_name last_name')
      .sort({ date: -1 });

    const formattedRows = records.map(record => ({
      attendance_id: record._id,
      date: record.date,
      student_number: record.student_id ? record.student_id.student_number : null,
      full_name: record.student_id
        ? `${record.student_id.first_name} ${record.student_id.last_name}`
        : 'Unknown',
      status: record.status,
      remarks: record.remarks
    }));

    res.json(formattedRows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// 3. POST /api/attendance
app.post('/api/attendance', async (req, res) => {
  try {
    const { class_id, student_id, status, date, remarks } = req.body;

    const recordDate = date ? new Date(date) : new Date();

    // Mongoose findOneAndUpdate para sa UPSERT behavior
    const attendance = await Attendance.findOneAndUpdate(
      { class_id, student_id, date: recordDate },
      { status, remarks, date: recordDate },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({ message: 'Attendance recorded successfully', id: attendance._id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});