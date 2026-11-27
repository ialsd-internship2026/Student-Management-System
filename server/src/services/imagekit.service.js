import imagekit, { publicKey, urlEndpoint } from '../config/imagekit.js';

/**
 * ImageKit Cloud Storage Service
 * Handles core cloud image uploading, deletion, and token generation.
 */
export class ImageKitService {
    /**
     * Upload an image buffer or base64 string to ImageKit CDN
     * @param {Buffer|string} filePayload - Binary buffer from multer or base64 data string
     * @param {string} originalName - Original filename
     * @param {string} folderCategory - Destination category (e.g. 'profiles', 'landing', 'branding')
     * @returns {Promise<{ url: string, fileId: string, name: string, thumbnailUrl: string }>}
     */
    static async uploadImage(filePayload, originalName = 'upload', folderCategory = 'general') {
        if (!filePayload) {
            throw new Error('No image file buffer or base64 payload provided for cloud upload.');
        }

        // Standardize destination folder under /aster_portal/<category>
        const cleanCategory = String(folderCategory || 'general')
            .replace(/^\/+/, '')
            .replace(/^aster_portal\/?/, '');
        const folder = `/aster_portal/${cleanCategory}`;

        // Sanitize and format filename with unique timestamp
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

        return {
            url: uploadResponse.url,
            fileId: uploadResponse.fileId,
            name: uploadResponse.name,
            thumbnailUrl: uploadResponse.thumbnailUrl || uploadResponse.url
        };
    }

    /**
     * Delete an existing image from ImageKit cloud by fileId
     * @param {string} fileId - The ImageKit fileId
     */
    static async deleteImage(fileId) {
        if (!fileId) return null;
        return imagekit.files.delete(fileId);
    }

    /**
     * Get client-side ImageKit authentication parameters
     */
    static getAuthParameters() {
        const auth = imagekit.helper?.getAuthenticationParameters
            ? imagekit.helper.getAuthenticationParameters()
            : null;

        return {
            publicKey,
            urlEndpoint,
            auth
        };
    }
}

export default ImageKitService;
