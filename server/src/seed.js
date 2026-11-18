import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import 'dotenv/config';
import connectDb from './config/db.js';

import User from './models/user.model.js';
import ClassGroup from './models/classGroup.model.js';
import Student from './models/student.model.js';
import AttendanceRecord from './models/attendanceRecord.model.js';
import Assessment from './models/assessment.model.js';
import Result from './models/result.model.js';
import Feedback from './models/feedback.model.js';
import Course from './models/course.model.js';
import Enrollment from './models/enrollment.model.js';
import Announcement from './models/announcement.model.js';
import Resource from './models/resource.model.js';
import PracticeActivity from './models/practiceActivity.model.js';

export async function seedDatabase() {
    console.log('[Seed] Starting database seed...');
    await connectDb();

    // Clean up collections
    await Promise.all([
        User.deleteMany({}),
        ClassGroup.deleteMany({}),
        Student.deleteMany({}),
        AttendanceRecord.deleteMany({}),
        Assessment.deleteMany({}),
        Result.deleteMany({}),
        Feedback.deleteMany({}),
        Course.deleteMany({}),
        Enrollment.deleteMany({}),
        Announcement.deleteMany({}),
        Resource.deleteMany({}),
        PracticeActivity.deleteMany({})
    ]);

    const defaultPasswordHash = await bcrypt.hash('Password123!', 10);

    // 1. Classes
    const [class10A, class10B, class11A] = await ClassGroup.create([
        { name: "Grade 10-A", term: "Term 1 2026" },
        { name: "Grade 10-B", term: "Term 1 2026" },
        { name: "Grade 11-A", term: "Term 1 2026" } // unassigned to Sarah/Marcus for access-boundary testing
    ]);

    // 2. Teachers & Admin
    const sarahJenkins = await User.create({
        name: "Sarah Jenkins",
        userName: "sarah_jenkins",
        email: "sarah.jenkins@aster.edu",
        passWord: defaultPasswordHash,
        role: "teacher",
        subjects: ["Mathematics", "Advanced Calculus"],
        assignedClassIds: [class10A._id, class10B._id]
    });

    const marcusVance = await User.create({
        name: "Marcus Vance",
        userName: "marcus_vance",
        email: "marcus.vance@aster.edu",
        passWord: defaultPasswordHash,
        role: "teacher",
        subjects: ["Physics"],
        assignedClassIds: [class10A._id]
    });

    const adminUser = await User.create({
        name: "Admin Office",
        userName: "admin_office",
        email: "admin@aster.edu",
        passWord: defaultPasswordHash,
        role: "admin",
        assignedClassIds: [class10A._id, class10B._id, class11A._id]
    });

    // Link teachers back to class groups
    class10A.teacherIds = [sarahJenkins._id, marcusVance._id];
    await class10A.save();
    class10B.teacherIds = [sarahJenkins._id];
    await class10B.save();

    // 3. Courses
    const mathCourse = await Course.create({
        code: "MATH101",
        name: "Calculus & Analytical Geometry",
        term: "Term 1 2026",
        teacherId: sarahJenkins._id,
        credits: 4,
        description: "Limits, continuity, derivatives, and integral calculus applications.",
        lessons: [
            { title: "Introduction to Functions and Limits", order: 1, status: "completed" },
            { title: "Differential Calculus Fundamentals", order: 2, status: "in_progress" },
            { title: "Applications of Derivatives", order: 3, status: "up_next" },
            { title: "Integral Calculus & Riemann Sums", order: 4, status: "not_started" }
        ]
    });

    const physicsCourse = await Course.create({
        code: "PHY101",
        name: "Classical Mechanics & Thermodynamics",
        term: "Term 1 2026",
        teacherId: marcusVance._id,
        credits: 4,
        description: "Kinematics, Newton's laws, energy conservation, and heat cycles.",
        lessons: [
            { title: "Vectors and Motion in Two Dimensions", order: 1, status: "completed" },
            { title: "Newton's Laws and Free Body Analysis", order: 2, status: "in_progress" },
            { title: "Thermal Properties & First Law", order: 3, status: "up_next" }
        ]
    });

    const englishCourse = await Course.create({
        code: "ENG101",
        name: "Literature & Academic Composition",
        term: "Term 1 2026",
        credits: 3,
        description: "Critical analysis of poetry, modern prose, and argumentative essays.",
        lessons: [
            { title: "Rhetorical Analysis Basics", order: 1, status: "completed" },
            { title: "Poetic Devices & Modern Verse", order: 2, status: "in_progress" }
        ]
    });

    // 4. Students (30 total)
    const studentData = [
        { name: "Alex Mercer", code: "STU-1001", classId: class10A._id, email: "alex.mercer@student.aster.edu" },
        { name: "Maya Lin", code: "STU-1002", classId: class10A._id, email: "maya.lin@student.aster.edu" },
        { name: "Jordan Smith", code: "STU-1003", classId: class10A._id, email: "jordan.smith@student.aster.edu" },
        { name: "Emily Watson", code: "STU-1004", classId: class10A._id, email: "emily.watson@student.aster.edu" },
        { name: "Liam Davies", code: "STU-1005", classId: class10A._id, email: "liam.davies@student.aster.edu" },
        { name: "Sophia Zhang", code: "STU-1006", classId: class10A._id, email: "sophia.zhang@student.aster.edu" },
        { name: "Noah Patel", code: "STU-1007", classId: class10A._id, email: "noah.patel@student.aster.edu" },
        { name: "Olivia Brown", code: "STU-1008", classId: class10A._id, email: "olivia.brown@student.aster.edu" },
        { name: "Lucas Garcia", code: "STU-1009", classId: class10A._id, email: "lucas.garcia@student.aster.edu" },
        { name: "Ava Johnson", code: "STU-1010", classId: class10A._id, email: "ava.johnson@student.aster.edu" },
        { name: "Ethan Miller", code: "STU-1011", classId: class10A._id, email: "ethan.miller@student.aster.edu" },
        { name: "Chloe Taylor", code: "STU-1012", classId: class10A._id, email: "chloe.taylor@student.aster.edu" },
        { name: "Mason Anderson", code: "STU-1013", classId: class10A._id, email: "mason.anderson@student.aster.edu" },
        { name: "Isabella Thomas", code: "STU-1014", classId: class10A._id, email: "isabella.thomas@student.aster.edu" },
        { name: "James Jackson", code: "STU-1015", classId: class10A._id, email: "james.jackson@student.aster.edu" },
        { name: "Mia White", code: "STU-1016", classId: class10A._id, email: "mia.white@student.aster.edu" },
        { name: "Benjamin Harris", code: "STU-1017", classId: class10A._id, email: "benjamin.harris@student.aster.edu" },
        { name: "Charlotte Martin", code: "STU-1018", classId: class10A._id, email: "charlotte.martin@student.aster.edu" },
        { name: "William Thompson", code: "STU-1019", classId: class10A._id, email: "william.thompson@student.aster.edu" },
        { name: "Amelia Robinson", code: "STU-1020", classId: class10A._id, email: "amelia.robinson@student.aster.edu" },

        // Grade 10-B (10 students)
        { name: "Henry Clark", code: "STU-1021", classId: class10B._id, email: "henry.clark@student.aster.edu" },
        { name: "Harper Rodriguez", code: "STU-1022", classId: class10B._id, email: "harper.rodriguez@student.aster.edu" },
        { name: "Alexander Lewis", code: "STU-1023", classId: class10B._id, email: "alexander.lewis@student.aster.edu" },
        { name: "Evelyn Lee", code: "STU-1024", classId: class10B._id, email: "evelyn.lee@student.aster.edu" },
        { name: "Daniel Walker", code: "STU-1025", classId: class10B._id, email: "daniel.walker@student.aster.edu" },
        { name: "Abigail Hall", code: "STU-1026", classId: class10B._id, email: "abigail.hall@student.aster.edu" },
        { name: "Matthew Allen", code: "STU-1027", classId: class10B._id, email: "matthew.allen@student.aster.edu" },
        { name: "Emily Young", code: "STU-1028", classId: class10B._id, email: "emily.young@student.aster.edu" },
        { name: "Samuel Hernandez", code: "STU-1029", classId: class10B._id, email: "samuel.hernandez@student.aster.edu" },
        { name: "Elizabeth King", code: "STU-1030", classId: class10B._id, email: "elizabeth.king@student.aster.edu" }
    ];

    const createdStudents = [];
    const class10AStudentIds = [];
    const class10BStudentIds = [];

    for (const s of studentData) {
        const student = await Student.create({
            name: s.name,
            studentCode: s.code,
            classId: s.classId,
            enrolledSubjects: ["Mathematics", "Physics", "English Literature"]
        });

        const user = await User.create({
            name: s.name,
            userName: s.code.toLowerCase().replace('-', '_'),
            email: s.email,
            passWord: defaultPasswordHash,
            role: "student",
            studentId: student._id
        });

        student.userId = user._id;
        await student.save();

        createdStudents.push({ student, user });
        if (s.classId.toString() === class10A._id.toString()) {
            class10AStudentIds.push(student._id);
        } else {
            class10BStudentIds.push(student._id);
        }

        // Enroll in courses
        await Enrollment.create([
            { studentId: student._id, courseId: mathCourse._id, progressPercent: 70 },
            { studentId: student._id, courseId: physicsCourse._id, progressPercent: 60 },
            { studentId: student._id, courseId: englishCourse._id, progressPercent: 85 }
        ]);
    }

    class10A.studentIds = class10AStudentIds;
    await class10A.save();
    class10B.studentIds = class10BStudentIds;
    await class10B.save();

    // 5. Practice Activities for Alex Mercer (5-day streak)
    const alexStudent = createdStudents[0].student;
    const today = new Date();
    for (let i = 0; i < 5; i++) {
        const actDate = new Date(today);
        actDate.setDate(today.getDate() - i);
        await PracticeActivity.create({
            studentId: alexStudent._id,
            date: actDate,
            activityType: i % 2 === 0 ? "quiz_practice" : "problem_set",
            completed: true
        });
    }

    // 6. Historical Attendance Records for Grade 10-A (Past 8 sessions - all submitted)
    for (let i = 8; i >= 1; i--) {
        const sessDate = new Date(today);
        sessDate.setDate(today.getDate() - i);
        sessDate.setHours(9, 0, 0, 0);

        const entries = class10AStudentIds.map((sid, idx) => {
            // Realistic mix: mostly present, occasional late or absent
            let status = 'present';
            if ((idx + i) % 7 === 0) status = 'late';
            else if ((idx + i) % 11 === 0) status = 'absent';
            return { studentId: sid, status };
        });

        await AttendanceRecord.create({
            classId: class10A._id,
            sessionDate: sessDate,
            sessionSubject: i % 2 === 0 ? "Mathematics" : "Physics",
            sessionTimeSlot: "09:00 - 10:30 AM",
            entries,
            notes: `Session ${9 - i} completed on schedule.`,
            status: "submitted",
            submittedBy: sarahJenkins._id,
            submittedAt: sessDate
        });
    }

    // 7. Today's Draft Attendance Record for Grade 10-A (testing draft lifecycle & privacy)
    const todayEntries = class10AStudentIds.map(sid => ({
        studentId: sid,
        status: sid.toString() === alexStudent._id.toString() ? 'present' : 'present'
    }));

    const draftAttendance = await AttendanceRecord.create({
        classId: class10A._id,
        sessionDate: today,
        sessionSubject: "Mathematics",
        sessionTimeSlot: "09:00 - 10:30 AM",
        entries: todayEntries,
        notes: "Confidential Teacher Note: Alex participated actively in the calculus derivation. Follow up with Liam on quadratic inequalities.",
        status: "draft"
    });

    // 8. Assessments & Results
    const quiz1 = await Assessment.create({
        classId: class10A._id,
        subject: "Mathematics",
        name: "Quiz 1 - Algebra & Functions",
        maxScore: 50,
        status: "published",
        date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
    });

    const midterm = await Assessment.create({
        classId: class10A._id,
        subject: "Mathematics",
        name: "Midterm Examination",
        maxScore: 100,
        status: "published",
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    });

    const physicsMidterm = await Assessment.create({
        classId: class10A._id,
        subject: "Physics",
        name: "Midterm Mechanics",
        maxScore: 100,
        status: "published",
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    });

    const upcomingExam = await Assessment.create({
        classId: class10A._id,
        subject: "Mathematics",
        name: "Final Term Examination",
        maxScore: 100,
        status: "upcoming",
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    // Seed results for Grade 10-A students
    for (let i = 0; i < class10AStudentIds.length; i++) {
        const sid = class10AStudentIds[i];

        // Quiz 1 score (out of 50)
        const qScore = 35 + (i % 15);
        await Result.create({
            assessmentId: quiz1._id,
            studentId: sid,
            score: qScore,
            grade: qScore >= 45 ? "A+" : (qScore >= 40 ? "A" : "B"),
            feedbackText: "Good initial performance on fundamental algebra concepts."
        });

        // Midterm score (out of 100)
        const mScore = 70 + (i % 28);
        await Result.create({
            assessmentId: midterm._id,
            studentId: sid,
            score: mScore,
            grade: mScore >= 90 ? "A+" : (mScore >= 80 ? "A" : (mScore >= 70 ? "B" : "C")),
            feedbackText: "Strong problem solving in section B. Double-check your arithmetic in multi-step proofs."
        });

        // Physics midterm (out of 100)
        const pScore = 65 + (i % 30);
        await Result.create({
            assessmentId: physicsMidterm._id,
            studentId: sid,
            score: pScore,
            grade: pScore >= 90 ? "A+" : (pScore >= 80 ? "A" : (pScore >= 70 ? "B" : "C")),
            feedbackText: "Good demonstration of free-body diagrams."
        });
    }

    // 9. Teacher Feedback for Alex Mercer
    await Feedback.create({
        studentId: alexStudent._id,
        authorId: sarahJenkins._id,
        text: "Alex shows extraordinary curiosity and diligence in differential calculus. Continue practicing timed problems."
    });

    // 10. Announcements
    await Announcement.create([
        {
            classId: class10A._id,
            title: "Midterm Papers Discussion",
            body: "We will review the common pitfalls on Midterm questions this Thursday during office hours.",
            postedBy: sarahJenkins._id
        },
        {
            courseId: mathCourse._id,
            title: "Math Olympiad Registration Open",
            body: "Interested students in Grade 10 can register for the regional math olympiad by Friday.",
            postedBy: sarahJenkins._id
        }
    ]);

    // 11. Resources
    await Resource.create([
        {
            classId: class10A._id,
            courseId: mathCourse._id,
            title: "Calculus Formula Sheet 2026.pdf",
            fileUrl: "https://aster.edu/resources/calculus_formulas.pdf",
            uploadedBy: sarahJenkins._id
        },
        {
            classId: class10A._id,
            courseId: physicsCourse._id,
            title: "Mechanics Lab Experiment Guide.pdf",
            fileUrl: "https://aster.edu/resources/mechanics_lab.pdf",
            uploadedBy: marcusVance._id
        }
    ]);

    console.log('[Seed] Database successfully seeded with Aster Institute data!');
    console.log(`[Seed] Teachers: Sarah Jenkins (sarah.jenkins@aster.edu), Marcus Vance (marcus.vance@aster.edu)`);
    console.log(`[Seed] Student: Alex Mercer (alex.mercer@student.aster.edu), Code: STU-1001`);
    console.log(`[Seed] Password for all seeded accounts: Password123!`);
    console.log(`[Seed] Draft attendance record ID: ${draftAttendance._id}`);
}

// Allow standalone execution: `node src/seed.js`
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
    seedDatabase()
        .then(() => {
            console.log('[Seed] Finished. Disconnecting DB.');
            return mongoose.disconnect();
        })
        .then(() => process.exit(0))
        .catch(err => {
            console.error('[Seed Error]', err);
            process.exit(1);
        });
}

export default seedDatabase;
