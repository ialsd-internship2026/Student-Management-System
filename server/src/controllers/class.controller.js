import studentModel from '../models/student.model.js';
import userModel from '../models/user.model.js';
import { respondWithError, escapeRegex } from '../utils/api.utils.js';

/**
 * Get all classes and sections with student counts
 * Route: GET /api/classes
 */
export const getAllClasses = async (req, res) => {
    try {
        const classSummary = await studentModel.aggregate([
            {
                $group: {
                    _id: {
                        class: "$class",
                        section: { $ifNull: ["$section", "Default"] }
                    },
                    totalStudents: { $sum: 1 },
                    activeStudents: {
                        $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] }
                    },
                    maleStudents: {
                        $sum: { $cond: [{ $eq: ["$gender", "male"] }, 1, 0] }
                    },
                    femaleStudents: {
                        $sum: { $cond: [{ $eq: ["$gender", "female"] }, 1, 0] }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    class: "$_id.class",
                    section: "$_id.section",
                    totalStudents: 1,
                    activeStudents: 1,
                    maleStudents: 1,
                    femaleStudents: 1
                }
            },
            { $sort: { class: 1, section: 1 } }
        ]);

        return res.status(200).json({
            message: "Classes fetched successfully",
            totalClasses: classSummary.length,
            classes: classSummary
        });

    } catch (error) {
        console.error('[Class Controller] getAllClasses Error:', error);
        return respondWithError(res, error);
    }
};

/**
 * Get all students for a specific class and optional section
 * Route: GET /api/classes/:className/students
 */
export const getStudentsByClass = async (req, res) => {
    try {
        const { className } = req.params;
        const { section, status } = req.query;

        const filter = {
            class: new RegExp(`^${escapeRegex(className.trim())}$`, 'i')
        };

        if (section) {
            filter.section = section.trim().toUpperCase();
        }

        if (status) {
            filter.status = status.trim().toLowerCase();
        }

        const students = await studentModel.find(filter)
            .sort({ rollNumber: 1, name: 1 })
            .populate('userId', 'userName name email role');

        return res.status(200).json({
            message: `Students for class '${className}' fetched successfully`,
            count: students.length,
            class: className,
            section: section || 'All',
            students
        });

    } catch (error) {
        console.error('[Class Controller] getStudentsByClass Error:', error);
        return respondWithError(res, error);
    }
};

/**
 * Promote or transfer students from one class to another
 * Route: POST /api/classes/promote
 */
export const promoteClass = async (req, res) => {
    try {
        const { currentClass, targetClass, currentSection, targetSection, studentIds } = req.body;

        if (!currentClass || !targetClass) {
            return res.status(400).json({
                message: "Both currentClass and targetClass are required."
            });
        }

        const filter = { class: currentClass };

        if (currentSection) {
            filter.section = currentSection.toUpperCase();
        }

        if (Array.isArray(studentIds) && studentIds.length > 0) {
            filter._id = { $in: studentIds };
        }

        const updateFields = { class: targetClass };
        if (targetSection) {
            updateFields.section = targetSection.toUpperCase();
        }

        const updateResult = await studentModel.updateMany(filter, { $set: updateFields });

        return res.status(200).json({
            message: `Successfully promoted ${updateResult.modifiedCount} students from '${currentClass}' to '${targetClass}'.`,
            modifiedCount: updateResult.modifiedCount
        });

    } catch (error) {
        console.error('[Class Controller] promoteClass Error:', error);
        return respondWithError(res, error);
    }
};

/**
 * Assign class to a teacher
 * Route: POST /api/classes/assign-teacher
 */
export const assignTeacher = async (req, res) => {
    try {
        const { teacherId, classId } = req.body;

        if (!teacherId || !classId) {
            return res.status(400).json({ message: "Teacher ID and Class ID are required." });
        }

        const teacher = await userModel.findOne({ _id: teacherId, role: 'teacher' });
        if (!teacher) {
            return res.status(404).json({ message: "Teacher account not found." });
        }

        if (!teacher.assignedClassIds.includes(classId)) {
            teacher.assignedClassIds.push(classId);
            await teacher.save();
        }

        return res.status(200).json({
            message: "Class assigned to teacher successfully.",
            assignedClassIds: teacher.assignedClassIds
        });

    } catch (error) {
        console.error('[Class Controller] assignTeacher Error:', error);
        return respondWithError(res, error);
    }
};

export default {
    getAllClasses,
    getStudentsByClass,
    promoteClass,
    assignTeacher
};
