import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

import mongoose from 'mongoose';
import app from './src/app.js';
import connectDb from './src/config/db.js';
import ClassGroup from './src/models/classGroup.model.js';
import AttendanceRecord from './src/models/attendanceRecord.model.js';
import Student from './src/models/student.model.js';

let server;
let baseUrl;

async function startServer() {
    await connectDb();
    return new Promise((resolve) => {
        server = http.createServer(app);
        server.listen(0, '127.0.0.1', () => {
            const port = server.address().port;
            baseUrl = `http://127.0.0.1:${port}`;
            console.log(`[Test Server] Running at ${baseUrl}`);
            resolve();
        });
    });
}

async function stopServer() {
    if (server) {
        await new Promise(resolve => server.close(resolve));
    }
    await mongoose.disconnect();
}

async function post(endpoint, body, token) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${baseUrl}${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
    });
    const text = await res.text();
    try {
        return { status: res.status, data: JSON.parse(text), headers: res.headers };
    } catch {
        return { status: res.status, raw: text, headers: res.headers };
    }
}

async function put(endpoint, body, token) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${baseUrl}${endpoint}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(body)
    });
    const text = await res.text();
    try {
        return { status: res.status, data: JSON.parse(text), headers: res.headers };
    } catch {
        return { status: res.status, raw: text, headers: res.headers };
    }
}

async function get(endpoint, token) {
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${baseUrl}${endpoint}`, {
        method: 'GET',
        headers
    });
    const text = await res.text();
    try {
        return { status: res.status, data: JSON.parse(text), headers: res.headers };
    } catch {
        return { status: res.status, raw: text, headers: res.headers };
    }
}

function assert(condition, message) {
    if (!condition) {
        console.error(`❌ FAILED: ${message}`);
        throw new Error(message);
    } else {
        console.log(`✅ PASSED: ${message}`);
    }
}

async function runTests() {
    try {
        await startServer();

        console.log('\n=============================================');
        console.log('1. AUTHENTICATION & LOGIN TESTS');
        console.log('=============================================');

        // Teacher 1 (Sarah Jenkins) - assigned to 10A and 10B
        const teacherLogin = await post('/api/auth/login', {
            email: 'sarah.jenkins@aster.edu',
            password: 'Password123!'
        });
        assert(teacherLogin.status === 200, 'Teacher Sarah Jenkins login successful (200)');
        const teacherToken = teacherLogin.data.token;
        assert(teacherLogin.data.user.role === 'teacher', 'User role is teacher');
        assert(Array.isArray(teacherLogin.data.user.assignedClassIds), 'Assigned class IDs present in teacher response');

        // Teacher 2 (Marcus Vance) - assigned to 10A only
        const marcusLogin = await post('/api/auth/login', {
            email: 'marcus.vance@aster.edu',
            password: 'Password123!'
        });
        assert(marcusLogin.status === 200, 'Teacher Marcus Vance login successful (200)');
        const marcusToken = marcusLogin.data.token;

        // Student (Alex Mercer)
        const studentLogin = await post('/api/auth/login', {
            email: 'alex.mercer@student.aster.edu',
            password: 'Password123!'
        });
        assert(studentLogin.status === 200, 'Student Alex Mercer login successful (200)');
        const studentToken = studentLogin.data.token;
        assert(studentLogin.data.user.role === 'student', 'User role is student');
        assert(!!studentLogin.data.user.studentId, 'Student has linked studentId');

        // Fetch Class IDs from DB
        const class10A = await ClassGroup.findOne({ name: 'Grade 10-A' });
        const class10B = await ClassGroup.findOne({ name: 'Grade 10-B' });
        const class11A = await ClassGroup.findOne({ name: 'Grade 11-A' });
        assert(!!class10A && !!class10B && !!class11A, 'Classes Grade 10-A, 10-B, 11-A exist');

        console.log('\n=============================================');
        console.log('2. TEACHER ACCESS BOUNDARY & SECURITY TESTS');
        console.log('=============================================');

        // Teacher Sarah accesses assigned class 10-A -> 200
        const sarah10A = await get(`/api/teacher/overview?classId=${class10A._id}`, teacherToken);
        assert(sarah10A.status === 200, 'Sarah can access assigned class Grade 10-A (200)');

        // Teacher Sarah accesses assigned class 10-B -> 200
        const sarah10B = await get(`/api/teacher/overview?classId=${class10B._id}`, teacherToken);
        assert(sarah10B.status === 200, 'Sarah can access assigned class Grade 10-B (200)');

        // Teacher Sarah tries to access unassigned class 11-A -> 403
        const sarah11A = await get(`/api/teacher/overview?classId=${class11A._id}`, teacherToken);
        assert(sarah11A.status === 403, 'Sarah CANNOT access unassigned class Grade 11-A (403 Forbidden)');

        // Teacher Marcus Vance tries to access class 10-B (not assigned to him) -> 403
        const marcus10B = await get(`/api/teacher/overview?classId=${class10B._id}`, marcusToken);
        assert(marcus10B.status === 403, 'Marcus CANNOT access unassigned class Grade 10-B (403 Forbidden)');

        // Student tries to access teacher route -> 403
        const studentToTeacher = await get('/api/teacher/classes', studentToken);
        assert(studentToTeacher.status === 403, 'Student cannot access /api/teacher/classes (403 Forbidden)');

        console.log('\n=============================================');
        console.log('3. PART A — TEACHER PORTAL API TESTS');
        console.log('=============================================');

        // GET /api/teacher/classes
        const teacherClasses = await get('/api/teacher/classes', teacherToken);
        assert(teacherClasses.status === 200, 'GET /api/teacher/classes returns 200');
        assert(teacherClasses.data.classes.length === 2, 'Teacher has 2 assigned classes');

        // GET /api/teacher/overview
        assert(sarah10A.data.stats.studentCount === 20, 'Class 10-A studentCount is 20');
        assert(typeof sarah10A.data.stats.classAttendancePercent === 'number', 'Class attendance % computed');
        assert(typeof sarah10A.data.stats.classPerformancePercent === 'number', 'Class performance % computed');
        assert(Array.isArray(sarah10A.data.todaySchedule), "Today's schedule returned");
        assert(Array.isArray(sarah10A.data.latestExamResults), 'Latest exam results summary returned');
        assert(Array.isArray(sarah10A.data.atRiskStudents), 'At-risk students list returned');
        assert(sarah10A.data.todayAttendanceStatus.isDraft === true, "Today's attendance correctly flagged as draft");

        // GET /api/teacher/attendance (Teacher sees draft and confidential notes)
        const teacherAtt = await get(`/api/teacher/attendance?classId=${class10A._id}`, teacherToken);
        assert(teacherAtt.status === 200, 'GET /api/teacher/attendance returns 200');
        assert(teacherAtt.data.status === 'draft', 'Attendance record status is draft');
        assert(teacherAtt.data.notes.includes('Confidential'), 'Teacher can see confidential session notes');
        assert(teacherAtt.data.entries.length === 20, 'Register has entries for all 20 students');

        // POST /api/teacher/attendance (Save draft / bulk mark)
        const draftSave = await post('/api/teacher/attendance', {
            classId: class10A._id,
            sessionDate: new Date(),
            sessionSubject: "Mathematics",
            sessionTimeSlot: "09:00 - 10:30 AM",
            markAllPresent: true,
            notes: "Updated confidential notes."
        }, teacherToken);
        assert(draftSave.status === 201, 'POST /api/teacher/attendance saves draft (201)');
        assert(draftSave.data.summary.presentCount === 20, 'Bulk mark all present verified');

        // GET /api/teacher/students (Roster with computed metrics)
        const studentsList = await get(`/api/teacher/students?classId=${class10A._id}&sort=score`, teacherToken);
        assert(studentsList.status === 200, 'GET /api/teacher/students returns 200');
        assert(studentsList.data.students.length > 0, 'Students returned');
        const firstStudent = studentsList.data.students[0];
        assert(typeof firstStudent.attendancePercent === 'number', 'Derived attendancePercent present');
        assert(typeof firstStudent.overallScorePercent === 'number', 'Derived overallScorePercent present');
        assert(typeof firstStudent.growth === 'number', 'Derived growth pts present');
        assert(typeof firstStudent.classRank === 'number', 'Derived classRank present');

        // GET /api/teacher/students/:id (Student detail)
        const alexStudentDoc = await Student.findOne({ studentCode: 'STU-1001' });
        const studentDetail = await get(`/api/teacher/students/${alexStudentDoc._id}`, teacherToken);
        assert(studentDetail.status === 200, 'GET /api/teacher/students/:id returns 200');
        assert(studentDetail.data.student.studentCode === 'STU-1001', 'Correct student returned');
        assert(studentDetail.data.latestFeedback !== null, 'Latest feedback entry returned');

        // GET /api/teacher/students/:id/results
        const studentResults = await get(`/api/teacher/students/${alexStudentDoc._id}/results`, teacherToken);
        assert(studentResults.status === 200, 'GET /api/teacher/students/:id/results returns 200');
        assert(Array.isArray(studentResults.data.examResults), 'Exam results list returned');
        assert(Array.isArray(studentResults.data.weeklyTrend), 'Weekly trend vs class average returned');

        // POST /api/teacher/students/:id/feedback
        const newFeedback = await post(`/api/teacher/students/${alexStudentDoc._id}/feedback`, {
            text: "Outstanding improvement in integral calculus homework."
        }, teacherToken);
        assert(newFeedback.status === 201, 'POST /api/teacher/students/:id/feedback creates feedback (201)');

        // GET /api/teacher/classes/:id/export (CSV export)
        const exportRes = await get(`/api/teacher/classes/${class10A._id}/export`, teacherToken);
        assert(exportRes.status === 200, 'GET /api/teacher/classes/:id/export returns 200');
        assert(exportRes.headers.get('content-type').includes('text/csv'), 'Content-Type is text/csv');
        assert(exportRes.raw.includes('Student ID,Name,Attendance %,Overall Score %'), 'CSV content contains expected headers');

        console.log('\n=============================================');
        console.log('4. PART B — STUDENT PORTAL API TESTS');
        console.log('=============================================');

        // GET /api/student/overview
        const studentOverview = await get('/api/student/overview', studentToken);
        assert(studentOverview.status === 200, 'GET /api/student/overview returns 200');
        assert(studentOverview.data.greeting.includes('Alex'), 'Personalized greeting with student name');
        assert(studentOverview.data.nextMilestone !== null, 'Next milestone banner present');
        assert(studentOverview.data.streakCounter.currentStreakDays === 5, 'Streak counter correctly computed as 5 days');
        assert(studentOverview.data.statCards.enrolledCoursesCount === 3, '4 Stat cards present (enrolled in 3 courses)');
        assert(Array.isArray(studentOverview.data.weeklyPerformanceTrend), 'Weekly performance trend returned');
        assert(Array.isArray(studentOverview.data.courseProgress), 'Course progress list returned');
        assert(Array.isArray(studentOverview.data.latestExamResults), 'Latest exam results returned');

        // GET /api/student/attendance
        const studentAtt = await get('/api/student/attendance', studentToken);
        assert(studentAtt.status === 200, 'GET /api/student/attendance returns 200');
        assert(studentAtt.data.stats.eligibilityThreshold === 85, 'Eligibility threshold is 85%');
        assert(typeof studentAtt.data.stats.inGoodStanding === 'boolean', 'inGoodStanding flag present');
        assert(Array.isArray(studentAtt.data.courseBreakdown), 'By-course breakdown present');

        // ACCEPTANCE CRITERIA CHECK: Draft records MUST NOT appear in student attendance!
        const draftInHistory = studentAtt.data.attendanceHistory.some(h => h.id.toString() === draftSave.data.attendance._id.toString());
        assert(draftInHistory === false, 'CRITICAL: Draft attendance record is NOT visible to student');

        // ACCEPTANCE CRITERIA CHECK: Confidential notes NEVER leak to student!
        const rawAttJson = JSON.stringify(studentAtt.data);
        assert(!rawAttJson.includes('Confidential'), 'CRITICAL: Confidential session notes NEVER leak to student API');

        // GET /api/student/schedule?weekStart=
        const studentSchedule = await get('/api/student/schedule', studentToken);
        assert(studentSchedule.status === 200, 'GET /api/student/schedule returns 200');
        assert(Array.isArray(studentSchedule.data.timetable), 'Weekly timetable returned');

        // GET /api/student/courses
        const studentCourses = await get('/api/student/courses', studentToken);
        assert(studentCourses.status === 200, 'GET /api/student/courses returns 200');
        assert(studentCourses.data.courses.length === 3, 'Returns 3 enrolled courses');

        // GET /api/student/courses/:id
        const courseId = studentCourses.data.courses[0].id;
        const courseDetail = await get(`/api/student/courses/${courseId}`, studentToken);
        assert(courseDetail.status === 200, 'GET /api/student/courses/:id returns 200');
        assert(Array.isArray(courseDetail.data.course.lessons), 'Course lessons list returned');
        assert(typeof courseDetail.data.course.progressPercent === 'number', 'Course progress % present');

        // GET /api/student/results
        const studentResultsData = await get('/api/student/results', studentToken);
        assert(studentResultsData.status === 200, 'GET /api/student/results returns 200');
        assert(typeof studentResultsData.data.percentileBadge === 'string', 'Percentile badge present');
        assert(typeof studentResultsData.data.insight === 'string', 'Auto-generated insight present');
        assert(Array.isArray(studentResultsData.data.recommendations), 'Rule-based recommendations returned');
        assert(Array.isArray(studentResultsData.data.examResults), 'Exam results table returned');

        // GET /api/student/announcements & /api/student/resources
        const annRes = await get('/api/student/announcements', studentToken);
        assert(annRes.status === 200, 'GET /api/student/announcements returns 200');
        assert(annRes.data.announcements.length > 0, 'Announcements returned');

        const resRes = await get('/api/student/resources', studentToken);
        assert(resRes.status === 200, 'GET /api/student/resources returns 200');
        assert(resRes.data.resources.length > 0, 'Resources returned');

        // GET /api/student/report/export (CSV export)
        const studentExport = await get('/api/student/report/export', studentToken);
        assert(studentExport.status === 200, 'GET /api/student/report/export returns 200');
        assert(studentExport.headers.get('content-type').includes('text/csv'), 'Student export Content-Type is text/csv');
        assert(studentExport.raw.includes('Student Report: Alex Mercer'), 'Student report CSV contains student name');

        // PARAM TAMPERING TEST: Attempt to pass a different studentId
        const tampered = await get('/api/student/attendance?studentId=507f191e810c19729de860ea', studentToken);
        assert(tampered.status === 403, 'CRITICAL: Student ID tampering attempt rejected with 403 Forbidden');

        console.log('\n=============================================');
        console.log('5. ATTENDANCE SUBMIT LIFECYCLE TEST');
        console.log('=============================================');

        // Submit the draft attendance as Teacher
        const submitRes = await put(`/api/teacher/attendance/${draftSave.data.attendance._id}/submit`, {}, teacherToken);
        assert(submitRes.status === 200, 'PUT /api/teacher/attendance/:id/submit returns 200');
        assert(submitRes.data.attendance.status === 'submitted', 'Attendance status transitioned to submitted');

        // Now student CAN see the newly submitted session!
        const studentAttAfterSubmit = await get('/api/student/attendance', studentToken);
        const submittedNowInHistory = studentAttAfterSubmit.data.attendanceHistory.some(
            h => h.id.toString() === draftSave.data.attendance._id.toString()
        );
        assert(submittedNowInHistory === true, 'Newly submitted attendance record is now visible to student');

        // Still no notes leaked
        assert(!JSON.stringify(studentAttAfterSubmit.data).includes('Confidential'), 'Still zero confidential notes leak');

        console.log('\n=============================================');
        console.log('🎉 ALL INTEGRATION & ACCEPTANCE TESTS PASSED!');
        console.log('=============================================\n');

    } catch (err) {
        console.error('\n❌ TEST RUN FAILED:', err);
        process.exitCode = 1;
    } finally {
        await stopServer();
    }
}

runTests();
