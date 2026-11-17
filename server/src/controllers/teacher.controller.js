import userModel from '../models/user.model.js';
import studentModel from '../models/student.model.js';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { respondWithError, getPagination, escapeRegex } from '../utils/api.utils.js';

/**
 * Get all teachers
 * Route: GET /api/teachers
 */
export const getAllTeachers = async (req, res) => {
    try {
        const { page, limit, skip } = getPagination(req);
        const { search, subject } = req.query;

        const filter = { role: 'teacher' };

        if (subject && subject.trim()) {
            filter.subjects = { $in: [new RegExp(escapeRegex(subject.trim()), 'i')] };
        }

        if (search && search.trim()) {
            const regex = new RegExp(escapeRegex(search.trim()), 'i');
            filter.$or = [
                { name: regex },
                { userName: regex },
                { email: regex },
                { subjects: { $in: [regex] } }
            ];
        }

        const [teachers, total] = await Promise.all([
            userModel.find(filter)
                .select('-passWord')
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 }),
            userModel.countDocuments(filter)
        ]);

        return res.status(200).json({
            message: "Teachers fetched successfully",
            data: teachers,
            pagination: {
                totalTeachers: total,
                totalPages: Math.ceil(total / limit),
                currentPage: page,
                limit
            }
        });

    } catch (error) {
        console.error('[Teacher Controller] getAllTeachers Error:', error);
        return respondWithError(res, error);
    }
};

/**
 * Get single teacher by ID
 * Route: GET /api/teachers/:id
 */
export const getTeacherById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid teacher ID." });
        }

        const teacher = await userModel.findOne({ _id: id, role: 'teacher' }).select('-passWord');

        if (!teacher) {
            return res.status(404).json({ message: "Teacher not found." });
        }

        return res.status(200).json({
            message: "Teacher fetched successfully",
            teacher
        });

    } catch (error) {
        console.error('[Teacher Controller] getTeacherById Error:', error);
        return respondWithError(res, error);
    }
};

/**
 * Create / Register a new teacher
 * Route: POST /api/teachers
 */
export const createTeacher = async (req, res) => {
    try {
        const { name, userName, email, passWord, password, subjects, assignedClassIds } = req.body;
        const finalPassword = passWord || password;

        if (!email || !finalPassword) {
            return res.status(400).json({ message: "Email and password are required." });
        }

        const existingUser = await userModel.findOne({
            $or: [
                { email: email.toLowerCase().trim() },
                ...(userName ? [{ userName: userName.trim() }] : [])
            ]
        });

        if (existingUser) {
            return res.status(409).json({ message: "Email or username is already in use." });
        }

        const hashedPassword = await bcrypt.hash(finalPassword, 10);

        const newTeacher = await userModel.create({
            name: name ? name.trim() : (userName || email.split('@')[0]),
            userName: userName ? userName.trim() : email.split('@')[0],
            email: email.toLowerCase().trim(),
            passWord: hashedPassword,
            role: 'teacher',
            subjects: subjects || [],
            assignedClassIds: assignedClassIds || []
        });

        const teacherResponse = {
            _id: newTeacher._id,
            name: newTeacher.name,
            userName: newTeacher.userName,
            email: newTeacher.email,
            role: newTeacher.role,
            subjects: newTeacher.subjects,
            assignedClassIds: newTeacher.assignedClassIds
        };

        return res.status(201).json({
            message: "Teacher created successfully",
            teacher: teacherResponse
        });

    } catch (error) {
        console.error('[Teacher Controller] createTeacher Error:', error);
        return respondWithError(res, error);
    }
};

/**
 * Update teacher details
 * Route: PUT /api/teachers/:id
 */
export const updateTeacher = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, subjects, assignedClassIds } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid teacher ID." });
        }

        const teacher = await userModel.findOne({ _id: id, role: 'teacher' });
        if (!teacher) {
            return res.status(404).json({ message: "Teacher not found." });
        }

        if (email && email.toLowerCase() !== teacher.email) {
            const conflict = await userModel.findOne({ email: email.toLowerCase().trim(), _id: { $ne: id } });
            if (conflict) {
                return res.status(409).json({ message: "Email already taken by another account." });
            }
            teacher.email = email.toLowerCase().trim();
        }

        if (name) teacher.name = name.trim();
        if (subjects) teacher.subjects = subjects;
        if (assignedClassIds) teacher.assignedClassIds = assignedClassIds;

        await teacher.save();

        const updated = await userModel.findById(id).select('-passWord');

        return res.status(200).json({
            message: "Teacher profile updated successfully",
            teacher: updated
        });

    } catch (error) {
        console.error('[Teacher Controller] updateTeacher Error:', error);
        return respondWithError(res, error);
    }
};

/**
 * Delete a teacher account
 * Route: DELETE /api/teachers/:id
 */
export const deleteTeacher = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid teacher ID." });
        }

        const teacher = await userModel.findOneAndDelete({ _id: id, role: 'teacher' });
        if (!teacher) {
            return res.status(404).json({ message: "Teacher not found." });
        }

        return res.status(200).json({
            message: "Teacher deleted successfully",
            deletedId: id
        });

    } catch (error) {
        console.error('[Teacher Controller] deleteTeacher Error:', error);
        return respondWithError(res, error);
    }
};

export default {
    getAllTeachers,
    getTeacherById,
    createTeacher,
    updateTeacher,
    deleteTeacher
};
