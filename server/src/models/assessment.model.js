import mongoose from 'mongoose';

export const assessmentSchema = new mongoose.Schema({
    classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ClassGroup',
        required: true,
        index: true
    },
    subject: {
        type: String,
        required: true,
        trim: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    maxScore: {
        type: Number,
        required: true,
        default: 100
    },
    status: {
        type: String,
        enum: ['upcoming', 'published'],
        default: 'published'
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    startTime: {
        type: String,
        trim: true
    },
    endTime: {
        type: String,
        trim: true
    },
    room: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

export const Assessment = mongoose.models.Assessment || mongoose.model('Assessment', assessmentSchema);
export default Assessment;
