import userModel from '../models/user.model.js';
import studentModel from '../models/student.model.js';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { respondWithError, getPagination, escapeRegex } from '../utils/api.utils.js';

/**
 * Get all users with search, role filter, and pagination
 * Route: GET /api/users
 */
export const getAllUsers = async (req, res) => {
    try {
        const { page, limit, skip } = getPagination(req);
        const { search, role, sortBy = 'createdAt', order = 'desc' } = req.query;

        const filter = {};

        if (role) {
            filter.role = role.toLowerCase();
        }

        if (search && search.trim()) {
            const escaped = escapeRegex(search.trim());
            const regex = new RegExp(escaped, 'i');
            filter.$or = [
                { name: regex },
                { userName: regex },
                { email: regex }
            ];
        }

        const sortDirection = order === 'asc' || order === '1' ? 1 : -1;

        const [users, total] = await Promise.all([
            userModel.find(filter)
                .select('-passWord')
                .populate('studentId', 'rollNumber class section status')
                .sort({ [sortBy]: sortDirection })
                .skip(skip)
                .limit(limit),
            userModel.countDocuments(filter)
        ]);

        return res.status(200).json({
            message: "Users fetched successfully",
            data: users,
            pagination: {
                totalUsers: total,
                totalPages: Math.ceil(total / limit),
                currentPage: page,
                limit
            }
        });

    } catch (error) {
        console.error('[User Controller] getAllUsers Error:', error);
        return respondWithError(res, error);
    }
};

/**
 * Get single user by ID
 * Route: GET /api/users/:id
 */
export const getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid user ID format." });
        }

        const user = await userModel.findById(id)
            .select('-passWord')
            .populate('studentId');

        if (!user) {
            return res.status(404).json({ message: `User with ID '${id}' not found.` });
        }

        return res.status(200).json({
            message: "User fetched successfully",
            user
        });

    } catch (error) {
        console.error('[User Controller] getUserById Error:', error);
        return respondWithError(res, error);
    }
};

/**
 * Update user details
 * Route: PUT /api/users/:id
 */
export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, userName, email, role, subjects, assignedClassIds } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid user ID format." });
        }

        const user = await userModel.findById(id);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        // Check unique constraints for email and username
        if (email && email.toLowerCase() !== user.email) {
            const emailExists = await userModel.findOne({ email: email.toLowerCase().trim(), _id: { $ne: id } });
            if (emailExists) {
                return res.status(409).json({ message: "Email is already taken by another user." });
            }
            user.email = email.toLowerCase().trim();
        }

        if (userName && userName !== user.userName) {
            const userNameExists = await userModel.findOne({ userName: userName.trim(), _id: { $ne: id } });
            if (userNameExists) {
                return res.status(409).json({ message: "Username is already taken." });
            }
            user.userName = userName.trim();
        }

        if (name) user.name = name.trim();
        if (role) user.role = role;
        if (subjects) user.subjects = subjects;
        if (assignedClassIds) user.assignedClassIds = assignedClassIds;

        await user.save();

        // If user is linked to a student profile, sync name and email
        if (user.studentId && (name || email)) {
            const studentSync = {};
            if (name) studentSync.name = name.trim();
            if (email) studentSync.email = email.toLowerCase().trim();
            await studentModel.findByIdAndUpdate(user.studentId, studentSync);
        }

        const updatedUser = await userModel.findById(id)
            .select('-passWord')
            .populate('studentId', 'rollNumber class section status');

        return res.status(200).json({
            message: "User updated successfully",
            user: updatedUser
        });

    } catch (error) {
        console.error('[User Controller] updateUser Error:', error);
        return respondWithError(res, error);
    }
};

/**
 * Change user password
 * Route: PUT /api/users/:id/change-password
 */
export const changePassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { currentPassword, newPassword } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid user ID." });
        }

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ message: "New password must be at least 6 characters long." });
        }

        const user = await userModel.findById(id);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        // If current password provided, verify it (unless admin override)
        const isSelf = req.user && (req.user.id === id || req.user._id === id);
        const isAdmin = req.user && req.user.role === 'admin';

        if (isSelf && !isAdmin) {
            if (!currentPassword) {
                return res.status(400).json({ message: "Current password is required." });
            }
            const isMatch = await bcrypt.compare(currentPassword, user.passWord);
            if (!isMatch) {
                return res.status(401).json({ message: "Incorrect current password." });
            }
        }

        const salt = await bcrypt.genSalt(10);
        user.passWord = await bcrypt.hash(newPassword, salt);
        await user.save();

        return res.status(200).json({ message: "Password updated successfully." });

    } catch (error) {
        console.error('[User Controller] changePassword Error:', error);
        return respondWithError(res, error);
    }
};

/**
 * Delete user by ID
 * Route: DELETE /api/users/:id
 */
export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid user ID." });
        }

        const user = await userModel.findById(id);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        // Unlink associated student if exists
        if (user.studentId) {
            await studentModel.findByIdAndUpdate(user.studentId, { $unset: { userId: "" } });
        }

        await userModel.findByIdAndDelete(id);

        return res.status(200).json({
            message: "User deleted successfully",
            deletedId: id
        });

    } catch (error) {
        console.error('[User Controller] deleteUser Error:', error);
        return respondWithError(res, error);
    }
};

export default {
    getAllUsers,
    getUserById,
    updateUser,
    changePassword,
    deleteUser
};
