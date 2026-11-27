import mongoose from 'mongoose';
import imagekit, { publicKey, urlEndpoint } from '../config/imagekit.js';
import Setting from '../models/setting.model.js';

/**
 * Upload single image (supports multipart file via multer or base64 data string)
 */
export async function uploadImage(req, res, next) {
    try {
        let filePayload = null;
        let originalName = 'upload';

        if (req.file) {
            filePayload = req.file.buffer;
            originalName = req.file.originalname || 'upload';
        } else if (req.body?.file || req.body?.image) {
            filePayload = req.body.file || req.body.image;
            originalName = req.body.fileName || 'upload';
        }

        if (!filePayload) {
            return res.status(400).json({
                success: false,
                message: 'No image file or base64 payload provided.'
            });
        }

        // Clean folder name
        const rawFolder = req.body?.folder || req.query?.folder || 'general';
        const folder = rawFolder.startsWith('/') ? `/aster_portal${rawFolder}` : `/aster_portal/${rawFolder}`;

        const extMatch = originalName.match(/\.[a-zA-Z0-9]+$/);
        const ext = extMatch ? extMatch[0] : '.jpg';
        const baseName = originalName.replace(/\.[a-zA-Z0-9]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
        const fileName = `${baseName}_${Date.now()}${ext}`;

        const uploadResponse = await imagekit.files.upload({
            file: filePayload,
            fileName,
            folder,
            useUniqueFileName: true
        });

        return res.status(200).json({
            success: true,
            message: 'Image uploaded successfully to ImageKit cloud',
            url: uploadResponse.url,
            fileId: uploadResponse.fileId,
            name: uploadResponse.name,
            thumbnailUrl: uploadResponse.thumbnailUrl || uploadResponse.url
        });
    } catch (error) {
        console.error('[ImageKit Upload Error]:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to upload image to ImageKit cloud.'
        });
    }
}

/**
 * Get ImageKit client-side authentication tokens
 */
export async function getAuthParams(req, res) {
    try {
        const authenticationParameters = imagekit.helper?.getAuthenticationParameters
            ? imagekit.helper.getAuthenticationParameters()
            : null;

        return res.status(200).json({
            success: true,
            publicKey,
            urlEndpoint,
            auth: authenticationParameters
        });
    } catch (error) {
        console.error('[ImageKit Auth Error]:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to generate ImageKit auth params.'
        });
    }
}

/**
 * Get landing page & portal branding settings
 */
export async function getLandingSettings(req, res) {
    const defaultSettings = {
        name: 'Aster',
        tagline: 'INSTITUTE',
        logoUrl: '',
        heroImageUrl: '',
        announcementBanner: 'Welcome to Aster Institute Portal'
    };

    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(200).json({ success: true, data: defaultSettings });
        }
        const setting = await Setting.findOne({ key: 'portal_landing' });
        return res.status(200).json({
            success: true,
            data: setting ? { ...defaultSettings, ...setting.value } : defaultSettings
        });
    } catch (error) {
        console.warn('[Get Landing Settings Notice]:', error.message);
        return res.status(200).json({
            success: true,
            data: defaultSettings
        });
    }
}

/**
 * Update landing page & portal branding settings
 */
export async function updateLandingSettings(req, res) {
    try {
        const updatedSetting = await Setting.findOneAndUpdate(
            { key: 'portal_landing' },
            { $set: { value: req.body } },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        return res.status(200).json({
            success: true,
            message: 'Landing page and branding settings saved successfully.',
            data: updatedSetting.value
        });
    } catch (error) {
        console.error('[Update Landing Settings Error]:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to update landing settings.'
        });
    }
}
