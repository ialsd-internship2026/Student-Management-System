import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';

import authRoutes from './routes/auth.routes.js';
import studentRoutes from './routes/student.routes.js';
import userRoutes from './routes/user.routes.js';
import teacherRoutes from './routes/teacher.routes.js';
import classRoutes from './routes/class.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';

const app = express();

// Security Headers with cross-origin media support
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Dynamic CORS Origin Resolution
const corsOptions = {
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);

        const envOrigins = process.env.CORS_ORIGIN
            ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
            : [];

        if (
            envOrigins.includes(origin) ||
            process.env.NODE_ENV !== 'production' ||
            /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
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

// Health Check Endpoint for Deployment Probes (Render, Railway, Heroku, AWS)
app.get('/api/health', (req, res) => {
    const dbState = mongoose.connection.readyState;
    const dbStatusMap = { 0: 'Disconnected', 1: 'Connected', 2: 'Connecting', 3: 'Disconnecting' };

    res.status(200).json({
        status: 'OK',
        appName: 'Student Management System API',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        database: dbStatusMap[dbState] || 'Unknown'
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Catch-all for undefined routes
app.use((req, res) => {
    res.status(404).json({ message: `API endpoint '${req.originalUrl}' not found.` });
});

// Global Centralized Error Handling Middleware
app.use((err, req, res, next) => {
    console.error('[Global Error Handler]', err);
    res.status(err.status || 500).json({
        message: err.message || 'An unexpected error occurred on the server.',
        error: process.env.NODE_ENV === 'development' ? err : undefined
    });
});

export default app;
