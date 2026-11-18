import mongoose from 'mongoose';
import dns from 'dns';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Custom DNS setting fallback for environments with DNS resolution issues (e.g. Atlas SRV lookups)
try {
    if (typeof dns.setDefaultResultOrder === 'function') {
        dns.setDefaultResultOrder('ipv4first');
    }
    if (typeof dns.setServers === 'function') {
        try {
            dns.setServers(['8.8.8.8', '1.1.1.1']);
        } catch (e) { /* ignore */ }
    }
} catch (dnsErr) {
    console.warn('[DB] Custom DNS override omitted:', dnsErr.message);
}

async function connectDb() {
    const dbUri = process.env.DATABASE_KEY || process.env.MONGODB_URI;

    if (!dbUri) {
        throw new Error('No DATABASE_KEY or MONGODB_URI found in environment variables.');
    }

    try {
        await mongoose.connect(dbUri, {
            serverSelectionTimeoutMS: 5000,
            autoIndex: true,
        });
        console.log(`[DB] Successfully connected to MongoDB database (${mongoose.connection.name})`);
        return mongoose.connection;
    } catch (error) {
        console.error('[DB Error] Mongoose connection error:', error.message);
        throw error;
    }
}

mongoose.connection.on('disconnected', () => {
    console.warn('[DB Warning] Mongoose disconnected from MongoDB');
});

mongoose.connection.on('reconnected', () => {
    console.log('[DB] Mongoose reconnected to MongoDB');
});

export { connectDb };
export default connectDb;
