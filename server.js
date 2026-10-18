const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/attendance/summary/:classId', async (req, res) => {
    try {
        const { classId } = req.params;
        const [rows] = await db.query(
            `SELECT 
                COUNT(*) AS total_records,
                SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) AS present_count,
                SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) AS absent_count,
                SUM(CASE WHEN status = 'Late' THEN 1 ELSE 0 END) AS late_count,
                SUM(CASE WHEN status = 'Excused' THEN 1 ELSE 0 END) AS excused_count,
                ROUND((SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) AS attendance_percentage
            FROM attendance
            WHERE class_id = ? AND date = CURRENT_DATE`,
            [classId]
        );
        res.json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/attendance/class/:classId', async (req, res) => {
    try {
        const { classId } = req.params;
        const [rows] = await db.query(
            `SELECT 
                a.attendance_id,
                a.date,
                s.student_number,
                CONCAT(s.first_name, ' ', s.last_name) AS full_name,
                a.status,
                a.remarks
            FROM attendance a
            JOIN students s ON a.student_id = s.student_id
            WHERE a.class_id = ?
            ORDER BY a.date DESC`,
            [classId]
        );
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// 3. Post / Mark Attendance Record
app.post('/api/attendance', async (req, res) => {
    try {
        const { class_id, student_id, status, date, remarks } = req.body;
        const [result] = await db.query(
            `INSERT INTO attendance (class_id, student_id, status, date, remarks)
             VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE status = VALUES(status), remarks = VALUES(remarks)`,
            [class_id, student_id, status, date || new Date().toISOString().split('T')[0], remarks]
        );
        res.json({ message: 'Attendance recorded successfully', id: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});