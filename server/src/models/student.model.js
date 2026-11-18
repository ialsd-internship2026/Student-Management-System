import mongoose from 'mongoose';

export const studentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Student name is required'],
        trim: true
    },
    studentCode: {
        type: String,
        required: [true, 'Student code is required'],
        unique: true,
        trim: true,
        uppercase: true,
        index: true
    },
    classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ClassGroup',
        required: [true, 'ClassId is required'],
        index: true
    },
    enrolledSubjects: [{
        type: String,
        trim: true
    }],
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        sparse: true
    },
    avatar: {
        type: String,
        trim: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

studentSchema.virtual('rollNumber').get(function () {
    return this.studentCode;
});

export const studentModel = mongoose.models.Student || mongoose.model('Student', studentSchema);
export default studentModel;
