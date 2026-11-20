import mongoose from 'mongoose';

export const teacherSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User reference is required'],
        unique: true,
        index: true
    },
    name: {
        type: String,
        required: [true, 'Teacher name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Teacher email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        index: true
    },
    subjects: [{
        type: String,
        trim: true
    }],
    assignedClassIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ClassGroup'
    }],
    active: {
        type: Boolean,
        default: true,
        index: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

export const teacherModel = mongoose.models.Teacher || mongoose.model('Teacher', teacherSchema);
export default teacherModel;
