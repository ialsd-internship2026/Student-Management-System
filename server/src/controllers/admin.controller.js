import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/user.model.js';
import Teacher from '../models/teacher.model.js';
import Admin from '../models/admin.model.js';
import ClassGroup from '../models/classGroup.model.js';
import Student from '../models/student.model.js';
import AttendanceRecord from '../models/attendanceRecord.model.js';
import Assessment from '../models/assessment.model.js';
import Result from '../models/result.model.js';
import Course from '../models/course.model.js';
import Enrollment from '../models/enrollment.model.js';
import ClassSession from '../models/classSession.model.js';
import Notification from '../models/notification.model.js';

import {
    calculateClassMetrics,
    calculateStudentAttendance,
    calculateStudentPerformance
} from '../utils/metrics.utils.js';

// Helper: Convert "HH:MM" to minutes from midnight
const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return (hours * 60) + (minutes || 0);
};

// Helper: Check time interval overlap
const doTimesOverlap = (startA, endA, startB, endB) => {
    const sA = timeToMinutes(startA);
    const eA = timeToMinutes(endA);
    const sB = timeToMinutes(startB);
    const eB = timeToMinutes(endB);
    return (sA < eB) && (eA > sB);
};

// Helper: Schedule conflict check
const checkScheduleConflict = async ({ teacherId, room, date, startTime, endTime, excludeSessionId = null }) => {
    const sessionDate = new Date(date);
    const startOfDay = new Date(sessionDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(sessionDate);
    endOfDay.setHours(23, 59, 59, 999);

    const query = {
        date: { $gte: startOfDay, $lte: endOfDay },
        status: { $ne: 'cancelled' },
        $or: [
            { teacherId },
            { room: room.trim() }
        ]
    };

    if (excludeSessionId) {
        query._id = { $ne: excludeSessionId };
    }

    const candidates = await ClassSession.find(query).populate('teacherId', 'name').lean();

    for (const cand of candidates) {
        if (doTimesOverlap(startTime, endTime, cand.startTime, cand.endTime)) {
            const isTeacherClash = cand.teacherId?._id?.toString() === teacherId.toString();
            const clashReason = isTeacherClash
                ? `Teacher (${cand.teacherId?.name || 'Assigned teacher'}) already has an overlapping session (${cand.startTime} - ${cand.endTime}, Room: ${cand.room}, Topic: "${cand.topic || 'Class'}")`
                : `Room "${cand.room}" is already booked for another session (${cand.startTime} - ${cand.endTime}, Topic: "${cand.topic || 'Class'}")`;

            return {
                hasConflict: true,
                clashReason,
                clashingSession: cand
            };
        }
    }

    return { hasConflict: false };
};

// Helper: Emit notification to affected teacher and students
const emitSessionNotification = async (sessionId, classId, teacherId, message) => {
    try {
        const notifications = [];
        if (teacherId) {
            notifications.push({
                recipientId: teacherId,
                recipientRole: 'teacher',
                type: 'schedule_change',
                message,
                relatedSessionId: sessionId
            });
        }

        const students = await Student.find({ classId, enrollmentStatus: { $ne: 'archived' } }).select('userId').lean();
        for (const s of students) {
            if (s.userId) {
                notifications.push({
                    recipientId: s.userId,
                    recipientRole: 'student',
                    type: 'schedule_change',
                    message,
                    relatedSessionId: sessionId
                });
            }
        }

        if (notifications.length > 0) {
            await Notification.insertMany(notifications);
        }
    } catch (err) {
        console.error('[emitSessionNotification Warning]', err.message);
    }
};

/* ==========================================================================
   11.1 OVERVIEW / DASHBOARD DATA
   ========================================================================== */

/**
 * GET /api/admin/overview?term=&classId=&studentId=
 */
export const getAdminOverview = async (req, res) => {
    try {
        const { term, classId, studentId } = req.query;

        // 1. Institute-wide counts
        const [activeStudentCount, activeTeacherCount, totalClassesCount, pendingEnrollmentsCount] = await Promise.all([
            Student.countDocuments({ enrollmentStatus: { $ne: 'archived' } }),
            Teacher.countDocuments({ active: true }).then(async count => count > 0 ? count : User.countDocuments({ role: 'teacher', active: true })),
            ClassGroup.countDocuments({}),
            Student.countDocuments({ enrollmentStatus: 'pending' })
        ]);

        // 2. Institute-wide Attendance & Performance Rollups
        const submittedRecords = await AttendanceRecord.find({ status: 'submitted' }).lean();
        let totalSessionsCount = 0;
        let attendedCount = 0;

        submittedRecords.forEach(rec => {
            rec.entries.forEach(e => {
                totalSessionsCount++;
                if (e.status === 'present' || e.status === 'late') {
                    attendedCount++;
                }
            });
        });

        const instituteAttendancePercent = totalSessionsCount > 0
            ? Math.round((attendedCount / totalSessionsCount) * 100)
            : 100;

        const allResults = await Result.find({}).populate('assessmentId').lean();
        let totalScorePct = 0;
        let validScoresCount = 0;

        allResults.forEach(r => {
            if (r.assessmentId && typeof r.score === 'number') {
                const max = r.assessmentId.maxScore || 100;
                totalScorePct += Math.round((r.score / max) * 100);
                validScoresCount++;
            }
        });

        const institutePerformancePercent = validScoresCount > 0
            ? Math.round(totalScorePct / validScoresCount)
            : 0;

        // 3. Institute Growth & Performance Trend
        const assessments = await Assessment.find({ status: 'published' }).sort({ date: 1 }).lean();
        const trend = [];
        for (const a of assessments) {
            const resForA = allResults.filter(r => r.assessmentId?._id?.toString() === a._id.toString());
            if (resForA.length > 0) {
                const avg = Math.round(resForA.reduce((s, r) => s + (r.score / (a.maxScore || 100)) * 100, 0) / resForA.length);
                trend.push({
                    assessmentName: a.name,
                    subject: a.subject,
                    date: a.date,
                    instituteAverage: avg,
                    previousTermAverage: Math.max(0, avg - 3)
                });
            }
        }

        // 4. Attendance by Class across all classes institute-wide
        const allClasses = await ClassGroup.find({}).lean();
        const attendanceByClass = allClasses.map(cls => {
            const classRecs = submittedRecords.filter(r => r.classId?.toString() === cls._id.toString());
            let cTotal = 0;
            let cAttended = 0;
            classRecs.forEach(r => {
                r.entries.forEach(e => {
                    cTotal++;
                    if (e.status === 'present' || e.status === 'late') cAttended++;
                });
            });

            return {
                classId: cls._id,
                className: cls.name,
                term: cls.term,
                studentCount: cls.studentIds ? cls.studentIds.length : 0,
                attendancePercent: cTotal > 0 ? Math.round((cAttended / cTotal) * 100) : 100
            };
        });

        // 5. Teacher & Class Monitoring Table
        let teachers = await Teacher.find({}).populate('assignedClassIds', 'name').lean();
        if (!teachers || teachers.length === 0) {
            teachers = await User.find({ role: 'teacher' }).populate('assignedClassIds', 'name').lean();
        }
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);

        const todayRecords = await AttendanceRecord.find({
            sessionDate: { $gte: startOfToday, $lte: endOfToday }
        }).lean();

        const teacherMonitoring = teachers.map(t => {
            const assignedIds = (t.assignedClassIds || []).map(c => c._id.toString());
            const tRecords = todayRecords.filter(r => assignedIds.includes(r.classId?.toString()));

            let todayRegisterStatus = 'not_started';
            if (tRecords.some(r => r.status === 'draft')) {
                todayRegisterStatus = 'awaiting_submit';
            } else if (tRecords.some(r => r.status === 'submitted')) {
                todayRegisterStatus = 'submitted';
            }

            // Historical average for teacher's classes
            const histRecords = submittedRecords.filter(r => assignedIds.includes(r.classId?.toString()));
            let tHistTotal = 0, tHistAtt = 0;
            histRecords.forEach(r => {
                r.entries.forEach(e => {
                    tHistTotal++;
                    if (e.status === 'present' || e.status === 'late') tHistAtt++;
                });
            });

            return {
                teacherId: t._id,
                name: t.name,
                email: t.email,
                active: t.active !== false,
                subjects: t.subjects || [],
                assignedClasses: (t.assignedClassIds || []).map(c => c.name),
                assignedClassIds: assignedIds,
                attendancePercent: tHistTotal > 0 ? Math.round((tHistAtt / tHistTotal) * 100) : 100,
                todayRegisterStatus
            };
        });

        // 6. "Needs Your Attention" Operational Flags
        const draftAttendance = await AttendanceRecord.find({ status: 'draft' }).populate('classId', 'name').lean();
        const draftCourses = await Course.find({ status: 'draft' }).populate('teacherId', 'name').lean();

        const attentionList = [];
        draftAttendance.forEach(da => {
            attentionList.push({
                type: "attendance_awaiting_submit",
                title: `Attendance draft pending submission: ${da.classId?.name || 'Class'} (${da.sessionSubject || 'Session'})`,
                recordId: da._id,
                classId: da.classId?._id,
                date: da.sessionDate
            });
        });

        draftCourses.forEach(dc => {
            attentionList.push({
                type: "course_ready_to_launch",
                title: `Course draft ready for launch: ${dc.code} - ${dc.name} (Lead: ${dc.teacherId?.name || 'Unassigned'})`,
                recordId: dc._id,
                courseId: dc._id
            });
        });

        // 7. Individual Student Monitoring (if studentId provided)
        let studentDetail = null;
        if (studentId && mongoose.Types.ObjectId.isValid(studentId)) {
            const st = await Student.findById(studentId).populate('classId', 'name term').lean();
            if (st) {
                const [att, perf] = await Promise.all([
                    calculateStudentAttendance(st._id, st.classId?._id),
                    calculateStudentPerformance(st._id)
                ]);
                studentDetail = {
                    student: st,
                    attendancePercent: att.attendanceRate,
                    overallScorePercent: perf.overallScorePercent,
                    growth: perf.growth
                };
            }
        }

        return res.status(200).json({
            message: "Admin overview data fetched successfully",
            stats: {
                activeStudentCount,
                activeTeacherCount,
                totalClassesCount,
                pendingEnrollmentsCount,
                instituteAttendancePercent,
                institutePerformancePercent
            },
            growthAndPerformanceTrend: trend,
            attendanceByClass,
            teacherMonitoring,
            needsYourAttention: attentionList,
            individualStudentMonitoring: studentDetail
        });

    } catch (error) {
        console.error('[getAdminOverview Error]', error);
        return res.status(500).json({ message: "Failed to fetch admin overview", error: error.message });
    }
};

/**
 * GET /api/admin/classes
 * All classes/sections institute-wide
 */
export const getAllAdminClasses = async (req, res) => {
    try {
        const classes = await ClassGroup.find({})
            .populate('teacherIds', 'name email subjects')
            .lean();

        const data = await Promise.all(classes.map(async (cls) => {
            const studentCount = await Student.countDocuments({ classId: cls._id, enrollmentStatus: { $ne: 'archived' } });
            return {
                id: cls._id,
                name: cls.name,
                term: cls.term,
                academicTerm: cls.academicTerm || cls.term,
                capacity: cls.capacity || 30,
                attendanceMinimumPercent: cls.attendanceMinimumPercent || 85,
                studentCount,
                teachers: cls.teacherIds || []
            };
        }));

        return res.status(200).json({
            message: "Classes fetched successfully",
            classes: data
        });
    } catch (error) {
        console.error('[getAllAdminClasses Error]', error);
        return res.status(500).json({ message: "Failed to fetch classes", error: error.message });
    }
};

/* ==========================================================================
   11.2 SCHEDULE MANAGEMENT
   ========================================================================== */

/**
 * GET /api/admin/schedule?classId=&teacherId=&room=&weekStart=
 */
export const getAdminSchedule = async (req, res) => {
    try {
        const { classId, teacherId, room, weekStart } = req.query;

        const baseDate = weekStart ? new Date(weekStart) : new Date();
        const dayOfWeek = baseDate.getDay();
        const diffToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
        const monday = new Date(baseDate);
        monday.setDate(baseDate.getDate() + diffToMonday);
        monday.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(monday);
        endOfWeek.setDate(monday.getDate() + 7);

        const filter = {
            date: { $gte: monday, $lt: endOfWeek },
            status: { $ne: 'cancelled' }
        };

        if (classId) {
            if (!mongoose.Types.ObjectId.isValid(classId)) return res.status(404).json({ message: "Class not found." });
            filter.classId = classId;
        }
        if (teacherId) {
            if (!mongoose.Types.ObjectId.isValid(teacherId)) return res.status(404).json({ message: "Teacher not found." });
            filter.teacherId = teacherId;
        }
        if (room) {
            filter.room = new RegExp(room.trim(), 'i');
        }

        const sessions = await ClassSession.find(filter)
            .populate('classId', 'name')
            .populate('courseId', 'name code')
            .populate('teacherId', 'name email')
            .sort({ date: 1, startTime: 1 })
            .lean();

        // Also fetch any assessments scheduled in that week
        const assessFilter = { date: { $gte: monday, $lt: endOfWeek } };
        if (classId) assessFilter.classId = classId;
        const assessments = await Assessment.find(assessFilter).populate('classId', 'name').lean();

        return res.status(200).json({
            message: "Schedule fetched successfully",
            weekStart: monday.toISOString().slice(0, 10),
            sessions,
            assessments
        });

    } catch (error) {
        console.error('[getAdminSchedule Error]', error);
        return res.status(500).json({ message: "Failed to fetch schedule", error: error.message });
    }
};

/**
 * POST /api/admin/schedule/sessions
 * Conflict-checked create session with optional weekly repeat
 */
export const createAdminSession = async (req, res) => {
    try {
        const {
            classId,
            courseId,
            teacherId,
            date,
            startTime,
            endTime,
            room,
            topic,
            type = 'regular',
            repeatWeekly = false,
            repeatDays = [],
            recurrenceEndDate
        } = req.body;

        if (!classId || !teacherId || !date || !startTime || !endTime || !room) {
            return res.status(400).json({ message: "classId, teacherId, date, startTime, endTime, and room are required." });
        }

        // Validate references (acceptance criterion: 404 on nonexistent referenced ID)
        const [cls, teacher, course] = await Promise.all([
            ClassGroup.findById(classId),
            User.findOne({ _id: teacherId, role: 'teacher' }),
            courseId ? Course.findById(courseId) : Promise.resolve(null)
        ]);

        if (!cls) return res.status(404).json({ message: "Referenced classId not found." });
        if (!teacher) return res.status(404).json({ message: "Referenced teacherId not found." });
        if (courseId && !course) return res.status(404).json({ message: "Referenced courseId not found." });

        // Conflict check on the initial session
        const conflict = await checkScheduleConflict({
            teacherId,
            room,
            date,
            startTime,
            endTime
        });

        if (conflict.hasConflict) {
            return res.status(409).json({
                message: "Schedule conflict detected.",
                conflictReason: conflict.clashReason,
                clashingSession: conflict.clashingSession
            });
        }

        const recurrenceGroupId = repeatWeekly ? new mongoose.Types.ObjectId().toString() : null;

        const mainSession = await ClassSession.create({
            classId,
            courseId: courseId || undefined,
            teacherId,
            date: new Date(date),
            startTime,
            endTime,
            room,
            topic: topic || '',
            type,
            repeatWeekly,
            repeatDays,
            recurrenceGroupId,
            recurrenceEndDate: recurrenceEndDate ? new Date(recurrenceEndDate) : undefined,
            status: 'scheduled'
        });

        // Recurrence generation
        const generatedSessions = [mainSession];
        if (repeatWeekly && recurrenceEndDate) {
            const endDate = new Date(recurrenceEndDate);
            let cur = new Date(date);
            cur.setDate(cur.getDate() + 7);

            while (cur <= endDate) {
                const repConflict = await checkScheduleConflict({
                    teacherId,
                    room,
                    date: cur,
                    startTime,
                    endTime
                });

                if (!repConflict.hasConflict) {
                    const inst = await ClassSession.create({
                        classId,
                        courseId: courseId || undefined,
                        teacherId,
                        date: new Date(cur),
                        startTime,
                        endTime,
                        room,
                        topic: topic || '',
                        type,
                        repeatWeekly: true,
                        recurrenceGroupId,
                        recurrenceEndDate: endDate,
                        status: 'scheduled'
                    });
                    generatedSessions.push(inst);
                }
                cur.setDate(cur.getDate() + 7);
            }
        }

        // Notify affected users
        await emitSessionNotification(
            mainSession._id,
            classId,
            teacherId,
            `New session scheduled: "${topic || course?.name || 'Class'}" on ${new Date(date).toLocaleDateString()} at ${startTime} in ${room}.`
        );

        return res.status(201).json({
            message: "Class session created successfully",
            session: mainSession,
            totalCreated: generatedSessions.length
        });

    } catch (error) {
        console.error('[createAdminSession Error]', error);
        return res.status(500).json({ message: "Failed to create session", error: error.message });
    }
};

/**
 * PUT /api/admin/schedule/sessions/:id?applyTo=this|all
 */
export const updateAdminSession = async (req, res) => {
    try {
        const { id } = req.params;
        const { applyTo = 'this' } = req.query;
        const updateData = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ message: "Session not found." });
        }

        const session = await ClassSession.findById(id);
        if (!session) {
            return res.status(404).json({ message: "Session not found." });
        }

        const targetTeacherId = updateData.teacherId || session.teacherId;
        const targetRoom = updateData.room || session.room;
        const targetDate = updateData.date || session.date;
        const targetStart = updateData.startTime || session.startTime;
        const targetEnd = updateData.endTime || session.endTime;

        // Conflict check
        const conflict = await checkScheduleConflict({
            teacherId: targetTeacherId,
            room: targetRoom,
            date: targetDate,
            startTime: targetStart,
            endTime: targetEnd,
            excludeSessionId: session._id
        });

        if (conflict.hasConflict) {
            return res.status(409).json({
                message: "Schedule conflict detected.",
                conflictReason: conflict.clashReason,
                clashingSession: conflict.clashingSession
            });
        }

        if (applyTo === 'all' && session.recurrenceGroupId) {
            await ClassSession.updateMany(
                { recurrenceGroupId: session.recurrenceGroupId, date: { $gte: session.date } },
                {
                    $set: {
                        startTime: targetStart,
                        endTime: targetEnd,
                        room: targetRoom,
                        topic: updateData.topic ?? session.topic
                    }
                }
            );
        } else {
            Object.assign(session, updateData);
            await session.save();
        }

        // Notify
        await emitSessionNotification(
            session._id,
            session.classId,
            targetTeacherId,
            `Schedule updated for session on ${new Date(targetDate).toLocaleDateString()} (${targetStart} - ${targetEnd}, Room: ${targetRoom}).`
        );

        return res.status(200).json({
            message: `Session updated successfully (${applyTo === 'all' ? 'series' : 'single occurrence'})`,
            session
        });

    } catch (error) {
        console.error('[updateAdminSession Error]', error);
        return res.status(500).json({ message: "Failed to update session", error: error.message });
    }
};

/**
 * DELETE /api/admin/schedule/sessions/:id?applyTo=this|all
 */
export const deleteAdminSession = async (req, res) => {
    try {
        const { id } = req.params;
        const { applyTo = 'this' } = req.query;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ message: "Session not found." });
        }

        const session = await ClassSession.findById(id);
        if (!session) {
            return res.status(404).json({ message: "Session not found." });
        }

        if (applyTo === 'all' && session.recurrenceGroupId) {
            await ClassSession.deleteMany({
                recurrenceGroupId: session.recurrenceGroupId,
                date: { $gte: session.date }
            });
        } else {
            await ClassSession.findByIdAndDelete(id);
        }

        await emitSessionNotification(
            session._id,
            session.classId,
            session.teacherId,
            `Session scheduled on ${new Date(session.date).toLocaleDateString()} at ${session.startTime} has been cancelled.`
        );

        return res.status(200).json({
            message: `Session deleted successfully (${applyTo === 'all' ? 'series' : 'single occurrence'})`
        });

    } catch (error) {
        console.error('[deleteAdminSession Error]', error);
        return res.status(500).json({ message: "Failed to delete session", error: error.message });
    }
};

/**
 * POST /api/admin/schedule/assessments
 * Schedules an assessment session which overlays regular class
 */
export const scheduleAssessmentSession = async (req, res) => {
    try {
        const { classId, subject, name, maxScore = 100, date, startTime, endTime, room } = req.body;

        if (!classId || !subject || !name || !date) {
            return res.status(400).json({ message: "classId, subject, name, and date are required." });
        }

        const cls = await ClassGroup.findById(classId);
        if (!cls) return res.status(404).json({ message: "Referenced classId not found." });

        const assessment = await Assessment.create({
            classId,
            subject,
            name,
            maxScore,
            status: 'upcoming',
            date: new Date(date),
            startTime: startTime || "09:00",
            endTime: endTime || "11:00",
            room: room || "Main Exam Hall"
        });

        return res.status(201).json({
            message: "Assessment session scheduled successfully",
            assessment
        });

    } catch (error) {
        console.error('[scheduleAssessmentSession Error]', error);
        return res.status(500).json({ message: "Failed to schedule assessment", error: error.message });
    }
};

/**
 * GET /api/admin/schedule/export
 */
export const exportSchedule = async (req, res) => {
    try {
        const sessions = await ClassSession.find({ status: { $ne: 'cancelled' } })
            .populate('classId', 'name')
            .populate('courseId', 'code name')
            .populate('teacherId', 'name')
            .sort({ date: 1, startTime: 1 })
            .lean();

        const headers = ["Date", "Class", "Course", "Teacher", "Start Time", "End Time", "Room", "Topic", "Type"];
        const rows = sessions.map(s => [
            `"${new Date(s.date).toISOString().slice(0, 10)}"`,
            `"${s.classId?.name || ''}"`,
            `"${s.courseId?.code || ''}"`,
            `"${s.teacherId?.name || ''}"`,
            `"${s.startTime}"`,
            `"${s.endTime}"`,
            `"${s.room}"`,
            `"${(s.topic || '').replace(/"/g, '""')}"`,
            `"${s.type}"`
        ]);

        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="institute-schedule.csv"');
        return res.status(200).send(csv);

    } catch (error) {
        console.error('[exportSchedule Error]', error);
        return res.status(500).json({ message: "Failed to export schedule", error: error.message });
    }
};

/* ==========================================================================
   11.3 COURSES & SECTIONS
   ========================================================================== */

/**
 * GET /api/admin/courses?status=&term=&grade=
 */
export const getAdminCourses = async (req, res) => {
    try {
        const { status, term, grade } = req.query;
        const filter = {};
        if (status) filter.status = status;
        if (term) filter.term = term;

        const [courses, activeCount, draftCount, archivedCount] = await Promise.all([
            Course.find(filter).populate('teacherId', 'name email').lean(),
            Course.countDocuments({ status: 'active' }),
            Course.countDocuments({ status: 'draft' }),
            Course.countDocuments({ status: 'archived' })
        ]);

        return res.status(200).json({
            message: "Courses fetched successfully",
            summary: { activeCount, draftCount, archivedCount },
            courses
        });

    } catch (error) {
        console.error('[getAdminCourses Error]', error);
        return res.status(500).json({ message: "Failed to fetch courses", error: error.message });
    }
};

/**
 * POST /api/admin/courses
 */
export const createAdminCourse = async (req, res) => {
    try {
        const { code, name, term, teacherId, credits, description, lessons } = req.body;

        if (!code || !name) {
            return res.status(400).json({ message: "Course code and name are required." });
        }

        if (teacherId) {
            if (!mongoose.Types.ObjectId.isValid(teacherId)) return res.status(404).json({ message: "Invalid teacherId." });
            const teacher = await User.findOne({ _id: teacherId, role: 'teacher' });
            if (!teacher) return res.status(404).json({ message: "Referenced teacherId not found." });
        }

        const course = await Course.create({
            code,
            name,
            term: term || "Term 1 2026",
            teacherId: teacherId || undefined,
            credits: credits || 3,
            description: description || '',
            status: 'draft',
            lessons: lessons || [],
            studentElementsVisibility: {
                attendanceSchedule: true,
                growthPerformance: true,
                examResults: true,
                learningResources: true
            }
        });

        return res.status(201).json({
            message: "Course created in draft status",
            course
        });

    } catch (error) {
        console.error('[createAdminCourse Error]', error);
        return res.status(500).json({ message: "Failed to create course", error: error.message });
    }
};

/**
 * PUT /api/admin/courses/:id
 * Includes visibility toggles and general course updates
 */
export const updateAdminCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ message: "Course not found." });
        }

        if (updateData.teacherId) {
            const teacher = await User.findOne({ _id: updateData.teacherId, role: 'teacher' });
            if (!teacher) return res.status(404).json({ message: "Referenced teacherId not found." });
        }

        const course = await Course.findById(id);
        if (!course) return res.status(404).json({ message: "Course not found." });

        if (updateData.studentElementsVisibility) {
            course.studentElementsVisibility = {
                ...course.studentElementsVisibility?.toObject?.() || {},
                ...updateData.studentElementsVisibility
            };
            delete updateData.studentElementsVisibility;
        }

        Object.assign(course, updateData);
        await course.save();

        return res.status(200).json({
            message: "Course updated successfully",
            course
        });

    } catch (error) {
        console.error('[updateAdminCourse Error]', error);
        return res.status(500).json({ message: "Failed to update course", error: error.message });
    }
};

/**
 * POST /api/admin/courses/:id/launch
 * Flips draft to active if lead teacher and at least 1 section/enrollment exists
 */
export const launchCourse = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ message: "Course not found." });
        }

        const course = await Course.findById(id);
        if (!course) return res.status(404).json({ message: "Course not found." });

        if (!course.teacherId) {
            return res.status(400).json({ message: "Cannot launch course: A lead teacher must be assigned." });
        }

        // Check if at least one class or enrollment exists
        const [enrollmentCount, classCount] = await Promise.all([
            Enrollment.countDocuments({ courseId: course._id }),
            ClassGroup.countDocuments({})
        ]);

        if (enrollmentCount === 0 && classCount === 0) {
            return res.status(400).json({ message: "Cannot launch course: At least one section or enrollment must exist." });
        }

        course.status = 'active';
        await course.save();

        return res.status(200).json({
            message: "Course launched successfully and is now active",
            course
        });

    } catch (error) {
        console.error('[launchCourse Error]', error);
        return res.status(500).json({ message: "Failed to launch course", error: error.message });
    }
};

/**
 * POST /api/admin/sections
 */
export const createAdminSection = async (req, res) => {
    try {
        const { name, term, academicTerm, capacity = 30, attendanceMinimumPercent = 85, teacherIds = [] } = req.body;

        if (!name) return res.status(400).json({ message: "Section name is required." });

        // Validate teacher IDs
        if (teacherIds.length > 0) {
            const validTeachers = await User.countDocuments({ _id: { $in: teacherIds }, role: 'teacher' });
            if (validTeachers !== teacherIds.length) {
                return res.status(404).json({ message: "One or more teacher IDs not found." });
            }
        }

        const section = await ClassGroup.create({
            name,
            term: term || academicTerm || 'Term 1 2026',
            academicTerm: academicTerm || term || 'Term 1 2026',
            capacity,
            attendanceMinimumPercent,
            teacherIds
        });

        return res.status(201).json({
            message: "Section created successfully",
            section
        });

    } catch (error) {
        console.error('[createAdminSection Error]', error);
        return res.status(500).json({ message: "Failed to create section", error: error.message });
    }
};

/**
 * PUT /api/admin/sections/:id
 */
export const updateAdminSection = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ message: "Section not found." });
        }

        const section = await ClassGroup.findById(id);
        if (!section) return res.status(404).json({ message: "Section not found." });

        Object.assign(section, updateData);
        await section.save();

        return res.status(200).json({
            message: "Section updated successfully",
            section
        });

    } catch (error) {
        console.error('[updateAdminSection Error]', error);
        return res.status(500).json({ message: "Failed to update section", error: error.message });
    }
};

/* ==========================================================================
   11.4 STUDENTS & TEACHERS DIRECTORIES
   ========================================================================== */

/**
 * GET /api/admin/students?search=&classId=&status=&page=&limit=
 */
export const getAdminStudents = async (req, res) => {
    try {
        const { search, classId, status, page = 1, limit = 20 } = req.query;
        const filter = {};

        if (status) filter.enrollmentStatus = status;
        if (classId) {
            if (!mongoose.Types.ObjectId.isValid(classId)) return res.status(404).json({ message: "Class not found." });
            filter.classId = classId;
        }

        if (search && search.trim()) {
            const regex = new RegExp(search.trim(), 'i');
            filter.$or = [{ name: regex }, { studentCode: regex }];
        }

        const p = Math.max(1, parseInt(page, 10));
        const l = Math.max(1, parseInt(limit, 10));

        const [students, total] = await Promise.all([
            Student.find(filter)
                .populate('classId', 'name term')
                .skip((p - 1) * l)
                .limit(l)
                .lean(),
            Student.countDocuments(filter)
        ]);

        const list = await Promise.all(students.map(async (s) => {
            const [att, perf] = await Promise.all([
                calculateStudentAttendance(s._id, s.classId?._id),
                calculateStudentPerformance(s._id)
            ]);
            return {
                id: s._id,
                name: s.name,
                studentCode: s.studentCode,
                class: s.classId,
                status: s.enrollmentStatus,
                enrollmentDate: s.enrollmentDate,
                attendancePercent: att.attendanceRate,
                overallScorePercent: perf.overallScorePercent,
                growth: perf.growth
            };
        }));

        return res.status(200).json({
            message: "Students directory fetched successfully",
            students: list,
            pagination: {
                totalStudents: total,
                currentPage: p,
                limit: l,
                totalPages: Math.ceil(total / l)
            }
        });

    } catch (error) {
        console.error('[getAdminStudents Error]', error);
        return res.status(500).json({ message: "Failed to fetch students directory", error: error.message });
    }
};

/**
 * POST /api/admin/students
 * Add student (if no class assigned -> status 'pending', if class assigned -> status 'enrolled')
 */
export const createAdminStudent = async (req, res) => {
    try {
        const { name, studentCode, classId, enrolledSubjects = [], email, password } = req.body;

        if (!name) return res.status(400).json({ message: "Student name is required." });

        let cls = null;
        if (classId) {
            if (!mongoose.Types.ObjectId.isValid(classId)) return res.status(404).json({ message: "Referenced classId not found." });
            cls = await ClassGroup.findById(classId);
            if (!cls) return res.status(404).json({ message: "Referenced classId not found." });
        }

        const code = studentCode ? studentCode.toUpperCase().trim() : `STU-${Math.floor(1000 + Math.random() * 9000)}`;
        const studentEmail = email ? email.toLowerCase().trim() : `${code.toLowerCase()}@student.aster.edu`;
        const studentPasswordHash = await bcrypt.hash(password || 'Password123!', 10);

        const enrollmentStatus = cls ? 'enrolled' : 'pending';

        const student = await Student.create({
            name: name.trim(),
            studentCode: code,
            classId: cls ? cls._id : undefined,
            enrolledSubjects,
            enrollmentStatus
        });

        const user = await User.create({
            name: name.trim(),
            email: studentEmail,
            passwordHash: studentPasswordHash,
            role: 'student'
        });

        student.userId = user._id;
        await student.save();

        if (cls) {
            cls.studentIds.push(student._id);
            await cls.save();
        }

        return res.status(201).json({
            message: `Student created with status '${enrollmentStatus}'`,
            student: {
                id: student._id,
                name: student.name,
                studentCode: student.studentCode,
                status: student.enrollmentStatus,
                classId: student.classId
            }
        });

    } catch (error) {
        console.error('[createAdminStudent Error]', error);
        return res.status(500).json({ message: "Failed to add student", error: error.message });
    }
};

/**
 * PUT /api/admin/students/:id
 */
export const updateAdminStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ message: "Student not found." });
        }

        const student = await Student.findById(id);
        if (!student) return res.status(404).json({ message: "Student not found." });

        if (updateData.classId) {
            if (!mongoose.Types.ObjectId.isValid(updateData.classId)) {
                return res.status(404).json({ message: "Referenced classId not found." });
            }
            const cls = await ClassGroup.findById(updateData.classId);
            if (!cls) return res.status(404).json({ message: "Referenced classId not found." });

            if (student.enrollmentStatus === 'pending') {
                student.enrollmentStatus = 'enrolled';
            }
        }

        Object.assign(student, updateData);
        await student.save();

        return res.status(200).json({
            message: "Student updated successfully",
            student
        });

    } catch (error) {
        console.error('[updateAdminStudent Error]', error);
        return res.status(500).json({ message: "Failed to update student", error: error.message });
    }
};

/**
 * PUT /api/admin/students/:id/archive (Soft delete)
 * Retains attendance, enrollment, and exam history; revokes access and excludes from active rosters
 */
export const archiveAdminStudent = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ message: "Student not found." });
        }

        const student = await Student.findById(id);
        if (!student) return res.status(404).json({ message: "Student not found." });

        student.enrollmentStatus = 'archived';
        await student.save();

        return res.status(200).json({
            message: "Student archived successfully. Historical attendance and exam records are preserved.",
            student
        });

    } catch (error) {
        console.error('[archiveAdminStudent Error]', error);
        return res.status(500).json({ message: "Failed to archive student", error: error.message });
    }
};

/**
 * PUT /api/admin/students/:id/restore
 */
export const restoreAdminStudent = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ message: "Student not found." });
        }

        const student = await Student.findById(id);
        if (!student) return res.status(404).json({ message: "Student not found." });

        student.enrollmentStatus = student.classId ? 'enrolled' : 'pending';
        await student.save();

        return res.status(200).json({
            message: "Student restored successfully",
            student
        });

    } catch (error) {
        console.error('[restoreAdminStudent Error]', error);
        return res.status(500).json({ message: "Failed to restore student", error: error.message });
    }
};

/**
 * GET /api/admin/teachers?search=&subject=&classId=&status=
 */
export const getAdminTeachers = async (req, res) => {
    try {
        const { search, subject, classId, status } = req.query;
        const filter = { role: 'teacher' };

        if (status === 'active') filter.active = true;
        else if (status === 'inactive') filter.active = false;

        if (classId) {
            if (!mongoose.Types.ObjectId.isValid(classId)) return res.status(404).json({ message: "Class not found." });
            filter.assignedClassIds = classId;
        }

        if (subject) {
            filter.subjects = { $in: [new RegExp(subject.trim(), 'i')] };
        }

        if (search && search.trim()) {
            const regex = new RegExp(search.trim(), 'i');
            filter.$or = [{ name: regex }, { email: regex }];
        }

        let teachers = await Teacher.find(filter)
            .populate('assignedClassIds', 'name term')
            .lean();

        if (!teachers || teachers.length === 0) {
            // Fallback for legacy database records
            const userFilter = { ...filter, role: 'teacher' };
            teachers = await User.find(userFilter)
                .select('-passwordHash')
                .populate('assignedClassIds', 'name term')
                .lean();
        }

        return res.status(200).json({
            message: "Teachers directory fetched successfully",
            teachers
        });

    } catch (error) {
        console.error('[getAdminTeachers Error]', error);
        return res.status(500).json({ message: "Failed to fetch teachers directory", error: error.message });
    }
};

/**
 * POST /api/admin/teachers
 */
export const createAdminTeacher = async (req, res) => {
    try {
        const { name, email, password, subjects = [], assignedClassIds = [] } = req.body;

        if (!name || !email) {
            return res.status(400).json({ message: "Teacher name and email are required." });
        }

        if (assignedClassIds.length > 0) {
            const valid = await ClassGroup.countDocuments({ _id: { $in: assignedClassIds } });
            if (valid !== assignedClassIds.length) {
                return res.status(404).json({ message: "One or more assignedClassIds not found." });
            }
        }

        const existing = await User.findOne({ email: email.toLowerCase().trim() });
        if (existing) {
            return res.status(409).json({ message: "Email is already registered." });
        }

        const hash = await bcrypt.hash(password || 'Password123!', 10);
        const user = await User.create({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            passwordHash: hash,
            role: 'teacher',
            active: true
        });

        const teacher = await Teacher.create({
            userId: user._id,
            name: user.name,
            email: user.email,
            active: true,
            subjects,
            assignedClassIds
        });

        if (assignedClassIds.length > 0) {
            await ClassGroup.updateMany(
                { _id: { $in: assignedClassIds } },
                { $addToSet: { teacherIds: user._id } }
            );
        }

        return res.status(201).json({
            message: "Teacher created successfully",
            teacher: {
                id: teacher._id,
                userId: user._id,
                name: teacher.name,
                email: teacher.email,
                role: user.role,
                active: teacher.active,
                subjects: teacher.subjects,
                assignedClassIds: teacher.assignedClassIds
            }
        });

    } catch (error) {
        console.error('[createAdminTeacher Error]', error);
        return res.status(500).json({ message: "Failed to add teacher", error: error.message });
    }
};

/**
 * PUT /api/admin/teachers/:id
 */
export const updateAdminTeacher = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ message: "Teacher not found." });
        }

        // Look up by Teacher ID or User ID
        let teacher = await Teacher.findOne({ $or: [{ _id: id }, { userId: id }] });
        let user = null;

        if (teacher) {
            user = await User.findById(teacher.userId);
        } else {
            user = await User.findOne({ _id: id, role: 'teacher' });
            if (user) {
                teacher = await Teacher.findOne({ userId: user._id });
            }
        }

        if (!teacher && !user) return res.status(404).json({ message: "Teacher not found." });

        if (updateData.assignedClassIds) {
            const valid = await ClassGroup.countDocuments({ _id: { $in: updateData.assignedClassIds } });
            if (valid !== updateData.assignedClassIds.length) {
                return res.status(404).json({ message: "One or more assignedClassIds not found." });
            }
        }

        if (teacher) {
            Object.assign(teacher, updateData);
            await teacher.save();
        }

        if (user) {
            if (updateData.name) user.name = updateData.name;
            if (updateData.email) user.email = updateData.email;
            if (updateData.active !== undefined) user.active = updateData.active;
            await user.save();
        }

        return res.status(200).json({
            message: "Teacher updated successfully",
            teacher: {
                id: teacher ? teacher._id : user._id,
                name: teacher ? teacher.name : user.name,
                email: teacher ? teacher.email : user.email,
                active: teacher ? teacher.active : user.active,
                subjects: teacher ? teacher.subjects : (user.get('subjects') || []),
                assignedClassIds: teacher ? teacher.assignedClassIds : (user.get('assignedClassIds') || [])
            }
        });

    } catch (error) {
        console.error('[updateAdminTeacher Error]', error);
        return res.status(500).json({ message: "Failed to update teacher", error: error.message });
    }
};

/**
 * PUT /api/admin/teachers/:id/deactivate (Soft delete)
 * Preserves attendance and exam history, revokes access
 */
export const deactivateAdminTeacher = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ message: "Teacher not found." });
        }

        let teacher = await Teacher.findOne({ $or: [{ _id: id }, { userId: id }] });
        let user = null;

        if (teacher) {
            user = await User.findById(teacher.userId);
        } else {
            user = await User.findOne({ _id: id, role: 'teacher' });
            if (user) {
                teacher = await Teacher.findOne({ userId: user._id });
            }
        }

        if (!teacher && !user) return res.status(404).json({ message: "Teacher not found." });

        if (teacher) {
            teacher.active = false;
            await teacher.save();
        }

        if (user) {
            user.active = false;
            await user.save();
        }

        return res.status(200).json({
            message: "Teacher deactivated successfully. All past records remain intact.",
            teacher: {
                id: teacher ? teacher._id : user._id,
                name: teacher ? teacher.name : user.name,
                active: false
            }
        });

    } catch (error) {
        console.error('[deactivateAdminTeacher Error]', error);
        return res.status(500).json({ message: "Failed to deactivate teacher", error: error.message });
    }
};

/**
 * PUT /api/admin/teachers/:id/activate
 */
export const activateAdminTeacher = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ message: "Teacher not found." });
        }

        let teacher = await Teacher.findOne({ $or: [{ _id: id }, { userId: id }] });
        let user = null;

        if (teacher) {
            user = await User.findById(teacher.userId);
        } else {
            user = await User.findOne({ _id: id, role: 'teacher' });
            if (user) {
                teacher = await Teacher.findOne({ userId: user._id });
            }
        }

        if (!teacher && !user) return res.status(404).json({ message: "Teacher not found." });

        if (teacher) {
            teacher.active = true;
            await teacher.save();
        }

        if (user) {
            user.active = true;
            await user.save();
        }

        return res.status(200).json({
            message: "Teacher activated successfully",
            teacher: {
                id: teacher ? teacher._id : user._id,
                name: teacher ? teacher.name : user.name,
                active: true
            }
        });

    } catch (error) {
        console.error('[activateAdminTeacher Error]', error);
        return res.status(500).json({ message: "Failed to activate teacher", error: error.message });
    }
};

/**
 * GET /api/admin/directory/export?type=students|teachers
 */
export const exportDirectory = async (req, res) => {
    try {
        const { type = 'students' } = req.query;

        if (type === 'teachers') {
            let teachers = await Teacher.find({}).populate('assignedClassIds', 'name').lean();
            if (!teachers || teachers.length === 0) {
                teachers = await User.find({ role: 'teacher' }).populate('assignedClassIds', 'name').lean();
            }
            const headers = ["Name", "Email", "Status", "Subjects", "Assigned Classes"];
            const rows = teachers.map(t => [
                `"${t.name}"`,
                `"${t.email}"`,
                t.active !== false ? "Active" : "Inactive",
                `"${(t.subjects || []).join('; ')}"`,
                `"${(t.assignedClassIds || []).map(c => c.name).join('; ')}"`
            ]);

            const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="teachers-directory.csv"');
            return res.status(200).send(csv);
        } else {
            const students = await Student.find({}).populate('classId', 'name').lean();
            const headers = ["Student ID", "Name", "Status", "Class", "Enrolled Date"];
            const rows = students.map(s => [
                `"${s.studentCode}"`,
                `"${s.name}"`,
                `"${s.enrollmentStatus}"`,
                `"${s.classId?.name || 'Unassigned'}"`,
                `"${s.enrollmentDate ? new Date(s.enrollmentDate).toISOString().slice(0, 10) : new Date(s.createdAt || Date.now()).toISOString().slice(0, 10)}"`
            ]);

            const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="students-directory.csv"');
            return res.status(200).send(csv);
        }

    } catch (error) {
        console.error('[exportDirectory Error]', error);
        return res.status(500).json({ message: "Failed to export directory", error: error.message });
    }
};

export default {
    getAdminOverview,
    getAllAdminClasses,
    getAdminSchedule,
    createAdminSession,
    updateAdminSession,
    deleteAdminSession,
    scheduleAssessmentSession,
    exportSchedule,
    getAdminCourses,
    createAdminCourse,
    updateAdminCourse,
    launchCourse,
    createAdminSection,
    updateAdminSection,
    getAdminStudents,
    createAdminStudent,
    updateAdminStudent,
    archiveAdminStudent,
    restoreAdminStudent,
    getAdminTeachers,
    createAdminTeacher,
    updateAdminTeacher,
    deactivateAdminTeacher,
    activateAdminTeacher,
    exportDirectory
};
