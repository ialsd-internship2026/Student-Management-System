import mongoose from 'mongoose';

export const classGroupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Class name is required'],
        trim: true
    },
    term: {
        type: String,
        required: [true, 'Term is required'],
        default: 'Term 1 2026',
        trim: true
    },
    academicTerm: {
        type: String,
        default: 'Term 1 2026',
        trim: true
    },
    capacity: {
        type: Number,
        default: 30,
        min: 1
    },
    attendanceMinimumPercent: {
        type: Number,
        default: 85,
        min: 0,
        max: 100
    },
    teacherIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    studentIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student'
    }]
}, {
    timestamps: true
});

export const ClassGroup = mongoose.models.ClassGroup || mongoose.model('ClassGroup', classGroupSchema);
export default ClassGroup;
