const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  role: { type: String, enum: ['Admin', 'Teacher', 'Student'], required: true },
  student_number: { type: String },
  first_name: { type: String },
  last_name: { type: String },
  course: { type: String },
  section: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);