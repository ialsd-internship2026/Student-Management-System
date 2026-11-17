import mongoose from 'mongoose';

export const classSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Class name is required'],
        trim: true
    },
    gradeLevel: {
        type: String,
        required: [true, 'Grade level is required'],
        trim: true
    },
    stream: {
        type: String,
        enum: ['general', 'science', 'commerce', 'arts', 'vocational'],
        default: 'general',
        lowercase: true
    },
    sections: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Section'
    }],
    subjects: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject'
    }],
    classTeacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    roomNumber: {
        type: String,
        trim: true
    },
    capacity: {
        type: Number,
        default: 40
    },
    academicYear: {
        type: String,
        trim: true,
        default: () => new Date().getFullYear().toString()
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'archived'],
        default: 'active'
    },
    description: {
        type: String,
        trim: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for enrolled students count across all sections
classSchema.virtual('totalSections').get(function () {
    return Array.isArray(this.sections) ? this.sections.length : 0;
});

export const classModel = mongoose.models.Class || mongoose.model('Class', classSchema);

export default classModel;
