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
