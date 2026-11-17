const userModel = require('../models/user.model');
const bcrypt = require('bcryptjs');

// 1. Get Admin Profile
const getAdminProfile = async (req, res) => {
    try {
        const admin = await userModel.findOne({
            _id: req.user.id,
            role: 'admin'
        }).select('-passWord');

        if (!admin) {
            return res.status(404).json({
                message: 'Admin not found'
            });
        }

        res.status(200).json({
            message: 'Admin profile fetched successfully',
            admin
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 2. Update Admin Profile
const updateAdminProfile = async (req, res) => {
    try {
        const { name, userName, email, about, profileImage } = req.body;

        const admin = await userModel.findOne({
            _id: req.user.id,
            role: 'admin'
        });

        if (!admin) {
            return res.status(404).json({
                message: 'Admin not found'
            });
        }

        if (name !== undefined) admin.name = name;
        if (about !== undefined) admin.about = about;
        if (profileImage !== undefined) admin.profileImage = profileImage;

        if (userName !== undefined) admin.userName = userName;
        if (email !== undefined) admin.email = email;

        await admin.save();

        res.status(200).json({
            message: 'Profile updated successfully',
            admin: {
                _id: admin._id,
                name: admin.name,
                userName: admin.userName,
                email: admin.email,
                about: admin.about,
                role: admin.role
            }
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 3. Change Admin Password
const changeAdminPassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                message: 'Both passwords are required'
            });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({
                message: 'New password must contain at least 8 characters'
            });
        }

        const admin = await userModel.findOne({
            _id: req.user.id,
            role: 'admin'
        });

        if (!admin) {
            return res.status(404).json({
                message: 'Admin not found'
            });
        }

        const isMatch = await bcrypt.compare(
            currentPassword,
            admin.passWord
        );

        if (!isMatch) {
            return res.status(400).json({
                message: 'Current password is incorrect'
            });
        }

        admin.passWord = await bcrypt.hash(newPassword, 10);
        await admin.save();

        res.status(200).json({
            message: 'Password changed successfully'
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 4. Upload Admin Profile Image
const uploadAdminProfileImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Please select an image' });
        }

        const admin = await userModel.findOne({
            _id: req.user.id,
            role: 'admin'
        });

        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        admin.profileImage = `/uploads/admin/${req.file.filename}`;
        await admin.save();

        res.status(200).json({
            message: 'Profile image uploaded successfully',
            profileImage: admin.profileImage
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getAdminProfile,
    updateAdminProfile,
    changeAdminPassword,
    uploadAdminProfileImage
};
