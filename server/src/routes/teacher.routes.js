import express from 'express';
import {
    getAssignedClasses,
    getOverview,
    getAttendance,
    saveAttendance,
    submitAttendance,
    getStudents,
    getStudentDetail,
    getStudentResults,
    addFeedback,
    exportClassReport
} from '../controllers/teacher.controller.js';
import { authTeacher, verifyClassOwnership } from '../middlewares/auth.middleware.js';

const router = express.Router();

// All routes require teacher authentication
router.use(authTeacher);

// Classes assigned to this teacher
router.get('/classes', getAssignedClasses);

// Class export
router.get('/classes/:id/export', verifyClassOwnership, exportClassReport);

// Overview / dashboard data
router.get('/overview', verifyClassOwnership, getOverview);

// Attendance routes
router.get('/attendance', verifyClassOwnership, getAttendance);
router.post('/attendance', verifyClassOwnership, saveAttendance);
router.put('/attendance/:id/submit', verifyClassOwnership, submitAttendance);

// Students & results routes
router.get('/students', verifyClassOwnership, getStudents);
router.get('/students/:id', verifyClassOwnership, getStudentDetail);
router.get('/students/:id/results', verifyClassOwnership, getStudentResults);
router.post('/students/:id/feedback', verifyClassOwnership, addFeedback);

export default router;
