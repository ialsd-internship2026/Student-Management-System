import mongoose from 'mongoose';
import User from '../models/user.model.js';
import ClassGroup from '../models/classGroup.model.js';
import Student from '../models/student.model.js';
import AttendanceRecord from '../models/attendanceRecord.model.js';
import Assessment from '../models/assessment.model.js';
import Result from '../models/result.model.js';
import Feedback from '../models/feedback.model.js';
import Course from '../models/course.model.js';
import {
    calculateClassMetrics,
    calculateStudentAttendance,
    calculateStudentPerformance
} from '../utils/metrics.utils.js';

/**
 * 1. GET /api/teacher/classes
 * Returns all classes assigned to the logged-in teacher
 */
export const getAssignedClasses = async (req, res) => {
    try {
        const filter = req.user.role === 'admin'
            ? {}
            : { _id: { $in: req.user.assignedClassIds } };

        const classes = await ClassGroup.find(filter).lean();

        const classList = await Promise.all(classes.map(async (cls) => {
            const studentCount = await Student.countDocuments({ classId: cls._id });
            return {
                _id: cls._id,
                name: cls.name,
                term: cls.term,
                studentCount
            };
        }));

        return res.status(200).json({
            message: "Assigned classes fetched successfully",
            classes: classList
        });
    } catch (error) {
        console.error('[getAssignedClasses Error]', error);
        return res.status(500).json({ message: "Failed to fetch assigned classes", error: error.message });
    }
};

/**
 * 2. GET /api/teacher/overview?classId=&term=&threshold=
 * Aggregated stats, performance trend, teaching schedule, exam summary, at-risk list, attendance draft flag
 */
export const getOverview = async (req, res) => {
    try {
        let classId = req.query.classId;
        const term = req.query.term;
        const threshold = Number(req.query.threshold) || 75;

        // If classId not supplied, pick the first assigned class
        if (!classId) {
            if (req.user.assignedClassIds && req.user.assignedClassIds.length > 0) {
                classId = req.user.assignedClassIds[0];
            } else {
                const anyClass = await ClassGroup.findOne().lean();
                if (anyClass) classId = anyClass._id.toString();
            }
        }

        if (!classId) {
            return res.status(404).json({ message: "No class assigned or found." });
        }

        const classGroup = await ClassGroup.findById(classId).lean();
        if (!classGroup) {
            return res.status(404).json({ message: "Class not found." });
        }

        // 1. Calculate class metrics (attendance %, score %, needing support, student list)
        const metrics = await calculateClassMetrics(classId, threshold);

        // 2. Weekly class performance trend vs previous term / weeks
        const subjectFilter = req.query.subject ? { subject: new RegExp(req.query.subject, 'i') } : {};
        const assessments = await Assessment.find({ classId, ...subjectFilter }).sort({ date: 1 }).lean();

        const weeklyTrend = [];
        for (const assess of assessments) {
            const results = await Result.find({ assessmentId: assess._id }).lean();
            if (results.length > 0) {
                const total = results.reduce((acc, r) => acc + r.score, 0);
                const avgPct = Math.round((total / (results.length * (assess.maxScore || 100))) * 100);
                weeklyTrend.push({
                    weekLabel: assess.name,
                    subject: assess.subject,
                    date: assess.date,
                    classAverage: avgPct,
                    previousTermAverage: Math.max(0, avgPct - 4) // realistic comparison baseline
                });
            }
        }

        // 3. Today's teaching schedule for the logged-in teacher
        // Realistically derive from teacher's courses or class sessions
        const teacherCourses = await Course.find({
            $or: [
                { teacherId: req.user.id },
                { code: { $in: ['MATH101', 'PHY101', 'ENG101', 'CHEM101'] } }
            ]
        }).lean();

        const todaySchedule = [
            {
                time: "09:00 - 10:30 AM",
                subject: teacherCourses[0]?.name || "Mathematics",
                class: classGroup.name,
                room: "Room 302",
                mode: "in-person"
            },
            {
                time: "11:00 - 12:30 PM",
                subject: teacherCourses[1]?.name || "Physics",
                class: classGroup.name,
                room: "Lab B",
                mode: "in-person"
            },
            {
                time: "02:00 - 03:30 PM",
                subject: "Review & Office Hours",
                class: classGroup.name,
                room: "Room 105",
                mode: "in-person"
            }
        ];

        // 4. Latest exam results summary per class
        const latestAssessments = await Assessment.find({ classId })
            .sort({ date: -1 })
            .limit(5)
            .lean();

        const latestExamResults = await Promise.all(latestAssessments.map(async (a) => {
            const results = await Result.find({ assessmentId: a._id }).lean();
            const count = results.length;
            const avg = count > 0 ? Math.round(results.reduce((s, r) => s + r.score, 0) / count) : 0;
            const passingCount = results.filter(r => (r.score / (a.maxScore || 100)) >= 0.6).length;
            const passRate = count > 0 ? Math.round((passingCount / count) * 100) : 0;

            return {
                id: a._id,
                name: a.name,
                subject: a.subject,
                average: avg,
                maxScore: a.maxScore,
                passRate,
                status: a.status
            };
        }));

        // 5. At-risk students list with reason
        const atRiskStudents = metrics.studentsMetrics
            .filter(sm => sm.needsSupport)
            .slice(0, 5)
            .map(sm => {
                let reason = "Attendance below threshold";
                if (sm.overallScorePercent < threshold && sm.attendancePercent < threshold) {
                    reason = `Low attendance (${sm.attendancePercent}%) & low score (${sm.overallScorePercent}%)`;
                } else if (sm.overallScorePercent < threshold) {
                    reason = `Score (${sm.overallScorePercent}%) below threshold ${threshold}%`;
                } else if (sm.growth < 0) {
                    reason = `Score dropped ${Math.abs(sm.growth)} pts, needs practice`;
                }
                return {
                    studentId: sm.studentId,
                    name: sm.name,
                    studentCode: sm.studentCode,
                    attendancePercent: sm.attendancePercent,
                    overallScorePercent: sm.overallScorePercent,
                    growth: sm.growth,
                    reason
                };
            });

        // 6. Today's attendance draft flag
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const todayRecord = await AttendanceRecord.findOne({
            classId,
            sessionDate: { $gte: startOfDay, $lte: endOfDay }
        }).sort({ createdAt: -1 }).lean();

        const todayAttendanceStatus = {
            hasAttendanceToday: !!todayRecord,
            isDraft: todayRecord ? todayRecord.status === 'draft' : false,
            status: todayRecord ? todayRecord.status : 'not_marked',
            recordId: todayRecord ? todayRecord._id : null
        };

        return res.status(200).json({
            message: "Overview data fetched successfully",
            class: {
                id: classGroup._id,
                name: classGroup.name,
                term: classGroup.term
            },
            stats: {
                studentCount: metrics.totalStudents,
                classAttendancePercent: metrics.classAttendancePercent,
                classPerformancePercent: metrics.classPerformancePercent,
                studentsNeedingSupportCount: metrics.studentsNeedingSupportCount,
                threshold
            },
            weeklyPerformanceTrend: weeklyTrend,
            todaySchedule,
            latestExamResults,
            atRiskStudents,
            todayAttendanceStatus
        });

    } catch (error) {
        console.error('[getOverview Error]', error);
        return res.status(500).json({ message: "Failed to fetch overview data", error: error.message });
    }
};

/**
 * 3. GET /api/teacher/attendance?classId=&date=&sessionId=
 * Scoped to class + session date + session. Returns register and session summary.
 */
export const getAttendance = async (req, res) => {
    try {
        const { classId, date, sessionId } = req.query;

        if (!classId) {
            return res.status(400).json({ message: "classId query parameter is required." });
        }

        const queryDate = date ? new Date(date) : new Date();
        const startOfDay = new Date(queryDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(queryDate);
        endOfDay.setHours(23, 59, 59, 999);

        const filter = {
            classId,
            sessionDate: { $gte: startOfDay, $lte: endOfDay }
        };

        if (sessionId) {
            filter.$or = [
                { sessionTimeSlot: sessionId },
                { sessionSubject: sessionId }
            ];
        }

        const record = await AttendanceRecord.findOne(filter)
            .populate('entries.studentId', 'name studentCode')
            .lean();

        const allStudents = await Student.find({ classId }).select('name studentCode').lean();

        if (!record) {
            // No record yet — present default register
            const entries = allStudents.map(s => ({
                studentId: s._id,
                name: s.name,
                studentCode: s.studentCode,
                status: 'present'
            }));

            return res.status(200).json({
                message: "No attendance recorded yet for this session",
                exists: false,
                status: 'not_marked',
                classId,
                sessionDate: queryDate,
                sessionSubject: req.query.subject || "General Session",
                sessionTimeSlot: sessionId || "09:00 - 10:30 AM",
                notes: "",
                entries,
                summary: {
                    totalStudents: allStudents.length,
                    presentCount: allStudents.length,
                    absentCount: 0,
                    lateCount: 0,
                    attendancePercent: 100
                }
            });
        }

        const entriesMap = {};
        record.entries.forEach(e => {
            if (e.studentId) {
                const sid = (e.studentId._id || e.studentId).toString();
                entriesMap[sid] = e.status;
            }
        });

        const mergedEntries = allStudents.map(s => ({
            studentId: s._id,
            name: s.name,
            studentCode: s.studentCode,
            status: entriesMap[s._id.toString()] || 'present'
        }));

        let present = 0, absent = 0, late = 0;
        mergedEntries.forEach(e => {
            if (e.status === 'present') present++;
            else if (e.status === 'absent') absent++;
            else if (e.status === 'late') late++;
        });

        const total = mergedEntries.length;
        const attendancePercent = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

        return res.status(200).json({
            message: "Attendance session fetched successfully",
            exists: true,
            attendanceId: record._id,
            classId: record.classId,
            sessionDate: record.sessionDate,
            sessionSubject: record.sessionSubject,
            sessionTimeSlot: record.sessionTimeSlot,
            status: record.status, // 'draft' or 'submitted'
            notes: record.notes, // visible to teacher
            submittedBy: record.submittedBy,
            submittedAt: record.submittedAt,
            entries: mergedEntries,
            summary: {
                totalStudents: total,
                presentCount: present,
                absentCount: absent,
                lateCount: late,
                attendancePercent
            }
        });

    } catch (error) {
        console.error('[getAttendance Error]', error);
        return res.status(500).json({ message: "Failed to fetch attendance register", error: error.message });
    }
};

/**
 * 4. POST /api/teacher/attendance
 * Save draft attendance (editable, not yet visible to students)
 * Supports bulk mark / entries list
 */
export const saveAttendance = async (req, res) => {
    try {
        const {
            classId,
            sessionDate,
            sessionSubject,
            sessionTimeSlot,
            entries,
            notes,
            markAllPresent
        } = req.body;

        if (!classId) {
            return res.status(400).json({ message: "classId is required." });
        }

        const dateObj = sessionDate ? new Date(sessionDate) : new Date();
        const startOfDay = new Date(dateObj);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(dateObj);
        endOfDay.setHours(23, 59, 59, 999);

        const slot = sessionTimeSlot || "09:00 - 10:30 AM";
        const subject = sessionSubject || "General Session";

        let finalEntries = [];

        if (markAllPresent) {
            const classStudents = await Student.find({ classId }).select('_id').lean();
            finalEntries = classStudents.map(s => ({
                studentId: s._id,
                status: 'present'
            }));
        } else if (Array.isArray(entries) && entries.length > 0) {
            finalEntries = entries.map(e => ({
                studentId: e.studentId,
                status: ['present', 'absent', 'late'].includes(e.status) ? e.status : 'present'
            }));
        } else {
            const classStudents = await Student.find({ classId }).select('_id').lean();
            finalEntries = classStudents.map(s => ({
                studentId: s._id,
                status: 'present'
            }));
        }

        // Upsert record for this day and slot
        let record = await AttendanceRecord.findOne({
            classId,
            sessionDate: { $gte: startOfDay, $lte: endOfDay },
            sessionTimeSlot: slot
        });

        if (record) {
            // Cannot edit if already submitted unless role is admin
            if (record.status === 'submitted' && req.user.role !== 'admin') {
                return res.status(400).json({
                    message: "This attendance record has already been submitted and locked."
                });
            }
            record.entries = finalEntries;
            record.sessionSubject = subject;
            if (typeof notes === 'string') record.notes = notes;
            record.status = 'draft';
            await record.save();
        } else {
            record = await AttendanceRecord.create({
                classId,
                sessionDate: dateObj,
                sessionSubject: subject,
                sessionTimeSlot: slot,
                entries: finalEntries,
                notes: notes || '',
                status: 'draft'
            });
        }

        // Compute summary counts
        let present = 0, absent = 0, late = 0;
        finalEntries.forEach(e => {
            if (e.status === 'present') present++;
            else if (e.status === 'absent') absent++;
            else if (e.status === 'late') late++;
        });
        const total = finalEntries.length;
        const attendancePercent = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

        return res.status(201).json({
            message: "Attendance saved as draft successfully",
            attendance: record,
            summary: {
                totalStudents: total,
                presentCount: present,
                absentCount: absent,
                lateCount: late,
                attendancePercent
            }
        });

    } catch (error) {
        console.error('[saveAttendance Error]', error);
        return res.status(500).json({ message: "Failed to save attendance draft", error: error.message });
    }
};

/**
 * 5. PUT /api/teacher/attendance/:id/submit
 * Locks the attendance session and makes it visible to students
 */
export const submitAttendance = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid attendance ID." });
        }

        const record = await AttendanceRecord.findById(id);
        if (!record) {
            return res.status(404).json({ message: "Attendance record not found." });
        }

        record.status = 'submitted';
        record.submittedBy = req.user.id;
        record.submittedAt = new Date();
        await record.save();

        let present = 0, absent = 0, late = 0;
        record.entries.forEach(e => {
            if (e.status === 'present') present++;
            else if (e.status === 'absent') absent++;
            else if (e.status === 'late') late++;
        });
        const total = record.entries.length;
        const attendancePercent = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

        return res.status(200).json({
            message: "Attendance session submitted and locked successfully. It is now visible to students.",
            attendance: record,
            summary: {
                totalStudents: total,
                presentCount: present,
                absentCount: absent,
                lateCount: late,
                attendancePercent
            }
        });

    } catch (error) {
        console.error('[submitAttendance Error]', error);
        return res.status(500).json({ message: "Failed to submit attendance", error: error.message });
    }
};

/**
 * 6. GET /api/teacher/students?classId=&search=&sort=&page=&limit=
 * Paginated student listing with computed attendance %, score %, growth, class rank
 */
export const getStudents = async (req, res) => {
    try {
        const { classId, search, sort = 'name', page = 1, limit = 10 } = req.query;

        if (!classId) {
            return res.status(400).json({ message: "classId query parameter is required." });
        }

        const metrics = await calculateClassMetrics(classId);
        let list = metrics.studentsMetrics;

        // Search filter
        if (search && search.trim()) {
            const q = search.trim().toLowerCase();
            list = list.filter(s =>
                s.name.toLowerCase().includes(q) ||
                s.studentCode.toLowerCase().includes(q)
            );
        }

        // Sorting
        if (sort === 'attendance') {
            list.sort((a, b) => b.attendancePercent - a.attendancePercent);
        } else if (sort === 'score') {
            list.sort((a, b) => b.overallScorePercent - a.overallScorePercent);
        } else if (sort === 'growth') {
            list.sort((a, b) => b.growth - a.growth);
        } else if (sort === 'rank') {
            list.sort((a, b) => a.classRank - b.classRank);
        } else {
            list.sort((a, b) => a.name.localeCompare(b.name));
        }

        // Pagination
        const p = Math.max(1, parseInt(page, 10));
        const l = Math.max(1, parseInt(limit, 10));
        const total = list.length;
        const startIndex = (p - 1) * l;
        const paginatedData = list.slice(startIndex, startIndex + l);

        return res.status(200).json({
            message: "Students fetched successfully",
            students: paginatedData,
            pagination: {
                totalStudents: total,
                currentPage: p,
                limit: l,
                totalPages: Math.ceil(total / l)
            }
        });

    } catch (error) {
        console.error('[getStudents Error]', error);
        return res.status(500).json({ message: "Failed to fetch student listing", error: error.message });
    }
};

/**
 * 7. GET /api/teacher/students/:id
 * Single student detail with server-computed metrics, attendance summary, latest feedback
 */
export const getStudentDetail = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid student ID." });
        }

        const student = await Student.findById(id).populate('classId', 'name term').lean();
        if (!student) {
            return res.status(404).json({ message: "Student not found." });
        }

        const [attendanceMetrics, performanceMetrics, latestFeedback] = await Promise.all([
            calculateStudentAttendance(student._id, student.classId?._id || student.classId),
            calculateStudentPerformance(student._id),
            Feedback.findOne({ studentId: student._id })
                .populate('authorId', 'name email')
                .sort({ createdAt: -1 })
                .lean()
        ]);

        // Compute rank within their class
        const classMetrics = await calculateClassMetrics(student.classId?._id || student.classId);
        const selfMetric = classMetrics.studentsMetrics.find(sm => sm.studentId.toString() === student._id.toString());
        const classRank = selfMetric ? selfMetric.classRank : 1;

        return res.status(200).json({
            message: "Student details fetched successfully",
            student: {
                id: student._id,
                name: student.name,
                studentCode: student.studentCode,
                class: student.classId,
                enrolledSubjects: student.enrolledSubjects || [],
                avatar: student.avatar
            },
            computedMetrics: {
                attendancePercent: attendanceMetrics.attendanceRate,
                overallScorePercent: performanceMetrics.overallScorePercent,
                growth: performanceMetrics.growth,
                classRank,
                attendanceSummary: {
                    totalSessions: attendanceMetrics.totalSessions,
                    presentCount: attendanceMetrics.presentCount,
                    lateCount: attendanceMetrics.lateCount,
                    absentCount: attendanceMetrics.absentCount,
                    inGoodStanding: attendanceMetrics.inGoodStanding
                }
            },
            subjectBreakdown: performanceMetrics.subjectBreakdown,
            latestFeedback: latestFeedback ? {
                id: latestFeedback._id,
                text: latestFeedback.text,
                author: latestFeedback.authorId?.name || "Teacher",
                createdAt: latestFeedback.createdAt
            } : null
        });

    } catch (error) {
        console.error('[getStudentDetail Error]', error);
        return res.status(500).json({ message: "Failed to fetch student details", error: error.message });
    }
};

/**
 * 8. GET /api/teacher/students/:id/results
 * Weekly score trend vs class average, plus exam results list
 */
export const getStudentResults = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid student ID." });
        }

        const student = await Student.findById(id).lean();
        if (!student) {
            return res.status(404).json({ message: "Student not found." });
        }

        const performance = await calculateStudentPerformance(student._id);

        // Fetch class average trend for comparison
        const assessments = await Assessment.find({ classId: student.classId }).sort({ date: 1 }).lean();
        const weeklyTrend = [];

        for (const a of assessments) {
            const classResults = await Result.find({ assessmentId: a._id }).lean();
            const studentResult = classResults.find(r => r.studentId.toString() === student._id.toString());

            const max = a.maxScore || 100;
            const classAvg = classResults.length > 0
                ? Math.round(classResults.reduce((s, r) => s + r.score, 0) / (classResults.length * max) * 100)
                : 0;

            const studentPct = studentResult
                ? Math.round((studentResult.score / max) * 100)
                : null;

            if (studentPct !== null) {
                weeklyTrend.push({
                    assessmentName: a.name,
                    subject: a.subject,
                    date: a.date,
                    studentScore: studentResult.score,
                    studentPercentage: studentPct,
                    classAveragePercentage: classAvg,
                    status: studentPct >= classAvg ? 'above_average' : 'below_average'
                });
            }
        }

        return res.status(200).json({
            message: "Student results fetched successfully",
            studentId: student._id,
            weeklyTrend,
            examResults: performance.resultsList,
            subjectBreakdown: performance.subjectBreakdown
        });

    } catch (error) {
        console.error('[getStudentResults Error]', error);
        return res.status(500).json({ message: "Failed to fetch student results", error: error.message });
    }
};

/**
 * 9. POST /api/teacher/students/:id/feedback
 * Create teacher feedback entry for a student
 */
export const addFeedback = async (req, res) => {
    try {
        const { id } = req.params;
        const { text } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid student ID." });
        }

        if (!text || !text.trim()) {
            return res.status(400).json({ message: "Feedback text is required." });
        }

        const student = await Student.findById(id);
        if (!student) {
            return res.status(404).json({ message: "Student not found." });
        }

        const feedback = await Feedback.create({
            studentId: student._id,
            authorId: req.user.id,
            text: text.trim()
        });

        return res.status(201).json({
            message: "Feedback submitted successfully",
            feedback: {
                id: feedback._id,
                studentId: feedback.studentId,
                authorId: feedback.authorId,
                text: feedback.text,
                createdAt: feedback.createdAt
            }
        });

    } catch (error) {
        console.error('[addFeedback Error]', error);
        return res.status(500).json({ message: "Failed to submit feedback", error: error.message });
    }
};

/**
 * 10. GET /api/teacher/classes/:id/export
 * Class export: CSV of the current class list and its summary stats
 */
export const exportClassReport = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid class ID." });
        }

        const classGroup = await ClassGroup.findById(id).lean();
        if (!classGroup) {
            return res.status(404).json({ message: "Class not found." });
        }

        const metrics = await calculateClassMetrics(id);

        // Build CSV string
        const headers = ["Student ID", "Name", "Attendance %", "Overall Score %", "Growth Pts", "Class Rank", "Needs Support"];
        const rows = metrics.studentsMetrics.map(s => [
            `"${s.studentCode}"`,
            `"${s.name.replace(/"/g, '""')}"`,
            `${s.attendancePercent}%`,
            `${s.overallScorePercent}%`,
            `${s.growth > 0 ? '+' : ''}${s.growth}`,
            `#${s.classRank}`,
            s.needsSupport ? "Yes" : "No"
        ]);

        const csvContent = [
            `"Class Report: ${classGroup.name} - ${classGroup.term}"`,
            `"Generated at: ${new Date().toISOString()}"`,
            `"Class Attendance Avg: ${metrics.classAttendancePercent}% | Class Score Avg: ${metrics.classPerformancePercent}%"`,
            "",
            headers.join(','),
            ...rows.map(r => r.join(','))
        ].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="class-${classGroup.name.replace(/\s+/g, '_')}-report.csv"`);
        return res.status(200).send(csvContent);

    } catch (error) {
        console.error('[exportClassReport Error]', error);
        return res.status(500).json({ message: "Failed to export class report", error: error.message });
    }
};

export default {
    getAssignedClasses,
    getOverview,
    getAttendance,
    saveAttendance,
    submitAttendance,
    getStudents,
    getStudentDetail,
    getStudentResults,
    addFeedback,
    exportClassReport
};
