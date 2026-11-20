import jwt from 'jsonwebtoken';
import 'dotenv/config';
import User from '../models/user.model.js';
import Teacher from '../models/teacher.model.js';
import Admin from '../models/admin.model.js';
import Student from '../models/student.model.js';
import AttendanceRecord from '../models/attendanceRecord.model.js';

export const getTokenFromRequest = (req) => {
    if (req.cookies && req.cookies.token) {
        return req.cookies.token;
    }
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        return req.headers.authorization.split(' ')[1];
    }
    return null;
};

/**
 * Teacher authentication middleware
 * Allows 'teacher' or 'admin' roles
 */
export const authTeacher = async (req, res, next) => {
    try {
        const token = getTokenFromRequest(req);
        if (!token) {
            return res.status(401).json({ message: "Unauthorized. Please log in as a teacher." });
        }

        const decoded = jwt.verify(token, process.env.JWT_PRIVATE || "default_jwt_secret");

        if (decoded.role !== 'teacher' && decoded.role !== 'admin') {
            return res.status(403).json({ message: "Forbidden. Teacher privilege required." });
        }

        const user = await User.findById(decoded.id).select('-passwordHash');
        if (!user) {
            return res.status(401).json({ message: "User not found or deactivated." });
        }

        // Soft delete check: deactivated teachers lose access
        let teacher = null;
        if (user.role === 'teacher') {
            teacher = await Teacher.findOne({ userId: user._id });
            if (teacher && teacher.active === false) {
                return res.status(403).json({ message: "Forbidden: Teacher account has been deactivated." });
            }
        }

        const teacherClasses = teacher ? (teacher.assignedClassIds || []) : (user.get('assignedClassIds') || decoded.assignedClassIds || []);
        const teacherSubjects = teacher ? (teacher.subjects || []) : (user.get('subjects') || []);

        req.user = {
            id: user._id.toString(),
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            active: user.active !== false && (!teacher || teacher.active !== false),
            assignedClassIds: teacherClasses.map(id => id.toString()),
            subjects: teacherSubjects,
            teacherId: teacher ? teacher._id.toString() : null
        };
        req.teacher = teacher;

        return next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: "Session expired. Please log in again." });
        }
        return res.status(401).json({ message: "Invalid or expired token. Unauthorized access." });
    }
};

/**
 * Verifies that the authenticated teacher is assigned to the requested class.
 * Admins bypass this check.
 */
export const verifyClassOwnership = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized." });
        }

        if (req.user.role === 'admin') {
            return next();
        }

        const teacherAssigned = (req.user.assignedClassIds || []).map(id => id.toString());

        // Extract classId candidate from query, params, or body
        let targetClassId = req.query.classId || req.body?.classId || req.params.classId;

        // If route is /classes/:id or /classes/:id/export, params.id represents classId
        if (!targetClassId && req.baseUrl.includes('teacher') && req.path.includes('/classes/') && req.params.id) {
            targetClassId = req.params.id;
        }

        // If targetClassId is provided directly
        if (targetClassId) {
            if (!teacherAssigned.includes(targetClassId.toString())) {
                return res.status(403).json({
                    message: "Forbidden: You can mark or view attendance and results only for your assigned classes."
                });
            }
            return next();
        }

        // If route is /students/:id or /students/:id/*, check if student's class is assigned
        if (req.params.id && req.path.includes('/students/')) {
            const student = await Student.findById(req.params.id).select('classId');
            if (student) {
                if (!student.classId || !teacherAssigned.includes(student.classId.toString())) {
                    return res.status(403).json({
                        message: "Forbidden: You do not have access to students outside your assigned classes."
                    });
                }
            }
            return next();
        }

        // If route is /attendance/:id/submit, check attendance record's class
        if (req.params.id && req.path.includes('/attendance/')) {
            const record = await AttendanceRecord.findById(req.params.id).select('classId');
            if (record) {
                if (!record.classId || !teacherAssigned.includes(record.classId.toString())) {
                    return res.status(403).json({
                        message: "Forbidden: You do not have permission to submit attendance for this class."
                    });
                }
            }
            return next();
        }

        return next();
    } catch (error) {
        console.error('[verifyClassOwnership Error]', error);
        return res.status(500).json({ message: "Error verifying class access boundary." });
    }
};

/**
 * Student authentication middleware
 * Enforces role === 'student'
 * Derives studentId implicitly from JWT / User record
 * Rejects archived students and client attempt to supply a different studentId
 */
export const authStudent = async (req, res, next) => {
    try {
        const token = getTokenFromRequest(req);
        if (!token) {
            return res.status(401).json({ message: "Unauthorized. Please log in as a student." });
        }

        const decoded = jwt.verify(token, process.env.JWT_PRIVATE || "default_jwt_secret");

        if (decoded.role !== 'student') {
            return res.status(403).json({ message: "Forbidden. Student privilege required." });
        }

        // Reject client param tampering attempts
        if (req.params.studentId || req.query.studentId || req.body?.studentId) {
            const attemptedId = req.params.studentId || req.query.studentId || req.body?.studentId;
            const tokenStudentId = decoded.studentId ? decoded.studentId.toString() : null;
            if (attemptedId && tokenStudentId && attemptedId.toString() !== tokenStudentId) {
                return res.status(403).json({
                    message: "Forbidden: You can only access your own student data."
                });
            }
        }

        // Resolve student profile
        let student = null;
        if (decoded.studentId) {
            student = await Student.findById(decoded.studentId);
        }

        if (!student) {
            student = await Student.findOne({ userId: decoded.id });
        }

        if (!student) {
            return res.status(403).json({ message: "Forbidden: No linked student profile found." });
        }

        // Soft delete check: archived students lose access
        if (student.enrollmentStatus === 'archived') {
            return res.status(403).json({ message: "Forbidden: Student enrollment is archived." });
        }

        req.user = decoded;
        req.student = student;
        req.studentId = student._id;

        return next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: "Session expired. Please log in again." });
        }
        return res.status(401).json({ message: "Invalid or expired token. Unauthorized access." });
    }
};

/**
 * Admin authentication middleware
 * Enforces role === 'admin'
 */
export const authAdmin = async (req, res, next) => {
    try {
        const token = getTokenFromRequest(req);
        if (!token) {
            return res.status(401).json({ message: "Unauthorized. Please log in as an administrator." });
        }

        const decoded = jwt.verify(token, process.env.JWT_PRIVATE || "default_jwt_secret");

        if (decoded.role !== 'admin') {
            return res.status(403).json({ message: "Forbidden. Administrator privilege required." });
        }

        const user = await User.findById(decoded.id).select('-passwordHash');
        if (!user) {
            return res.status(401).json({ message: "Administrator account not found." });
        }

        if (user.active === false) {
            return res.status(403).json({ message: "Forbidden: Administrator account has been deactivated." });
        }

        let admin = await Admin.findOne({ userId: user._id });
        if (admin && admin.active === false) {
            return res.status(403).json({ message: "Forbidden: Administrator account has been deactivated." });
        }

        req.user = {
            id: user._id.toString(),
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            adminId: admin ? admin._id.toString() : null
        };
        req.admin = admin;

        return next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: "Session expired. Please log in again." });
        }
        return res.status(401).json({ message: "Invalid or expired token. Unauthorized access." });
    }
};

export const authUser = async (req, res, next) => {
    try {
        const token = getTokenFromRequest(req);
        if (!token) {
            return res.status(401).json({ message: "Unauthorized. Please log in." });
        }

        const decoded = jwt.verify(token, process.env.JWT_PRIVATE || "default_jwt_secret");
        req.user = decoded;
        return next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: "Session expired. Please log in again." });
        }
        return res.status(401).json({ message: "Invalid token. Please log in again." });
    }
};

export const optionalAuth = (req, res, next) => {
    const token = getTokenFromRequest(req);
    if (!token) return next();

    try {
        const decoded = jwt.verify(token, process.env.JWT_PRIVATE || "default_jwt_secret");
        req.user = decoded;
        return next();
    } catch (error) {
        return next();
    }
};

export default {
    authTeacher,
    verifyClassOwnership,
    authStudent,
    authAdmin,
    authUser,
    optionalAuth,
    getTokenFromRequest
};
