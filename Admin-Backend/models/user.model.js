const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
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
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        index: true
    },
    passWord: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['teacher', 'admin', 'student', 'user'],
        default: 'teacher'
    },
    subjects: [{
        type: String,
        trim: true
    }],
    assignedClassIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ClassGroup'
    }],
    about: {
    type: String,
    default: '',
    trim: true
    },

    profileImage: {
    type: String,
    default: ''
    }
}, {
    timestamps: true
});

// Sync name and userName if one is missing
userSchema.pre('save', function (next) {
    if (!this.name && this.userName) {
        this.name = this.userName;
    }
    if (!this.userName && this.name) {
        this.userName = this.name.toLowerCase().replace(/\s+/g, '_');
    }
    if (typeof next === 'function') next();
});

// Virtual for passwordHash to match instruction specs
userSchema.virtual('passwordHash').get(function () {
    return this.passWord;
}).set(function (val) {
    this.passWord = val;
});

const userModel = mongoose.model('User', userSchema);

module.exports = userModel;
