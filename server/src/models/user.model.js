import mongoose from 'mongoose';

export const userSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true
    },
    userName: {
        type: String,
        unique: true,
        sparse: true,
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        index: true
    },
    passWord: {
        type: String,
        required: [true, 'Password is required']
    },
    role: {
        type: String,
        enum: ['teacher', 'admin', 'student'],
        default: 'student'
    },
    subjects: [{
        type: String,
        trim: true
    }],
    assignedClassIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ClassGroup'
    }],
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student'
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

userSchema.pre('save', function (next) {
    if (!this.name && this.userName) {
        this.name = this.userName;
    }
    if (!this.userName && this.name) {
        this.userName = this.name.toLowerCase().replace(/\s+/g, '_');
    }
    if (typeof next === 'function') return next();
});

userSchema.virtual('passwordHash').get(function () {
    return this.passWord;
}).set(function (val) {
    this.passWord = val;
});

export const userModel = mongoose.models.User || mongoose.model('User', userSchema);
export default userModel;
