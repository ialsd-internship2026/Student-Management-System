import express from 'express';
import {
    getAllTeachers,
    getTeacherById,
    createTeacher,
    updateTeacher,
    deleteTeacher
} from '../controllers/teacher.controller.js';
import { authUser, authAdmin } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', authUser, getAllTeachers);
router.get('/:id', authUser, getTeacherById);
router.post('/', authAdmin, createTeacher);
router.put('/:id', authAdmin, updateTeacher);
router.delete('/:id', authAdmin, deleteTeacher);

export default router;
