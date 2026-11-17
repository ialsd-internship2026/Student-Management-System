import mongoose from 'mongoose';

export const studentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Student name is required'],
        trim: true
    },
    rollNumber: {
        type: String,
        required: [true, 'Roll number is required'],
        unique: true,
        trim: true,
        uppercase: true,
        index: true
    },
    email: {
        type: String,
        required: [true, 'Student email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        index: true
    },
    phone: {
        type: String,
        trim: true
    },
    dateOfBirth: {
        type: Date
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
        lowercase: true
    },
    classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class'
    },
    class: {
        type: String,
        required: [true, 'Class or Grade is required'],
        trim: true
    },
    sectionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Section'
    },
    section: {
        type: String,
        trim: true,
        uppercase: true
    },
    department: {
        type: String,
        trim: true
    },
    subjects: [{
        type: String,
        trim: true
    }],
    address: {
        street: { type: String, trim: true },
        city: { type: String, trim: true },
        state: { type: String, trim: true },
        zipCode: { type: String, trim: true }
    },
    guardian: {
        name: { type: String, trim: true },
        relation: { type: String, trim: true },
        phone: { type: String, trim: true },
        email: { type: String, trim: true, lowercase: true }
    },
    admissionDate: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended', 'graduated'],
        default: 'active'
    },
    profileImage: {
        type: String,
        trim: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        sparse: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual populate for associated User account
studentSchema.virtual('user', {
    ref: 'User',
    localField: 'userId',
    foreignField: '_id',
    justOne: true
});

export const studentModel = mongoose.models.Student || mongoose.model('Student', studentSchema);

export default studentModel;
