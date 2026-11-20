import express from 'express';
import {
    getAdminOverview,
    getAllAdminClasses,
    getAdminSchedule,
    createAdminSession,
    updateAdminSession,
    deleteAdminSession,
    scheduleAssessmentSession,
    exportSchedule,
    getAdminCourses,
    createAdminCourse,
    updateAdminCourse,
    launchCourse,
    createAdminSection,
    updateAdminSection,
    getAdminStudents,
    createAdminStudent,
    updateAdminStudent,
    archiveAdminStudent,
    restoreAdminStudent,
    getAdminTeachers,
    createAdminTeacher,
    updateAdminTeacher,
    deactivateAdminTeacher,
    activateAdminTeacher,
    exportDirectory
} from '../controllers/admin.controller.js';
import { authAdmin } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Enforce admin role on all admin routes
router.use(authAdmin);

// 11.1 Overview & Classes
router.get('/overview', getAdminOverview);
router.get('/classes', getAllAdminClasses);

// 11.2 Schedule Management
router.get('/schedule', getAdminSchedule);
router.post('/schedule/sessions', createAdminSession);
router.put('/schedule/sessions/:id', updateAdminSession);
router.delete('/schedule/sessions/:id', deleteAdminSession);
router.post('/schedule/assessments', scheduleAssessmentSession);
router.get('/schedule/export', exportSchedule);

// 11.3 Courses & Sections
router.get('/courses', getAdminCourses);
router.post('/courses', createAdminCourse);
router.put('/courses/:id', updateAdminCourse);
router.post('/courses/:id/launch', launchCourse);
router.post('/sections', createAdminSection);
router.put('/sections/:id', updateAdminSection);

// 11.4 Students Directory
router.get('/students', getAdminStudents);
router.post('/students', createAdminStudent);
router.put('/students/:id', updateAdminStudent);
router.put('/students/:id/archive', archiveAdminStudent);
router.put('/students/:id/restore', restoreAdminStudent);

// 11.4 Teachers Directory
router.get('/teachers', getAdminTeachers);
router.post('/teachers', createAdminTeacher);
router.put('/teachers/:id', updateAdminTeacher);
router.put('/teachers/:id/deactivate', deactivateAdminTeacher);
router.put('/teachers/:id/activate', activateAdminTeacher);

// Directory Export
router.get('/directory/export', exportDirectory);

export default router;
