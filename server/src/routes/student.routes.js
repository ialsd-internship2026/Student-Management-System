import express from 'express';
import {
    getStudentOverview,
    getStudentAttendance,
    getStudentSchedule,
    getStudentCourses,
    getStudentCourseDetail,
    getStudentResults,
    getStudentAnnouncements,
    getStudentResources,
    exportStudentReport
} from '../controllers/student.controller.js';
import { authStudent } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Enforce student role and implicit JWT student scoping on all student routes
router.use(authStudent);

// Student Overview / Dashboard
router.get('/overview', getStudentOverview);

// Attendance & Schedule
router.get('/attendance', getStudentAttendance);
router.get('/schedule', getStudentSchedule);

// Courses & Content
router.get('/courses', getStudentCourses);
router.get('/courses/:id', getStudentCourseDetail);

// Learning & Results
router.get('/results', getStudentResults);

// Announcements & Resources
router.get('/announcements', getStudentAnnouncements);
router.get('/resources', getStudentResources);

// Report Export
router.get('/report/export', exportStudentReport);

export default router;
