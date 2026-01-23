import app from './app';
import { env } from './src/config/env';
import { Logger } from './src/utils/logger';

const PORT = env.PORT || 5000;

const server = app.listen(PORT, () => {
  Logger.info(`🚀🚀🚀🚀🚀🚀🚀 Server running on port ${PORT} in ${env.NODE_ENV} mode 🚀🚀🚀🚀🚀🚀🚀🚀`);
  Logger.info(`🚀🚀🚀🚀🚀🚀🚀 Health check: http://localhost:${PORT}/health 🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  Logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    Logger.info('Server closed');
    process.exit(0);
  });
});

process.on('unhandledRejection', (reason: any) => {
  Logger.error('Unhandled Rejection:', reason);
  process.exit(1);
});