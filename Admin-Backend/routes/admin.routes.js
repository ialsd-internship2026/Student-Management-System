const express = require('express');
const router = express.Router();

const {
    getAdminProfile,
    updateAdminProfile,
    changeAdminPassword,
    uploadAdminProfileImage
} = require('../controllers/admin.controller');

const { authAdmin } = require('../middlewares/auth.middleware');
const { uploadAdminImage } = require('../middlewares/upload.middleware');

// Admin Profile
router.get('/profile', authAdmin, getAdminProfile);

// Update Admin Profile
router.put('/profile', authAdmin, updateAdminProfile);

// Change Password
router.put('/change-password', authAdmin, changeAdminPassword);

// Upload Profile Image
router.post(
    '/upload-image',
    authAdmin,
    uploadAdminImage.single('profileImage'),
    uploadAdminProfileImage
);

module.exports = router;