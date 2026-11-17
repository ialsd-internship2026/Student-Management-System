import express from 'express';
import {
    getAllUsers,
    getUserById,
    updateUser,
    changePassword,
    deleteUser
} from '../controllers/user.controller.js';
import { authUser, authAdmin } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', authUser, getAllUsers);
router.get('/:id', authUser, getUserById);
router.put('/:id', authUser, updateUser);
router.put('/:id/change-password', authUser, changePassword);
router.delete('/:id', authAdmin, deleteUser);

export default router;
