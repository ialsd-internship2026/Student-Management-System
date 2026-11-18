import AttendanceRecord from '../models/attendanceRecord.model.js';
import Assessment from '../models/assessment.model.js';
import Result from '../models/result.model.js';
import Student from '../models/student.model.js';
import PracticeActivity from '../models/practiceActivity.model.js';

/**
 * Calculate attendance metrics for a single student or a list of students
 * Only includes records with status === 'submitted'
 */
export const calculateStudentAttendance = async (studentId, classId) => {
    const filter = { status: 'submitted' };
    if (classId) filter.classId = classId;

    const records = await AttendanceRecord.find(filter).lean();
    let totalSessions = 0;
    let presentCount = 0;
    let lateCount = 0;
    let absentCount = 0;

    for (const record of records) {
        const entry = record.entries.find(e => e.studentId.toString() === studentId.toString());
        if (entry) {
            totalSessions++;
            if (entry.status === 'present') presentCount++;
            else if (entry.status === 'late') lateCount++;
            else if (entry.status === 'absent') absentCount++;
        }
    }

    const attendanceRate = totalSessions > 0
        ? Math.round(((presentCount + lateCount) / totalSessions) * 100)
        : 100;

    return {
        totalSessions,
        presentCount,
        lateCount,
        absentCount,
        attendanceRate,
        inGoodStanding: attendanceRate >= 85
    };
};

/**
 * Calculate student score metrics: overallScorePercent, growth, and subject breakdown
 */
export const calculateStudentPerformance = async (studentId) => {
    const results = await Result.find({ studentId })
        .populate('assessmentId')
        .sort({ createdAt: 1 })
        .lean();

    if (!results || results.length === 0) {
        return {
            overallScorePercent: 0,
            growth: 0,
            resultsCount: 0,
            subjectBreakdown: {},
            resultsList: []
        };
    }

    let totalPct = 0;
    let validResults = 0;
    const subjectMap = {};
    const formattedResults = [];

    for (const res of results) {
        const assessment = res.assessmentId;
        if (!assessment) continue;

        const maxScore = assessment.maxScore || 100;
        const pct = Math.round((res.score / maxScore) * 100);
        totalPct += pct;
        validResults++;

        const subj = assessment.subject || 'General';
        if (!subjectMap[subj]) {
            subjectMap[subj] = { totalPct: 0, count: 0, scores: [] };
        }
        subjectMap[subj].totalPct += pct;
        subjectMap[subj].count += 1;
        subjectMap[subj].scores.push(pct);

        formattedResults.push({
            id: res._id,
            assessmentId: assessment._id,
            assessmentName: assessment.name,
            subject: subj,
            date: assessment.date || res.createdAt,
            score: res.score,
            maxScore,
            percentage: pct,
            grade: res.grade,
            feedbackText: res.feedbackText || '',
            status: assessment.status
        });
    }

    const overallScorePercent = validResults > 0 ? Math.round(totalPct / validResults) : 0;

    // Growth: difference between the latest result pct and earliest result pct
    let growth = 0;
    if (formattedResults.length >= 2) {
        const earliest = formattedResults[0].percentage;
        const latest = formattedResults[formattedResults.length - 1].percentage;
        growth = latest - earliest;
    }

    const subjectBreakdown = {};
    for (const [subj, data] of Object.entries(subjectMap)) {
        subjectBreakdown[subj] = {
            averagePercent: Math.round(data.totalPct / data.count),
            count: data.count
        };
    }

    return {
        overallScorePercent,
        growth,
        resultsCount: validResults,
        subjectBreakdown,
        resultsList: formattedResults
    };
};

/**
 * Compute class ranks and metrics for all students in a class
 */
export const calculateClassMetrics = async (classId, threshold = 75) => {
    const students = await Student.find({ classId }).lean();
    if (!students || students.length === 0) {
        return {
            studentsMetrics: [],
            classAttendancePercent: 0,
            classPerformancePercent: 0,
            studentsNeedingSupportCount: 0,
            totalStudents: 0
        };
    }

    // Get all submitted attendance for this class
    const attendanceRecords = await AttendanceRecord.find({
        classId,
        status: 'submitted'
    }).lean();

    // Map student attendance
    const attendanceMap = {};
    students.forEach(s => {
        attendanceMap[s._id.toString()] = { total: 0, attended: 0, present: 0, late: 0, absent: 0 };
    });

    attendanceRecords.forEach(rec => {
        rec.entries.forEach(entry => {
            const sid = entry.studentId.toString();
            if (attendanceMap[sid]) {
                attendanceMap[sid].total++;
                if (entry.status === 'present') {
                    attendanceMap[sid].present++;
                    attendanceMap[sid].attended++;
                } else if (entry.status === 'late') {
                    attendanceMap[sid].late++;
                    attendanceMap[sid].attended++;
                } else if (entry.status === 'absent') {
                    attendanceMap[sid].absent++;
                }
            }
        });
    });

    // Get all results for assessments belonging to this class
    const assessments = await Assessment.find({ classId }).select('_id maxScore subject date').lean();
    const assessmentIds = assessments.map(a => a._id);
    const results = await Result.find({ assessmentId: { $in: assessmentIds } }).lean();

    const resultMap = {};
    students.forEach(s => {
        resultMap[s._id.toString()] = { totalPct: 0, count: 0, scores: [] };
    });

    const assessMaxMap = {};
    assessments.forEach(a => { assessMaxMap[a._id.toString()] = a.maxScore || 100; });

    results.forEach(res => {
        const sid = res.studentId.toString();
        const max = assessMaxMap[res.assessmentId.toString()] || 100;
        const pct = Math.round((res.score / max) * 100);
        if (resultMap[sid]) {
            resultMap[sid].totalPct += pct;
            resultMap[sid].count++;
            resultMap[sid].scores.push(pct);
        }
    });

    let totalClassAttPct = 0;
    let totalClassScorePct = 0;
    let studentCountWithScores = 0;
    let needingSupportCount = 0;

    const studentsMetrics = students.map(student => {
        const sid = student._id.toString();
        const att = attendanceMap[sid];
        const res = resultMap[sid];

        const attendancePercent = att && att.total > 0
            ? Math.round((att.attended / att.total) * 100)
            : 100;

        const overallScorePercent = res && res.count > 0
            ? Math.round(res.totalPct / res.count)
            : 0;

        let growth = 0;
        if (res && res.scores.length >= 2) {
            growth = res.scores[res.scores.length - 1] - res.scores[0];
        }

        if (res && res.count > 0) {
            totalClassScorePct += overallScorePercent;
            studentCountWithScores++;
        }
        totalClassAttPct += attendancePercent;

        const needsSupport = attendancePercent < threshold || overallScorePercent < threshold;
        if (needsSupport) needingSupportCount++;

        return {
            studentId: student._id,
            name: student.name,
            studentCode: student.studentCode,
            classId: student.classId,
            enrolledSubjects: student.enrolledSubjects || [],
            attendancePercent,
            overallScorePercent,
            growth,
            needsSupport
        };
    });

    // Compute ranks based on overallScorePercent desc
    studentsMetrics.sort((a, b) => b.overallScorePercent - a.overallScorePercent);
    studentsMetrics.forEach((sm, index) => {
        sm.classRank = index + 1;
    });

    const totalStudents = students.length;
    const classAttendancePercent = totalStudents > 0 ? Math.round(totalClassAttPct / totalStudents) : 0;
    const classPerformancePercent = studentCountWithScores > 0 ? Math.round(totalClassScorePct / studentCountWithScores) : 0;

    return {
        studentsMetrics,
        classAttendancePercent,
        classPerformancePercent,
        studentsNeedingSupportCount: needingSupportCount,
        totalStudents
    };
};

/**
 * Calculate consecutive activity streak from PracticeActivity
 */
export const calculateStreak = async (studentId) => {
    const activities = await PracticeActivity.find({
        studentId,
        completed: true
    }).sort({ date: -1 }).lean();

    if (!activities || activities.length === 0) return 0;

    // Normalize dates to YYYY-MM-DD set
    const dateSet = new Set(
        activities.map(a => new Date(a.date).toISOString().slice(0, 10))
    );

    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    // If active today, start from today; else if active yesterday, start from yesterday
    let currentCheck = new Date();
    if (!dateSet.has(todayStr)) {
        if (!dateSet.has(yesterdayStr)) {
            return 0; // Streak broken
        }
        currentCheck = yesterday;
    }

    let streak = 0;
    while (true) {
        const checkStr = currentCheck.toISOString().slice(0, 10);
        if (dateSet.has(checkStr)) {
            streak++;
            currentCheck.setDate(currentCheck.getDate() - 1);
        } else {
            break;
        }
    }

    return streak;
};
