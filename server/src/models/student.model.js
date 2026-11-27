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
    photo: {
        type: String,
        default: '',
        trim: true
    },
    classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ClassGroup',
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
    enrollmentStatus: {
        type: String,
        enum: ['pending', 'enrolled', 'archived'],
        default: 'enrolled',
        index: true
    },
    enrollmentDate: {
        type: Date,
        default: Date.now
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

studentSchema.virtual('rollNumber').get(function () {
    return this.studentCode;
});

studentSchema.virtual('avatar').get(function () {
    return this.photo;
}).set(function (val) {
    this.photo = val;
});

export const studentModel = mongoose.models.Student || mongoose.model('Student', studentSchema);
export default studentModel;
