import mongoose from 'mongoose';

const lessonSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    order: {
        type: Number,
        default: 1
    },
    status: {
        type: String,
        enum: ['not_started', 'in_progress', 'completed', 'up_next'],
        default: 'not_started'
    }
}, { _id: true });

export const courseSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        trim: true,
        uppercase: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    term: {
        type: String,
        required: true,
        default: 'Term 1 2026',
        trim: true
    },
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    credits: {
        type: Number,
        default: 3
    },
    description: {
        type: String,
        trim: true
    },
    lessons: [lessonSchema]
}, {
    timestamps: true
});

export const Course = mongoose.models.Course || mongoose.model('Course', courseSchema);
export default Course;
