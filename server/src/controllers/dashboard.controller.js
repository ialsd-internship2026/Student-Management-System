import studentModel from '../models/student.model.js';
import userModel from '../models/user.model.js';
import { respondWithError } from '../utils/api.utils.js';

/**
 * Get system-wide dashboard statistics
 * Route: GET /api/dashboard/stats
 */
export const getDashboardStats = async (req, res) => {
    try {
        const [
            totalStudents,
            activeStudents,
            inactiveStudents,
            totalUsers,
            totalTeachers,
            totalAdmins,
            classBreakdown,
            recentStudents,
            recentUsers
        ] = await Promise.all([
            studentModel.countDocuments(),
            studentModel.countDocuments({ status: 'active' }),
            studentModel.countDocuments({ status: { $ne: 'active' } }),
            userModel.countDocuments(),
            userModel.countDocuments({ role: 'teacher' }),
            userModel.countDocuments({ role: 'admin' }),
            studentModel.aggregate([
                {
                    $group: {
                        _id: "$class",
                        total: { $sum: 1 },
                        active: { $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } }
                    }
                },
                { $sort: { total: -1 } }
            ]),
            studentModel.find()
                .sort({ createdAt: -1 })
                .limit(5)
                .select('name rollNumber email class section status createdAt'),
            userModel.find()
                .sort({ createdAt: -1 })
                .limit(5)
                .select('name userName email role createdAt')
        ]);

        return res.status(200).json({
            message: "Dashboard summary retrieved successfully",
            overview: {
                students: {
                    total: totalStudents,
                    active: activeStudents,
                    inactive: inactiveStudents
                },
                staff: {
                    totalUsers,
                    teachers: totalTeachers,
                    admins: totalAdmins
                }
            },
            classBreakdown,
            recentActivity: {
                latestStudents: recentStudents,
                latestUsers: recentUsers
            }
        });

    } catch (error) {
        console.error('[Dashboard Controller] getDashboardStats Error:', error);
        return respondWithError(res, error);
    }
};

export default {
    getDashboardStats
};
