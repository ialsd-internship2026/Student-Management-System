import express from 'express';
import multer from 'multer';
import {
    uploadImage,
    getAuthParams,
    getLandingSettings,
    updateLandingSettings
} from '../controllers/upload.controller.js';
import { authUser } from '../middlewares/auth.middleware.js';

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10 MB maximum
});

const router = express.Router();

// Public / Authenticated image upload endpoints
router.post('/image', upload.single('image'), uploadImage);
router.post('/file', upload.single('file'), uploadImage);
router.post('/base64', uploadImage);
router.get('/auth', getAuthParams);

// Landing page & Branding settings endpoints
router.get('/landing', getLandingSettings);
router.put('/landing', authUser, updateLandingSettings);

export default router;
