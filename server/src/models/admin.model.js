import mongoose from 'mongoose';

export const adminSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User reference is required'],
        unique: true,
        index: true
    },
    name: {
        type: String,
        required: [true, 'Admin name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Admin email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        index: true
    },
    department: {
        type: String,
        default: 'Administration',
        trim: true
    },
    permissions: [{
        type: String,
        trim: true,
        default: 'all'
    }],
    active: {
        type: Boolean,
        default: true,
        index: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

export const adminModel = mongoose.models.Admin || mongoose.model('Admin', adminSchema);
export default adminModel;
