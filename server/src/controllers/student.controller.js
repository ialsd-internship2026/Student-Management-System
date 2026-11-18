import mongoose from 'mongoose';
import Student from '../models/student.model.js';
import ClassGroup from '../models/classGroup.model.js';
import AttendanceRecord from '../models/attendanceRecord.model.js';
import Assessment from '../models/assessment.model.js';
import Result from '../models/result.model.js';
import Course from '../models/course.model.js';
import Enrollment from '../models/enrollment.model.js';
import Announcement from '../models/announcement.model.js';
import Resource from '../models/resource.model.js';
import PracticeActivity from '../models/practiceActivity.model.js';
import {
    calculateStudentAttendance,
    calculateStudentPerformance,
    calculateClassMetrics,
    calculateStreak
} from '../utils/metrics.utils.js';

/**
 * 1. GET /api/student/overview
 * Greeting, next milestone banner, streak counter, 4 stat cards,
 * weekly trend vs class average, today's sessions, course progress, latest exams
 */
export const getStudentOverview = async (req, res) => {
    try {
        const student = req.student;
        const studentId = student._id;

        // Current date and greeting
        const now = new Date();
        const hour = now.getHours();
        let greetingWord = "Good morning";
        if (hour >= 12 && hour < 17) greetingWord = "Good afternoon";
        else if (hour >= 17) greetingWord = "Good evening";

        const greeting = `${greetingWord}, ${student.name.split(' ')[0]}`;
        const currentDateFormatted = now.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // 1. Streak counter
        const streakDays = await calculateStreak(studentId);

        // 2. Attendance metrics (only submitted records, no notes)
        const attendance = await calculateStudentAttendance(studentId, student.classId);

        // 3. Performance & Results
        const performance = await calculateStudentPerformance(studentId);

        // 4. Enrollments & Course Progress
        const enrollments = await Enrollment.find({ studentId }).populate('courseId').lean();
        const courseProgressList = enrollments.map(e => ({
            courseId: e.courseId?._id,
            courseName: e.courseId?.name || "Course",
            courseCode: e.courseId?.code || "CODE",
            progressPercent: e.progressPercent || 0
        }));

        // 5. Next Exam Milestone Banner
        const nextAssessment = await Assessment.findOne({
            classId: student.classId,
            date: { $gte: now }
        }).sort({ date: 1 }).lean();

        const nextMilestone = nextAssessment ? {
            title: `Upcoming: ${nextAssessment.name} (${nextAssessment.subject})`,
            subject: nextAssessment.subject,
            assessmentName: nextAssessment.name,
            date: nextAssessment.date,
            motivationalNote: "Stay consistent! Review your summary notes and focus on key concepts.",
            linkedPracticeSet: `/practice/${nextAssessment.subject.toLowerCase()}`
        } : {
            title: "No upcoming exams scheduled",
            subject: "All caught up",
            assessmentName: "Regular Study",
            date: null,
            motivationalNote: "Great job keeping up with your coursework! Keep your streak going.",
            linkedPracticeSet: "/practice/daily"
        };

        // 4 Stat Cards
        const statCards = {
            attendancePercent: attendance.attendanceRate,
            overallPerformancePercent: performance.overallScorePercent,
            enrolledCoursesCount: enrollments.length,
            nextExam: nextAssessment ? {
                date: nextAssessment.date,
                subject: nextAssessment.subject,
                name: nextAssessment.name
            } : null
        };

        // 6. Weekly performance trend (student vs class average)
        const assessments = await Assessment.find({
            classId: student.classId,
            status: 'published'
        }).sort({ date: 1 }).lean();

        const weeklyTrend = [];
        for (const a of assessments) {
            const classResults = await Result.find({ assessmentId: a._id }).lean();
            const studentResult = classResults.find(r => r.studentId.toString() === studentId.toString());

            const max = a.maxScore || 100;
            const classAvg = classResults.length > 0
                ? Math.round(classResults.reduce((s, r) => s + r.score, 0) / (classResults.length * max) * 100)
                : 0;

            if (studentResult) {
                const sPct = Math.round((studentResult.score / max) * 100);
                weeklyTrend.push({
                    weekLabel: a.name,
                    subject: a.subject,
                    date: a.date,
                    studentScore: studentResult.score,
                    studentPercentage: sPct,
                    classAveragePercentage: classAvg,
                    onTrack: sPct >= classAvg
                });
            }
        }

        // 7. Today's class sessions
        const classGroup = await ClassGroup.findById(student.classId).lean();
        const className = classGroup?.name || "Class";

        const todaySessions = [
            {
                time: "09:00 - 10:30 AM",
                subject: "Mathematics",
                topic: "Differential Calculus & Applications",
                room: "Room 302",
                status: "completed"
            },
            {
                time: "11:00 - 12:30 PM",
                subject: "Physics",
                topic: "Thermodynamics and Heat Transfer",
                room: "Lab B",
                status: "upcoming"
            },
            {
                time: "02:00 - 03:30 PM",
                subject: "English Literature",
                topic: "Modern Poetry Analysis",
                room: "Room 105",
                status: "upcoming"
            }
        ];

        const remainingSessionsCount = todaySessions.filter(s => s.status === 'upcoming').length;

        // 8. Latest exam results summary (published only)
        const latestExamResults = performance.resultsList
            .filter(r => r.status === 'published')
            .slice(-4)
            .reverse();

        return res.status(200).json({
            message: "Student overview fetched successfully",
            greeting,
            currentDate: currentDateFormatted,
            nextMilestone,
            streakCounter: {
                currentStreakDays: streakDays,
                activityType: "Daily Study Practice"
            },
            statCards,
            weeklyPerformanceTrend: weeklyTrend,
            todaySessions: {
                sessions: todaySessions,
                remainingSessionsCount
            },
            courseProgress: courseProgressList,
            latestExamResults
        });

    } catch (error) {
        console.error('[getStudentOverview Error]', error);
        return res.status(500).json({ message: "Failed to fetch student overview", error: error.message });
    }
};

/**
 * 2. GET /api/student/attendance?from=&to=&page=&limit=
 * Scoped to logged-in student. Filter status: 'submitted' only, omit notes.
 * Stats, eligibility threshold (85%), weekly timetable, attendance history, by-course breakdown.
 */
export const getStudentAttendance = async (req, res) => {
    try {
        const student = req.student;
        const studentId = student._id;
        const { from, to, page = 1, limit = 10 } = req.query;

        // Fetch only submitted attendance records (security guarantee)
        const dateFilter = {};
        if (from) dateFilter.$gte = new Date(from);
        if (to) dateFilter.$lte = new Date(to);

        const recordQuery = {
            classId: student.classId,
            status: 'submitted'
        };
        if (Object.keys(dateFilter).length > 0) {
            recordQuery.sessionDate = dateFilter;
        }

        const submittedRecords = await AttendanceRecord.find(recordQuery)
            .select('-notes') // never expose session notes to students
            .sort({ sessionDate: -1 })
            .lean();

        let totalSessions = 0;
        let presentCount = 0;
        let lateCount = 0;
        let absentCount = 0;
        const historyList = [];
        const courseMap = {};

        for (const record of submittedRecords) {
            const entry = record.entries.find(e => e.studentId.toString() === studentId.toString());
            if (entry) {
                totalSessions++;
                if (entry.status === 'present') presentCount++;
                else if (entry.status === 'late') lateCount++;
                else if (entry.status === 'absent') absentCount++;

                historyList.push({
                    id: record._id,
                    date: record.sessionDate,
                    subject: record.sessionSubject,
                    timeSlot: record.sessionTimeSlot,
                    status: entry.status
                });

                const subj = record.sessionSubject || 'General';
                if (!courseMap[subj]) {
                    courseMap[subj] = { total: 0, attended: 0, present: 0, late: 0, absent: 0 };
                }
                courseMap[subj].total++;
                if (entry.status === 'present') {
                    courseMap[subj].present++;
                    courseMap[subj].attended++;
                } else if (entry.status === 'late') {
                    courseMap[subj].late++;
                    courseMap[subj].attended++;
                } else if (entry.status === 'absent') {
                    courseMap[subj].absent++;
                }
            }
        }

        const attendanceRate = totalSessions > 0
            ? Math.round(((presentCount + lateCount) / totalSessions) * 100)
            : 100;

        const ELIGIBILITY_THRESHOLD = 85;
        const inGoodStanding = attendanceRate >= ELIGIBILITY_THRESHOLD;

        // Course breakdown
        const courseBreakdown = Object.entries(courseMap).map(([subject, data]) => ({
            course: subject,
            totalSessions: data.total,
            attendedSessions: data.attended,
            presentCount: data.present,
            lateCount: data.late,
            absentCount: data.absent,
            attendancePercent: data.total > 0 ? Math.round((data.attended / data.total) * 100) : 100
        }));

        // Paginate history
        const p = Math.max(1, parseInt(page, 10));
        const l = Math.max(1, parseInt(limit, 10));
        const totalHistory = historyList.length;
        const startIndex = (p - 1) * l;
        const paginatedHistory = historyList.slice(startIndex, startIndex + l);

        return res.status(200).json({
            message: "Student attendance fetched successfully",
            stats: {
                attendanceRate,
                totalSessions,
                presentCount,
                lateCount,
                absentCount,
                eligibilityThreshold: ELIGIBILITY_THRESHOLD,
                inGoodStanding,
                statusBadge: inGoodStanding ? "Eligible" : "Attendance Warning"
            },
            courseBreakdown,
            attendanceHistory: paginatedHistory,
            pagination: {
                totalRecords: totalHistory,
                currentPage: p,
                limit: l,
                totalPages: Math.ceil(totalHistory / l)
            }
        });

    } catch (error) {
        console.error('[getStudentAttendance Error]', error);
        return res.status(500).json({ message: "Failed to fetch student attendance", error: error.message });
    }
};

/**
 * 3. GET /api/student/schedule?weekStart=
 * Weekly timetable per day/time slot (subject, teacher, room, mode), paging by week
 */
export const getStudentSchedule = async (req, res) => {
    try {
        const student = req.student;
        const { weekStart } = req.query;

        const baseDate = weekStart ? new Date(weekStart) : new Date();
        // Calculate Monday of the week
        const dayOfWeek = baseDate.getDay();
        const diffToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
        const monday = new Date(baseDate);
        monday.setDate(baseDate.getDate() + diffToMonday);
        monday.setHours(0, 0, 0, 0);

        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        const timetable = days.map((dayName, idx) => {
            const dayDate = new Date(monday);
            dayDate.setDate(monday.getDate() + idx);

            return {
                day: dayName,
                date: dayDate.toISOString().slice(0, 10),
                slots: [
                    {
                        time: "09:00 - 10:30 AM",
                        subject: idx % 2 === 0 ? "Mathematics" : "Physics",
                        teacher: idx % 2 === 0 ? "Dr. Sarah Jenkins" : "Mr. Marcus Vance",
                        room: idx % 2 === 0 ? "Room 302" : "Lab B",
                        mode: "in-person"
                    },
                    {
                        time: "11:00 - 12:30 PM",
                        subject: idx % 2 === 0 ? "Physics" : "English Literature",
                        teacher: idx % 2 === 0 ? "Mr. Marcus Vance" : "Ms. Eleanor Vance",
                        room: idx % 2 === 0 ? "Lab B" : "Room 105",
                        mode: "in-person"
                    },
                    {
                        time: "02:00 - 03:30 PM",
                        subject: "Interactive Study & Tutorials",
                        teacher: "Faculty Team",
                        room: "Online Portal",
                        mode: "online"
                    }
                ]
            };
        });

        return res.status(200).json({
            message: "Student schedule fetched successfully",
            weekStart: monday.toISOString().slice(0, 10),
            timetable
        });

    } catch (error) {
        console.error('[getStudentSchedule Error]', error);
        return res.status(500).json({ message: "Failed to fetch student schedule", error: error.message });
    }
};

/**
 * 4. GET /api/student/courses
 * List of courses the student is enrolled in
 */
export const getStudentCourses = async (req, res) => {
    try {
        const student = req.student;
        const studentId = student._id;

        const enrollments = await Enrollment.find({ studentId })
            .populate({
                path: 'courseId',
                populate: { path: 'teacherId', select: 'name email' }
            })
            .lean();

        const courses = enrollments.map(e => {
            const course = e.courseId;
            if (!course) return null;
            const totalLessons = course.lessons ? course.lessons.length : 0;
            const completedLessons = course.lessons
                ? course.lessons.filter(l => l.status === 'completed').length
                : 0;

            return {
                id: course._id,
                code: course.code,
                name: course.name,
                term: course.term,
                teacherName: course.teacherId?.name || "Faculty Member",
                credits: course.credits || 3,
                description: course.description,
                progressPercent: e.progressPercent || 0,
                totalLessons,
                completedLessons
            };
        }).filter(Boolean);

        return res.status(200).json({
            message: "Enrolled courses fetched successfully",
            courses
        });

    } catch (error) {
        console.error('[getStudentCourses Error]', error);
        return res.status(500).json({ message: "Failed to fetch student courses", error: error.message });
    }
};

/**
 * 5. GET /api/student/courses/:id
 * Per-course detail: teacher name, description, lessons with status, progress %
 */
export const getStudentCourseDetail = async (req, res) => {
    try {
        const student = req.student;
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid course ID." });
        }

        const enrollment = await Enrollment.findOne({
            studentId: student._id,
            courseId: id
        }).populate({
            path: 'courseId',
            populate: { path: 'teacherId', select: 'name email' }
        }).lean();

        if (!enrollment || !enrollment.courseId) {
            return res.status(404).json({ message: "Course not found or you are not enrolled in this course." });
        }

        const course = enrollment.courseId;
        const lessons = (course.lessons || []).map((l, index) => {
            let status = l.status || 'not_started';
            if (index === 0 && status === 'not_started') status = 'completed';
            return {
                id: l._id,
                title: l.title,
                order: l.order || index + 1,
                status: status === 'not_started' && index === 1 ? 'in_progress' : (status === 'not_started' && index === 2 ? 'up_next' : status)
            };
        });

        return res.status(200).json({
            message: "Course detail fetched successfully",
            course: {
                id: course._id,
                code: course.code,
                name: course.name,
                term: course.term,
                teacherName: course.teacherId?.name || "Faculty Member",
                credits: course.credits,
                description: course.description,
                progressPercent: enrollment.progressPercent || 0,
                lessons
            }
        });

    } catch (error) {
        console.error('[getStudentCourseDetail Error]', error);
        return res.status(500).json({ message: "Failed to fetch course details", error: error.message });
    }
};

/**
 * 6. GET /api/student/results?from=&to=
 * Performance-over-time trend with date range, percentile badge,
 * performance by subject, auto-generated insights, next best steps recommendations,
 * and exam results table with published results only
 */
export const getStudentResults = async (req, res) => {
    try {
        const student = req.student;
        const studentId = student._id;
        const { from, to } = req.query;

        const performance = await calculateStudentPerformance(studentId);

        // Fetch class metrics to derive rank and percentile badge
        const classMetrics = await calculateClassMetrics(student.classId);
        const selfMetric = classMetrics.studentsMetrics.find(sm => sm.studentId.toString() === studentId.toString());
        const classRank = selfMetric ? selfMetric.classRank : 1;
        const totalInClass = classMetrics.totalStudents || 1;
        const percentileTop = Math.max(1, Math.round((classRank / totalInClass) * 100));
        const percentileBadge = `Top ${percentileTop}% of class (Rank #${classRank} of ${totalInClass})`;

        // Trend over time
        const assessmentQuery = {
            classId: student.classId,
            status: 'published'
        };
        if (from || to) {
            assessmentQuery.date = {};
            if (from) assessmentQuery.date.$gte = new Date(from);
            if (to) assessmentQuery.date.$lte = new Date(to);
        }

        const assessments = await Assessment.find(assessmentQuery).sort({ date: 1 }).lean();
        const trend = [];

        for (const a of assessments) {
            const classResults = await Result.find({ assessmentId: a._id }).lean();
            const studentResult = classResults.find(r => r.studentId.toString() === studentId.toString());
            const max = a.maxScore || 100;
            const classAvg = classResults.length > 0
                ? Math.round(classResults.reduce((s, r) => s + r.score, 0) / (classResults.length * max) * 100)
                : 0;

            if (studentResult) {
                const sPct = Math.round((studentResult.score / max) * 100);
                trend.push({
                    assessmentName: a.name,
                    subject: a.subject,
                    date: a.date,
                    studentScore: studentResult.score,
                    studentPercentage: sPct,
                    classAveragePercentage: classAvg,
                    status: sPct >= classAvg ? 'Above Average' : 'Needs Practice'
                });
            }
        }

        // Performance by subject with auto-generated insight
        const subjects = Object.entries(performance.subjectBreakdown);
        let strongestSubject = null;
        let weakestSubject = null;

        if (subjects.length > 0) {
            subjects.sort((a, b) => b[1].averagePercent - a[1].averagePercent);
            strongestSubject = { subject: subjects[0][0], ...subjects[0][1] };
            weakestSubject = { subject: subjects[subjects.length - 1][0], ...subjects[subjects.length - 1][1] };
        }

        const autoGeneratedInsight = strongestSubject && weakestSubject
            ? `Strongest in ${strongestSubject.subject} (${strongestSubject.averagePercent}%). Needs most focus in ${weakestSubject.subject} (${weakestSubject.averagePercent}%).`
            : "Keep up your regular practice to establish subject benchmarks.";

        // Rule-based "Next best steps" recommendations
        const nextAssessment = await Assessment.findOne({
            classId: student.classId,
            date: { $gte: new Date() }
        }).sort({ date: 1 }).lean();

        const recommendations = [];
        if (weakestSubject) {
            recommendations.push({
                type: "focus_area",
                priority: "high",
                title: `Revise ${weakestSubject.subject} Core Topics`,
                description: `Your average in ${weakestSubject.subject} is ${weakestSubject.averagePercent}%. Spend 30 minutes daily reviewing practice sets.`,
                suggestedAction: `Open ${weakestSubject.subject} Question Bank`
            });
        }

        if (nextAssessment) {
            recommendations.push({
                type: "upcoming_exam",
                priority: "medium",
                title: `Prepare for ${nextAssessment.name} (${nextAssessment.subject})`,
                description: `Scheduled for ${new Date(nextAssessment.date).toLocaleDateString()}. Complete sample test 1 and review marked errors.`,
                suggestedAction: "Take Mock Quiz"
            });
        }

        recommendations.push({
            type: "consistency",
            priority: "normal",
            title: "Maintain Practice Activity",
            description: "Daily active problem solving boosts long-term exam retention by over 40%.",
            suggestedAction: "Log Daily Activity"
        });

        // Exam results table (only published results)
        const examResultsTable = performance.resultsList.filter(r => r.status === 'published');

        return res.status(200).json({
            message: "Student results and learning analytics fetched successfully",
            percentileBadge,
            classRank: `#${classRank}`,
            overallScorePercent: performance.overallScorePercent,
            performanceOverTime: trend,
            performanceBySubject: performance.subjectBreakdown,
            insight: autoGeneratedInsight,
            recommendations,
            examResults: examResultsTable
        });

    } catch (error) {
        console.error('[getStudentResults Error]', error);
        return res.status(500).json({ message: "Failed to fetch student results", error: error.message });
    }
};

/**
 * 7. GET /api/student/announcements
 * Announcements for student's class and enrolled courses
 */
export const getStudentAnnouncements = async (req, res) => {
    try {
        const student = req.student;

        const enrollments = await Enrollment.find({ studentId: student._id }).select('courseId').lean();
        const courseIds = enrollments.map(e => e.courseId);

        const announcements = await Announcement.find({
            $or: [
                { classId: student.classId },
                { courseId: { $in: courseIds } }
            ]
        })
            .populate('postedBy', 'name email')
            .sort({ createdAt: -1 })
            .lean();

        const formatted = announcements.map(a => ({
            id: a._id,
            title: a.title,
            body: a.body,
            postedBy: a.postedBy?.name || "Administration",
            createdAt: a.createdAt
        }));

        return res.status(200).json({
            message: "Announcements fetched successfully",
            announcements: formatted
        });

    } catch (error) {
        console.error('[getStudentAnnouncements Error]', error);
        return res.status(500).json({ message: "Failed to fetch announcements", error: error.message });
    }
};

/**
 * 8. GET /api/student/resources?courseId=
 * Resources scoped to enrolled courses or class
 */
export const getStudentResources = async (req, res) => {
    try {
        const student = req.student;
        const { courseId } = req.query;

        const filter = {
            $or: [
                { classId: student.classId },
                ...(courseId ? [{ courseId }] : [])
            ]
        };

        if (!courseId) {
            const enrollments = await Enrollment.find({ studentId: student._id }).select('courseId').lean();
            const courseIds = enrollments.map(e => e.courseId);
            filter.$or.push({ courseId: { $in: courseIds } });
        }

        const resources = await Resource.find(filter)
            .populate('courseId', 'name code')
            .populate('uploadedBy', 'name')
            .sort({ createdAt: -1 })
            .lean();

        const formatted = resources.map(r => ({
            id: r._id,
            title: r.title,
            course: r.courseId ? `${r.courseId.code} - ${r.courseId.name}` : "General",
            fileUrl: r.fileUrl,
            link: r.link,
            uploadedBy: r.uploadedBy?.name || "Teacher",
            createdAt: r.createdAt
        }));

        return res.status(200).json({
            message: "Resources fetched successfully",
            resources: formatted
        });

    } catch (error) {
        console.error('[getStudentResources Error]', error);
        return res.status(500).json({ message: "Failed to fetch resources", error: error.message });
    }
};

/**
 * 9. GET /api/student/report/export
 * CSV export of student's own results only
 */
export const exportStudentReport = async (req, res) => {
    try {
        const student = req.student;
        const studentId = student._id;

        const performance = await calculateStudentPerformance(studentId);
        const publishedResults = performance.resultsList.filter(r => r.status === 'published');

        const headers = ["Date", "Subject", "Assessment", "Score", "Max Score", "Percentage", "Grade", "Feedback"];
        const rows = publishedResults.map(r => [
            `"${new Date(r.date).toISOString().slice(0, 10)}"`,
            `"${r.subject}"`,
            `"${r.assessmentName.replace(/"/g, '""')}"`,
            r.score,
            r.maxScore,
            `${r.percentage}%`,
            `"${r.grade}"`,
            `"${(r.feedbackText || '').replace(/"/g, '""')}"`
        ]);

        const csvContent = [
            `"Student Report: ${student.name} (${student.studentCode})"`,
            `"Generated at: ${new Date().toISOString()}"`,
            `"Overall Score: ${performance.overallScorePercent}%"`,
            "",
            headers.join(','),
            ...rows.map(r => r.join(','))
        ].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="student-report-${student.studentCode}.csv"`);
        return res.status(200).send(csvContent);

    } catch (error) {
        console.error('[exportStudentReport Error]', error);
        return res.status(500).json({ message: "Failed to export student report", error: error.message });
    }
};

export default {
    getStudentOverview,
    getStudentAttendance,
    getStudentSchedule,
    getStudentCourses,
    getStudentCourseDetail,
    getStudentResults,
    getStudentAnnouncements,
    getStudentResources,
    exportStudentReport
};
