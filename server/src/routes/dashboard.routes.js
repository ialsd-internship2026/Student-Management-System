import express from 'express';
import { getDashboardStats } from '../controllers/dashboard.controller.js';
import { authUser } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/stats', authUser, getDashboardStats);

export default router;
