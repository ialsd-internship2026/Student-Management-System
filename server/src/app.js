import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';

import authRoutes from './routes/auth.routes.js';
import teacherRoutes from './routes/teacher.routes.js';
import studentRoutes from './routes/student.routes.js';
import adminRoutes from './routes/admin.routes.js';

const app = express();

// Security Headers
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS Configuration
const corsOptions = {
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);

        const envOrigins = process.env.CORS_ORIGIN
            ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
            : [];

        if (
            envOrigins.includes(origin) ||
            process.env.NODE_ENV !== 'production' ||
            /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
        ) {
            return callback(null, origin);
        }

        return callback(null, origin);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(cookieParser());

// Health Check Endpoint
app.get('/api/health', (req, res) => {
    const dbState = mongoose.connection.readyState;
    const dbStatusMap = {
        0: 'Disconnected',
        1: 'Connected',
        2: 'Connecting',
        3: 'Disconnecting'
    };

    res.status(200).json({
        status: 'OK',
        appName: 'Aster Institute - Student Management System API',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        database: dbStatusMap[dbState] || 'Unknown'
    });
});

// API Routes
app.use('/api/auth', authRoutes);

app.use('/api/teacher', teacherRoutes);
app.use('/api/teachers', teacherRoutes); // alias

app.use('/api/student', studentRoutes);
app.use('/api/students', studentRoutes); // alias

app.use('/api/admin', adminRoutes);

// Catch-all for undefined routes
app.use((req, res) => {
    res.status(404).json({
        message: `API endpoint '${req.originalUrl}' not found.`
    });
});

// Global Error Handling Middleware
app.use((err, req, res, next) => {
    console.error('[Global Error Handler]', err);
    res.status(err.status || 500).json({
        message: err.message || 'An unexpected error occurred on the server.',
        error: process.env.NODE_ENV === 'development' ? err : undefined
    });
});

export default app;
