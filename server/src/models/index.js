import userModel, { userSchema } from './user.model.js';
import teacherModel, { teacherSchema } from './teacher.model.js';
import adminModel, { adminSchema } from './admin.model.js';
import studentModel, { studentSchema } from './student.model.js';
import classGroupModel, { classGroupSchema } from './classGroup.model.js';
import attendanceRecordModel, { attendanceRecordSchema } from './attendanceRecord.model.js';
import assessmentModel, { assessmentSchema } from './assessment.model.js';
import resultModel, { resultSchema } from './result.model.js';
import feedbackModel, { feedbackSchema } from './feedback.model.js';
import courseModel, { courseSchema } from './course.model.js';
import enrollmentModel, { enrollmentSchema } from './enrollment.model.js';
import announcementModel, { announcementSchema } from './announcement.model.js';
import resourceModel, { resourceSchema } from './resource.model.js';
import practiceActivityModel, { practiceActivitySchema } from './practiceActivity.model.js';
import classSessionModel, { classSessionSchema } from './classSession.model.js';
import notificationModel, { notificationSchema } from './notification.model.js';

export {
    userModel,
    userSchema,
    teacherModel,
    teacherSchema,
    adminModel,
    adminSchema,
    studentModel,
    studentSchema,
    classGroupModel,
    classGroupSchema,
    attendanceRecordModel,
    attendanceRecordSchema,
    assessmentModel,
    assessmentSchema,
    resultModel,
    resultSchema,
    feedbackModel,
    feedbackSchema,
    courseModel,
    courseSchema,
    enrollmentModel,
    enrollmentSchema,
    announcementModel,
    announcementSchema,
    resourceModel,
    resourceSchema,
    practiceActivityModel,
    practiceActivitySchema,
    classSessionModel,
    classSessionSchema,
    notificationModel,
    notificationSchema
};

export default {
    User: userModel,
    Teacher: teacherModel,
    Admin: adminModel,
    Student: studentModel,
    ClassGroup: classGroupModel,
    AttendanceRecord: attendanceRecordModel,
    Assessment: assessmentModel,
    Result: resultModel,
    Feedback: feedbackModel,
    Course: courseModel,
    Enrollment: enrollmentModel,
    Announcement: announcementModel,
    Resource: resourceModel,
    PracticeActivity: practiceActivityModel,
    ClassSession: classSessionModel,
    Notification: notificationModel
};
