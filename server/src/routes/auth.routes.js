import express from 'express';
import { register, login, logout, getMe } from '../controllers/auth.controller.js';
import { validationRules } from '../middlewares/validate.middleware.js';
import { authUser } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/register', validationRules, register);
router.post('/login', login);
router.post('/loginuser', login); // backward compatibility
router.post('/logout', logout);
router.get('/me', authUser, getMe);

export default router;
