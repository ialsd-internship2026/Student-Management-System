import mongoose from 'mongoose';

export const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
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
    passwordHash: {
        type: String,
        required: [true, 'Password is required']
    },
    role: {
        type: String,
        enum: ['teacher', 'admin', 'student'],
        required: [true, 'Role is required'],
        default: 'student',
        index: true
    },
    photo: {
        type: String,
        default: '',
        trim: true
    },
    active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Backward compatibility virtual for passWord field if previously saved
userSchema.virtual('passWord').get(function () {
    return this.passwordHash || this._doc?.passWord;
}).set(function (val) {
    this.passwordHash = val;
});

// Avatar virtual alias for photo
userSchema.virtual('avatar').get(function () {
    return this.photo;
}).set(function (val) {
    this.photo = val;
});

export const userModel = mongoose.models.User || mongoose.model('User', userSchema);
export default userModel;
