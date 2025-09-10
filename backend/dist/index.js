import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { videoRoutes } from './routes/video';
import { notesRoutes } from './routes/notes';
import { chatRoutes } from './routes/chat';
import { ttsRoutes } from './routes/tts';
import { voiceNotesRoutes } from './routes/voice-notes';
import { initializeDatabase } from './database/sqlite';
import { seedSampleData } from './seed-data';
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;
// Middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false
}));
app.use(cors({
    origin: '*',
    credentials: false,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: ['*'],
    exposedHeaders: ['*']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
// Handle preflight requests
app.options('*', (req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD');
    res.header('Access-Control-Allow-Headers', '*');
    res.sendStatus(200);
});
// Initialize database
initializeDatabase();
// Seed sample data
setTimeout(() => {
    seedSampleData();
}, 1000);
// Routes
app.use('/api/videos', videoRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/tts', ttsRoutes);
app.use('/api/voice-notes', voiceNotesRoutes);
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
//# sourceMappingURL=index.js.map