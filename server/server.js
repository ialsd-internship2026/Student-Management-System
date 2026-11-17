require('dotenv').config();
const app = require('./src/app');
const connectDb = require('./src/config/db');

const PORT = process.env.PORT || 8080;

// Start accepting requests only after MongoDB is ready.
let server;
connectDb()
    .then(() => {
        server = app.listen(PORT, () => {
            console.log(`🚀 [Student Management System Server] Listening on port ${PORT} (${process.env.NODE_ENV || 'development'} mode)`);
        });
    })
    .catch((error) => {
        console.error('[Startup Error] Database connection failed:', error.message);
        process.exitCode = 1;
    });