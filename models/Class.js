const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  teacher_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject_code: { type: String, required: true },
  subject_name: { type: String, required: true },
  section: { type: String, required: true },
  schedule: { type: String, required: true },
  enrolled_students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

module.exports = mongoose.model('Class', classSchema);