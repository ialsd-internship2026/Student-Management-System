import mongoose from 'mongoose';

export const classSessionSchema = new mongoose.Schema({
    classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ClassGroup',
        required: [true, 'classId is required'],
        index: true
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        index: true
    },
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'teacherId is required'],
        index: true
    },
    date: {
        type: Date,
        required: [true, 'Session date is required'],
        index: true
    },
    startTime: {
        type: String, // e.g. "09:00"
        required: [true, 'startTime is required'],
        trim: true
    },
    endTime: {
        type: String, // e.g. "10:30"
        required: [true, 'endTime is required'],
        trim: true
    },
    room: {
        type: String,
        required: [true, 'room is required'],
        trim: true,
        index: true
    },
    topic: {
        type: String,
        default: '',
        trim: true
    },
    type: {
        type: String,
        enum: ['regular', 'assessment'],
        default: 'regular'
    },
    repeatWeekly: {
        type: Boolean,
        default: false
    },
    repeatDays: [{
        type: String,
        enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    }],
    recurrenceGroupId: {
        type: String,
        index: true
    },
    recurrenceEndDate: {
        type: Date
    },
    status: {
        type: String,
        enum: ['scheduled', 'completed', 'cancelled'],
        default: 'scheduled'
    }
}, {
    timestamps: true
});

classSessionSchema.index({ date: 1, teacherId: 1 });
classSessionSchema.index({ date: 1, room: 1 });

export const ClassSession = mongoose.models.ClassSession || mongoose.model('ClassSession', classSessionSchema);
export default ClassSession;
