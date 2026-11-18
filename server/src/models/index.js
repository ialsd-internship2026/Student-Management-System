import userModel, { userSchema } from './user.model.js';
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

export {
    userModel,
    userSchema,
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
    practiceActivitySchema
};

export default {
    User: userModel,
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
    PracticeActivity: practiceActivityModel
};
