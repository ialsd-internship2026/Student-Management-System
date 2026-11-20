import mongoose from 'mongoose';

export const notificationSchema = new mongoose.Schema({
    recipientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    recipientRole: {
        type: String,
        enum: ['teacher', 'student', 'admin'],
        required: true
    },
    type: {
        type: String,
        default: 'schedule_change',
        trim: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    relatedSessionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ClassSession'
    },
    read: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

export const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
export default Notification;
