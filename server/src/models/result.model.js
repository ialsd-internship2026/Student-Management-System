import mongoose from 'mongoose';

export const resultSchema = new mongoose.Schema({
    assessmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Assessment',
        required: true,
        index: true
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true,
        index: true
    },
    score: {
        type: Number,
        required: true
    },
    grade: {
        type: String,
        trim: true
    },
    feedbackText: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

resultSchema.pre('save', function (next) {
    if (!this.grade && typeof this.score === 'number') {
        if (this.score >= 90) this.grade = 'A+';
        else if (this.score >= 80) this.grade = 'A';
        else if (this.score >= 70) this.grade = 'B';
        else if (this.score >= 60) this.grade = 'C';
        else if (this.score >= 50) this.grade = 'D';
        else this.grade = 'F';
    }
    if (typeof next === 'function') return next();
});

resultSchema.index({ assessmentId: 1, studentId: 1 }, { unique: true });

export const Result = mongoose.models.Result || mongoose.model('Result', resultSchema);
export default Result;
