import express from 'express';
import {
    createStudent,
    getAllStudents,
    getStudentById,
    updateStudent,
    deleteStudent,
    getStudentStats,
    getStudentProfile,
    bulkCreateStudents
} from '../controllers/student.controller.js';
import { authUser, optionalAuth } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Specific routes before param routes
router.get('/stats', optionalAuth, getStudentStats);
router.get('/me/profile', authUser, getStudentProfile);
router.post('/bulk', optionalAuth, bulkCreateStudents);

// Root collection routes
router.route('/')
    .get(optionalAuth, getAllStudents)
    .post(optionalAuth, createStudent);

// Individual student routes
router.route('/:id')
    .get(optionalAuth, getStudentById)
    .put(optionalAuth, updateStudent)
    .delete(optionalAuth, deleteStudent);

export default router;
