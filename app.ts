import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { errorHandler } from './src/middleware/errorHandler';
import { generalLimiter } from './src/middleware/rateLimiter';
import authRoutes from './src/modules/auth/auth.routes';

const app: Application = express();

// Security middleware
app.use(helmet()); // Sets security headers
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:3000'],
  credentials: true,
}));


app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));



app.use(generalLimiter);



app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: '🚀🚀🚀  OK   🚀🚀🚀', 
    timestamp: new Date().toISOString() });
});


app.use('/auth', authRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});


app.use(errorHandler);

export default app;