import mongoose from 'mongoose';

export const practiceActivitySchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true,
        index: true
    },
    date: {
        type: Date,
        required: true,
        default: Date.now,
        index: true
    },
    activityType: {
        type: String,
        required: true,
        default: 'quiz_practice',
        trim: true
    },
    completed: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

export const PracticeActivity = mongoose.models.PracticeActivity || mongoose.model('PracticeActivity', practiceActivitySchema);
export default PracticeActivity;
