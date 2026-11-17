import express from 'express';
import {
    getAllClasses,
    getStudentsByClass,
    promoteClass,
    assignTeacher
} from '../controllers/class.controller.js';
import { authUser, authAdmin } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', authUser, getAllClasses);
router.get('/:className/students', authUser, getStudentsByClass);
router.post('/promote', authAdmin, promoteClass);
router.post('/assign-teacher', authAdmin, assignTeacher);

export default router;
