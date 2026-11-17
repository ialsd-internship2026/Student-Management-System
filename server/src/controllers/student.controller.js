import studentModel from '../models/student.model.js';
import userModel from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { respondWithError, getPagination, escapeRegex } from '../utils/api.utils.js';

/**
 * Create / Register a new student
 * Route: POST /api/students
 */
export const createStudent = async (req, res) => {
    try {
        const {
            name,
            rollNumber,
            email,
            phone,
            dateOfBirth,
            gender,
            class: studentClass,
            grade,
            section,
            department,
            subjects,
            address,
            guardian,
            admissionDate,
            status,
            profileImage,
            userId,
            createUserAccount,
            password,
            passWord
        } = req.body;

        const resolvedClass = studentClass || grade;

        if (!name || !rollNumber || !email || !resolvedClass) {
            return res.status(400).json({
                message: "Name, roll number, email, and class are required fields."
            });
        }

        // Check for existing student with same roll number or email
        const existingStudent = await studentModel.findOne({
            $or: [
                { rollNumber: rollNumber.trim().toUpperCase() },
                { email: email.trim().toLowerCase() }
            ]
        });

        if (existingStudent) {
            const conflictField = existingStudent.rollNumber.toUpperCase() === rollNumber.trim().toUpperCase()
                ? "Roll number"
                : "Email";
            return res.status(409).json({
                message: `${conflictField} is already registered to another student.`
            });
        }

        let linkedUserId = userId || null;

        // Auto-create a linked user account if requested or password provided
        const finalPassword = password || passWord;
        if ((createUserAccount || finalPassword) && !linkedUserId) {
            const existingUser = await userModel.findOne({ email: email.trim().toLowerCase() });

            if (existingUser) {
                linkedUserId = existingUser._id;
            } else if (finalPassword) {
                const hashedPassword = await bcrypt.hash(finalPassword, 10);
                const generatedUserName = rollNumber.trim().toLowerCase() || email.split('@')[0];

                const newUser = await userModel.create({
                    name: name.trim(),
                    userName: generatedUserName,
                    email: email.trim().toLowerCase(),
                    passWord: hashedPassword,
                    role: 'student',
                    subjects: subjects || []
                });

                linkedUserId = newUser._id;
            }
        }

        // Create student document
        const newStudent = await studentModel.create({
            name: name.trim(),
            rollNumber: rollNumber.trim().toUpperCase(),
            email: email.trim().toLowerCase(),
            phone,
            dateOfBirth,
            gender,
            class: resolvedClass.trim(),
            section: section ? section.trim().toUpperCase() : undefined,
            department: department ? department.trim() : undefined,
            subjects: subjects || [],
            address,
            guardian,
            admissionDate: admissionDate || undefined,
            status: status || 'active',
            profileImage,
            userId: linkedUserId || undefined,
            createdBy: req.user ? req.user.id || req.user._id : undefined
        });

        // If user account is linked, update user's studentId reference
        if (linkedUserId) {
            await userModel.findByIdAndUpdate(linkedUserId, { studentId: newStudent._id });
        }

        const populatedStudent = await studentModel.findById(newStudent._id)
            .populate('userId', 'userName name email role')
            .populate('createdBy', 'name email role');

        return res.status(201).json({
            message: "Student created successfully",
            student: populatedStudent
        });

    } catch (error) {
        console.error('[Student Controller] createStudent Error:', error);
        return respondWithError(res, error);
    }
};

/**
 * Get all students with pagination, search, and filtering
 * Route: GET /api/students
 */
export const getAllStudents = async (req, res) => {
    try {
        const { page, limit, skip } = getPagination(req);
        const { search, status, gender, department, section, sortBy = 'createdAt', order = 'desc' } = req.query;
        const studentClass = req.query.class || req.query.grade;

        const filter = {};

        // Keyword search across name, rollNumber, and email
        if (search && search.trim()) {
            const escaped = escapeRegex(search.trim());
            const regex = new RegExp(escaped, 'i');
            filter.$or = [
                { name: regex },
                { rollNumber: regex },
                { email: regex },
                { department: regex }
            ];
        }

        // Exact match filters
        if (studentClass) filter.class = studentClass;
        if (section) filter.section = section.toUpperCase();
        if (department) filter.department = department;
        if (status) filter.status = status;
        if (gender) filter.gender = gender.toLowerCase();

        const sortDirection = order === 'asc' || order === '1' ? 1 : -1;
        const sortOptions = { [sortBy]: sortDirection };

        const [students, total] = await Promise.all([
            studentModel.find(filter)
                .sort(sortOptions)
                .skip(skip)
                .limit(limit)
                .populate('userId', 'userName name email role')
                .populate('createdBy', 'name email role'),
            studentModel.countDocuments(filter)
        ]);

        return res.status(200).json({
            message: "Students fetched successfully",
            data: students,
            pagination: {
                totalStudents: total,
                totalPages: Math.ceil(total / limit),
                currentPage: page,
                limit
            }
        });

    } catch (error) {
        console.error('[Student Controller] getAllStudents Error:', error);
        return respondWithError(res, error);
    }
};

/**
 * Get student by MongoDB _id or Roll Number
 * Route: GET /api/students/:id
 */
export const getStudentById = async (req, res) => {
    try {
        const { id } = req.params;

        const isObjectId = mongoose.Types.ObjectId.isValid(id);
        const query = isObjectId
            ? { _id: id }
            : { rollNumber: id.trim().toUpperCase() };

        const student = await studentModel.findOne(query)
            .populate('userId', 'userName name email role')
            .populate('createdBy', 'name email role');

        if (!student) {
            return res.status(404).json({
                message: `Student with identifier '${id}' not found.`
            });
        }

        return res.status(200).json({
            message: "Student details fetched successfully",
            student
        });

    } catch (error) {
        console.error('[Student Controller] getStudentById Error:', error);
        return respondWithError(res, error);
    }
};

/**
 * Update student by ID
 * Route: PUT /api/students/:id
 */
export const updateStudent = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid student ID." });
        }

        const student = await studentModel.findById(id);
        if (!student) {
            return res.status(404).json({ message: "Student not found." });
        }

        const updateData = { ...req.body };

        // Handle class field alias
        if (updateData.grade && !updateData.class) {
            updateData.class = updateData.grade;
        }

        // Format uppercase/trim fields
        if (updateData.rollNumber) {
            updateData.rollNumber = updateData.rollNumber.trim().toUpperCase();
        }
        if (updateData.email) {
            updateData.email = updateData.email.trim().toLowerCase();
        }
        if (updateData.section) {
            updateData.section = updateData.section.trim().toUpperCase();
        }

        // Check unique conflict if rollNumber or email is being modified
        if (
            (updateData.rollNumber && updateData.rollNumber !== student.rollNumber) ||
            (updateData.email && updateData.email !== student.email)
        ) {
            const conflictQuery = {
                _id: { $ne: id },
                $or: []
            };

            if (updateData.rollNumber && updateData.rollNumber !== student.rollNumber) {
                conflictQuery.$or.push({ rollNumber: updateData.rollNumber });
            }
            if (updateData.email && updateData.email !== student.email) {
                conflictQuery.$or.push({ email: updateData.email });
            }

            const conflict = await studentModel.findOne(conflictQuery);
            if (conflict) {
                const conflictField = conflict.rollNumber === updateData.rollNumber ? "Roll number" : "Email";
                return res.status(409).json({
                    message: `${conflictField} is already assigned to another student.`
                });
            }
        }

        const updatedStudent = await studentModel.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        )
            .populate('userId', 'userName name email role')
            .populate('createdBy', 'name email role');

        // Keep linked user model in sync if name or email changed
        if (updatedStudent.userId && (updateData.name || updateData.email)) {
            const userSync = {};
            if (updateData.name) userSync.name = updateData.name;
            if (updateData.email) userSync.email = updateData.email;
            await userModel.findByIdAndUpdate(updatedStudent.userId._id || updatedStudent.userId, userSync);
        }

        return res.status(200).json({
            message: "Student updated successfully",
            student: updatedStudent
        });

    } catch (error) {
        console.error('[Student Controller] updateStudent Error:', error);
        return respondWithError(res, error);
    }
};

/**
 * Delete student by ID
 * Route: DELETE /api/students/:id
 */
export const deleteStudent = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid student ID." });
        }

        const student = await studentModel.findById(id);
        if (!student) {
            return res.status(404).json({ message: "Student not found." });
        }

        // If user account is linked, clear student reference
        if (student.userId) {
            await userModel.findByIdAndUpdate(student.userId, { $unset: { studentId: "" } });
        }

        await studentModel.findByIdAndDelete(id);

        return res.status(200).json({
            message: "Student deleted successfully",
            deletedId: id
        });

    } catch (error) {
        console.error('[Student Controller] deleteStudent Error:', error);
        return respondWithError(res, error);
    }
};

/**
 * Get Student Management Statistics & Summary
 * Route: GET /api/students/stats
 */
export const getStudentStats = async (req, res) => {
    try {
        const [totalStudents, activeStudents, inactiveStudents, classDistribution, genderDistribution] = await Promise.all([
            studentModel.countDocuments(),
            studentModel.countDocuments({ status: 'active' }),
            studentModel.countDocuments({ status: { $in: ['inactive', 'suspended', 'graduated'] } }),
            studentModel.aggregate([
                { $group: { _id: "$class", count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]),
            studentModel.aggregate([
                { $group: { _id: { $ifNull: ["$gender", "unspecified"] }, count: { $sum: 1 } } }
            ])
        ]);

        return res.status(200).json({
            message: "Student statistics retrieved successfully",
            stats: {
                totalStudents,
                activeStudents,
                inactiveStudents,
                classDistribution,
                genderDistribution
            }
        });

    } catch (error) {
        console.error('[Student Controller] getStudentStats Error:', error);
        return respondWithError(res, error);
    }
};

/**
 * Get Logged-in Student Profile
 * Route: GET /api/students/me/profile
 */
export const getStudentProfile = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: "Authentication required." });
        }

        const student = await studentModel.findOne({
            $or: [
                { userId: req.user.id },
                { email: req.user.email }
            ]
        }).populate('userId', 'userName name email role');

        if (!student) {
            return res.status(404).json({
                message: "No student profile linked to this user account."
            });
        }

        return res.status(200).json({
            message: "Student profile fetched successfully",
            student
        });

    } catch (error) {
        console.error('[Student Controller] getStudentProfile Error:', error);
        return respondWithError(res, error);
    }
};

/**
 * Bulk create students
 * Route: POST /api/students/bulk
 */
export const bulkCreateStudents = async (req, res) => {
    try {
        const { students } = req.body;

        if (!Array.isArray(students) || students.length === 0) {
            return res.status(400).json({
                message: "An array of student records is required."
            });
        }

        const formattedStudents = students.map((s) => ({
            ...s,
            name: s.name ? s.name.trim() : s.name,
            rollNumber: s.rollNumber ? s.rollNumber.trim().toUpperCase() : s.rollNumber,
            email: s.email ? s.email.trim().toLowerCase() : s.email,
            class: s.class || s.grade,
            createdBy: req.user ? req.user.id : undefined
        }));

        const createdStudents = await studentModel.insertMany(formattedStudents, { ordered: false });

        return res.status(201).json({
            message: `Successfully created ${createdStudents.length} student records.`,
            count: createdStudents.length,
            students: createdStudents
        });

    } catch (error) {
        console.error('[Student Controller] bulkCreateStudents Error:', error);
        return respondWithError(res, error);
    }
};

export default {
    createStudent,
    getAllStudents,
    getStudentById,
    updateStudent,
    deleteStudent,
    getStudentStats,
    getStudentProfile,
    bulkCreateStudents
};
