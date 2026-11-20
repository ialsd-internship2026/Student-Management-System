import mongoose from 'mongoose';

const attendanceEntrySchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    status: {
        type: String,
        enum: ['present', 'absent', 'late'],
        default: 'present'
    }
}, { _id: false });

export const attendanceRecordSchema = new mongoose.Schema({
    classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ClassGroup',
        required: true,
        index: true
    },
    sessionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ClassSession'
    },
    sessionDate: {
        type: Date,
        required: true,
        index: true
    },
    sessionSubject: {
        type: String,
        trim: true
    },
    sessionTimeSlot: {
        type: String,
        trim: true
    },
    entries: [attendanceEntrySchema],
    notes: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['draft', 'submitted'],
        default: 'draft'
    },
    submittedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    submittedAt: {
        type: Date
    }
}, {
    timestamps: true
});

attendanceRecordSchema.index({ classId: 1, sessionDate: 1, sessionTimeSlot: 1 });

export const AttendanceRecord = mongoose.models.AttendanceRecord || mongoose.model('AttendanceRecord', attendanceRecordSchema);
export default AttendanceRecord;
