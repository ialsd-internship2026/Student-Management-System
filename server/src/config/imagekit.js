import ImageKit from '@imagekit/nodejs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load server/.env first, then fallback to root .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../server/.env') });
dotenv.config();

const publicKey = process.env.IMAGEKIT_PUBLIC_KEY || process.env.IMAGEKIT_PUBIC_KEY;
const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT || 'https://ik.imagekit.io/ialsd';

if (!privateKey) {
    console.warn('[ImageKit Config] Warning: IMAGEKIT_PRIVATE_KEY is not defined. Cloud upload may fail.');
}

const imagekit = new ImageKit({
    publicKey,
    privateKey,
    urlEndpoint
});

export { imagekit, publicKey, urlEndpoint };
export default imagekit;
