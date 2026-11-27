import mongoose from 'mongoose';

export const settingSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        index: true
    },
    value: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true
});

export const settingModel = mongoose.models.Setting || mongoose.model('Setting', settingSchema);
export default settingModel;
