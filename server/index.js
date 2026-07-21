import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { connectDB } from './config/db.js';
// Route Imports
import authRoutes from './routes/authRoutes.js';
import fileRoutes from './routes/fileRoutes.js';
import scanRoutes from './routes/scanRoutes.js';
import studioRoutes from './routes/studioRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import pdfRoutes from './routes/pdfRoutes.js';
import signatureRoutes from './routes/signatureRoutes.js';
import animatorRoutes from './routes/animatorRoutes.js';
import labRoutes from './routes/labRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import userRoutes from './routes/userRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// SUPER EARLY LOGGER (Debugging)
app.use((req, res, next) => {
  console.log(`[REQ] ${req.method} ${req.url} | Origin: ${req.headers.origin}`);
  next();
});

// Global Middleware
app.use(helmet()); // Security headers

// CORS configuration - Support for production domains
const allowedOrigins = process.env.CLIENT_URL 
  ? [process.env.CLIENT_URL, 'http://localhost:5174', 'http://localhost:5173']
  : ['http://localhost:5174', 'http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow localhost and local network IPs for development
    if (origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('192.168.') || origin.includes('10.')) {
      return callback(null, true);
    }
    
    // Allow exact matches from CLIENT_URL
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // In production, if we want to allow all origins temporarily (or you can strict it down later)
    if (process.env.NODE_ENV === 'production') {
      return callback(null, true); // Allow all in production temporarily to prevent blocks, highly recommend locking this down to specific domains later
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());
app.use(morgan('dev')); // HTTP request logger

// Request logging middleware for debugging
app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  next();
});

// Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'success', 
    message: 'Waveword AI API is running!',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/lab', labRoutes);
app.use('/api/studio', studioRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/signatures', signatureRoutes);
app.use('/api/scan-fix', scanRoutes);
app.use('/api/animator', animatorRoutes);
app.use('/api/notifications', notificationRoutes);

// Placeholder for future routes
// app.use('/api/users', userRoutes);
// app.use('/api/files', fileRoutes);
// app.use('/api/tools', toolRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: err.message || 'Internal Server Error'
  });
});

// Serve frontend in production
app.use(express.static(path.join(__dirname, '../client/dist')));

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: `API route not found: ${req.method} ${req.originalUrl}`
  });
});

// Fallback to React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../client/dist', 'index.html'));
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

