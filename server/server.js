import app from './app.js';
import { connectDB } from './config/db.js';
import { ENV } from './config/env.js';

const startServer = async () => {
  // Attempt MongoDB connection
  await connectDB();

  const server = app.listen(ENV.PORT, () => {
    console.log(`=========================================`);
    console.log(`🚀 StayEasy Server Running`);
    console.log(`🌐 Mode:     ${ENV.NODE_ENV}`);
    console.log(`📡 URL:      http://localhost:${ENV.PORT}`);
    console.log(`🩺 Health:   http://localhost:${ENV.PORT}/api/v1/health`);
    console.log(`=========================================`);
  });

  // Graceful shutdown handling
  const handleShutdown = (signal) => {
    console.log(`\n[Server] ${signal} signal received: closing HTTP server...`);
    server.close(() => {
      console.log('[Server] HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));
};

startServer();
