import userModel from '../models/user.model.js';
import teacherModel from '../models/teacher.model.js';
import adminModel from '../models/admin.model.js';
import studentModel from '../models/student.model.js';
import classGroupModel from '../models/classGroup.model.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import 'dotenv/config';

const isSecure = process.env.NODE_ENV === 'production' && process.env.COOKIE_SECURE === 'true';

export const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: isSecure,
    sameSite: isSecure ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

/**
 * POST /api/auth/register
 * Supports role-based registration for teacher, student, and admin
 */
export const register = async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            passwordHash: pwHash,
            passWord,
            role = 'student',
            // Teacher-specific fields:
            subjects,
            assignedClassIds,
            // Student-specific fields:
            studentCode,
            classId,
            enrolledSubjects,
            // Admin-specific fields:
            department,
            permissions
        } = req.body;

        const finalPassword = pwHash || password || passWord;

        if (!name || !name.trim()) {
            return res.status(400).json({ message: "Name is required." });
        }

        if (!email || !email.trim()) {
            return res.status(400).json({ message: "Email is required." });
        }

        if (!finalPassword) {
            return res.status(400).json({ message: "Password is required." });
        }

        const validRoles = ['teacher', 'admin', 'student'];
        const normalizedRole = (role || 'student').toLowerCase().trim();
        if (!validRoles.includes(normalizedRole)) {
            return res.status(400).json({
                message: `Invalid role '${role}'. Must be one of: ${validRoles.join(', ')}`
            });
        }

        const isUserExist = await userModel.findOne({
            email: email.trim().toLowerCase()
        });

        if (isUserExist) {
            return res.status(409).json({
                message: "Email is already registered."
            });
        }

        const hash = await bcrypt.hash(finalPassword, 10);

        // 1. Create the base User (handles authentication & authorization)
        const user = await userModel.create({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            passwordHash: hash,
            role: normalizedRole,
            active: true
        });

        let profileData = null;

        // 2. Create the specialized profile based on role
        if (normalizedRole === 'teacher') {
            const classIds = Array.isArray(assignedClassIds) ? assignedClassIds : [];

            // Validate referenced classes if any
            if (classIds.length > 0) {
                const validClasses = await classGroupModel.countDocuments({ _id: { $in: classIds } });
                if (validClasses !== classIds.length) {
                    await userModel.findByIdAndDelete(user._id);
                    return res.status(404).json({ message: "One or more assignedClassIds not found." });
                }
            }

            const teacher = await teacherModel.create({
                userId: user._id,
                name: user.name,
                email: user.email,
                subjects: Array.isArray(subjects) ? subjects : [],
                assignedClassIds: classIds,
                active: true
            });

            // Update ClassGroup teacherIds
            if (classIds.length > 0) {
                await classGroupModel.updateMany(
                    { _id: { $in: classIds } },
                    { $addToSet: { teacherIds: user._id } }
                );
            }

            profileData = {
                teacherId: teacher._id,
                subjects: teacher.subjects,
                assignedClassIds: teacher.assignedClassIds
            };

        } else if (normalizedRole === 'student') {
            let cls = null;
            if (classId) {
                if (!mongoose.Types.ObjectId.isValid(classId)) {
                    await userModel.findByIdAndDelete(user._id);
                    return res.status(404).json({ message: "Referenced classId not found." });
                }
                cls = await classGroupModel.findById(classId);
                if (!cls) {
                    await userModel.findByIdAndDelete(user._id);
                    return res.status(404).json({ message: "Referenced classId not found." });
                }
            }

            const code = studentCode ? studentCode.toUpperCase().trim() : `STU-${Math.floor(1000 + Math.random() * 9000)}`;
            const enrollmentStatus = cls ? 'enrolled' : 'pending';

            const student = await studentModel.create({
                userId: user._id,
                name: user.name,
                studentCode: code,
                classId: cls ? cls._id : undefined,
                enrolledSubjects: Array.isArray(enrolledSubjects) ? enrolledSubjects : [],
                enrollmentStatus,
                enrollmentDate: new Date()
            });

            if (cls) {
                cls.studentIds.push(student._id);
                await cls.save();
            }

            profileData = {
                studentId: student._id,
                studentCode: student.studentCode,
                classId: student.classId,
                enrollmentStatus: student.enrollmentStatus,
                enrolledSubjects: student.enrolledSubjects
            };

        } else if (normalizedRole === 'admin') {
            const admin = await adminModel.create({
                userId: user._id,
                name: user.name,
                email: user.email,
                department: department || 'Administration',
                permissions: Array.isArray(permissions) ? permissions : ['all'],
                active: true
            });

            profileData = {
                adminId: admin._id,
                department: admin.department,
                permissions: admin.permissions
            };
        }

        // 3. Generate token with role-specific claims
        const tokenPayload = {
            id: user._id,
            role: user.role,
            assignedClassIds: (profileData?.assignedClassIds || []).map(id => id.toString()),
            studentId: profileData?.studentId ? profileData.studentId.toString() : null,
            teacherId: profileData?.teacherId ? profileData.teacherId.toString() : null,
            adminId: profileData?.adminId ? profileData.adminId.toString() : null
        };

        const token = jwt.sign(
            tokenPayload,
            process.env.JWT_PRIVATE || "default_jwt_secret",
            { expiresIn: '7d' }
        );

        res.cookie('token', token, COOKIE_OPTIONS);

        return res.status(201).json({
            message: `${normalizedRole.charAt(0).toUpperCase() + normalizedRole.slice(1)} registered successfully`,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                active: user.active
            },
            profile: profileData,
            token
        });

    } catch (error) {
        console.error('[Auth Error] Register:', error);
        if (error.code === 11000) {
            return res.status(409).json({ message: "User account or identifier already exists." });
        }
        return res.status(500).json({
            message: error.message || "Internal server error"
        });
    }
};

/**
 * POST /api/auth/login
 */
export const login = async (req, res) => {
    try {
        const { email, password, passwordHash: pwHash, passWord } = req.body;
        const finalPassword = pwHash || password || passWord;

        if (!email || !email.trim()) {
            return res.status(400).json({ message: "Email is required." });
        }

        if (!finalPassword) {
            return res.status(400).json({ message: "Password is required." });
        }

        const user = await userModel.findOne({ email: email.trim().toLowerCase() });

        if (!user) {
            return res.status(401).json({
                message: "User not found. Please check your credentials."
            });
        }

        // Check if user account is active
        if (user.active === false) {
            return res.status(403).json({
                message: "Account has been deactivated. Contact administrator."
            });
        }

        const currentPasswordHash = user.passwordHash || user._doc?.passWord || user.get('passWord');
        if (!currentPasswordHash) {
            return res.status(401).json({
                message: "No password found on account. Please contact administrator."
            });
        }
        const isValidPassword = await bcrypt.compare(finalPassword, currentPasswordHash);

        if (!isValidPassword) {
            return res.status(401).json({
                message: "Invalid password. Please try again."
            });
        }

        // Auto-migrate legacy document to passwordHash if needed
        if (!user.passwordHash && currentPasswordHash) {
            user.passwordHash = currentPasswordHash;
            await user.save().catch(() => {});
        }

        let assignedClassIds = [];
        let studentId = null;
        let teacherId = null;
        let adminId = null;
        let profile = null;

        // Fetch / sync role-specific profile
        if (user.role === 'teacher') {
            let teacher = await teacherModel.findOne({ userId: user._id });
            if (!teacher) {
                // Auto-sync legacy seeded teacher into Teacher model
                teacher = await teacherModel.create({
                    userId: user._id,
                    name: user.name,
                    email: user.email,
                    subjects: user.get('subjects') || [],
                    assignedClassIds: user.get('assignedClassIds') || [],
                    active: user.active !== false
                });
            }

            if (teacher.active === false) {
                return res.status(403).json({
                    message: "Forbidden: Teacher account has been deactivated."
                });
            }

            teacherId = teacher._id;
            assignedClassIds = (teacher.assignedClassIds || []).map(id => id.toString());
            profile = {
                teacherId: teacher._id,
                subjects: teacher.subjects,
                assignedClassIds: teacher.assignedClassIds
            };

        } else if (user.role === 'student') {
            const student = await studentModel.findOne({ userId: user._id });
            if (student) {
                if (student.enrollmentStatus === 'archived') {
                    return res.status(403).json({
                        message: "Forbidden: Student enrollment is archived."
                    });
                }
                studentId = student._id;
                profile = {
                    studentId: student._id,
                    studentCode: student.studentCode,
                    classId: student.classId,
                    enrollmentStatus: student.enrollmentStatus
                };
            }

        } else if (user.role === 'admin') {
            let admin = await adminModel.findOne({ userId: user._id });
            if (!admin) {
                // Auto-sync legacy admin
                admin = await adminModel.create({
                    userId: user._id,
                    name: user.name,
                    email: user.email,
                    department: 'Administration',
                    permissions: ['all'],
                    active: user.active !== false
                });
            }

            if (admin.active === false) {
                return res.status(403).json({
                    message: "Forbidden: Administrator account has been deactivated."
                });
            }

            adminId = admin._id;
            profile = {
                adminId: admin._id,
                department: admin.department,
                permissions: admin.permissions
            };
        }

        const token = jwt.sign(
            {
                id: user._id,
                role: user.role,
                assignedClassIds,
                studentId: studentId ? studentId.toString() : null,
                teacherId: teacherId ? teacherId.toString() : null,
                adminId: adminId ? adminId.toString() : null
            },
            process.env.JWT_PRIVATE || "default_jwt_secret",
            { expiresIn: '7d' }
        );

        res.cookie("token", token, COOKIE_OPTIONS);

        return res.status(200).json({
            message: "Login successful",
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                active: user.active
            },
            profile,
            token
        });

    } catch (error) {
        console.error('[Auth Error] Login:', error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
};

/**
 * POST /api/auth/logout
 */
export const logout = async (req, res) => {
    res.clearCookie("token", COOKIE_OPTIONS);
    return res.status(200).json({ message: 'Logged out successfully' });
};

/**
 * GET /api/auth/me
 */
export const getMe = async (req, res) => {
    try {
        const user = await userModel.findById(req.user.id || req.user._id)
            .select('-passwordHash');

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        let profile = null;
        if (user.role === 'teacher') {
            profile = await teacherModel.findOne({ userId: user._id })
                .populate('assignedClassIds', 'name term');
        } else if (user.role === 'student') {
            profile = await studentModel.findOne({ userId: user._id })
                .populate('classId', 'name term');
        } else if (user.role === 'admin') {
            profile = await adminModel.findOne({ userId: user._id });
        }

        return res.status(200).json({
            user,
            profile
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const updateMe = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const { name, photo, department, subjects } = req.body;

        const updateFields = {};
        if (name) updateFields.name = name;
        if (photo !== undefined) updateFields.photo = photo;

        const updatedUser = await userModel.findByIdAndUpdate(
            userId,
            { $set: updateFields },
            { new: true, runValidators: true }
        ).select('-passwordHash');

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        let updatedProfile = null;
        if (updatedUser.role === 'teacher') {
            const teacherUpdates = {};
            if (name) teacherUpdates.name = name;
            if (photo !== undefined) teacherUpdates.photo = photo;
            if (subjects) teacherUpdates.subjects = subjects;
            updatedProfile = await teacherModel.findOneAndUpdate(
                { userId: updatedUser._id },
                { $set: teacherUpdates },
                { new: true }
            ).populate('assignedClassIds', 'name term');
        } else if (updatedUser.role === 'admin') {
            const adminUpdates = {};
            if (name) adminUpdates.name = name;
            if (photo !== undefined) adminUpdates.photo = photo;
            if (department) adminUpdates.department = department;
            updatedProfile = await adminModel.findOneAndUpdate(
                { userId: updatedUser._id },
                { $set: adminUpdates },
                { new: true }
            );
        } else if (updatedUser.role === 'student') {
            const studentUpdates = {};
            if (name) studentUpdates.name = name;
            if (photo !== undefined) studentUpdates.photo = photo;
            updatedProfile = await studentModel.findOneAndUpdate(
                { userId: updatedUser._id },
                { $set: studentUpdates },
                { new: true }
            ).populate('classId', 'name term');
        }

        return res.status(200).json({
            message: "Profile updated successfully",
            user: updatedUser,
            profile: updatedProfile
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const registerUser = register;
export const loginUser = login;
export const logoutUser = logout;

export default {
    register,
    login,
    logout,
    getMe,
    updateMe,
    registerUser,
    loginUser,
    logoutUser
};
