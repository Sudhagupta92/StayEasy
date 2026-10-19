import dns from 'node:dns';
import mongoose from 'mongoose';
import { ENV } from './env.js';
import { startPersistentMongod, isPortListening } from '../scripts/start-local-db.js';

// Configure reliable DNS servers (Google + Cloudflare) for MongoDB Atlas SRV record resolution on Windows
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (dnsErr) {
  // Ignore if custom DNS cannot be set
}

let isConnected = false;
let memoryServerInstance = null;

// Helper to mask MongoDB URI credentials in logs
export const sanitizeURI = (uri) => {
  if (!uri) return 'undefined';
  return uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
};

// Helper to diagnose MongoDB connection errors
export const diagnoseMongoError = (error) => {
  const msg = error?.message || '';
  if (msg.includes('bad auth') || msg.includes('AuthenticationFailed') || error.code === 8000) {
    return 'Authentication Failed: Incorrect MongoDB Atlas username or password in MONGODB_URI.';
  }
  if (
    msg.includes('Could not connect to any servers in your MongoDB Atlas cluster') ||
    msg.includes("IP that isn't whitelisted") ||
    msg.includes('MongoServerSelectionError')
  ) {
    return 'Network/Whitelist Restriction: Cannot reach MongoDB cluster. In MongoDB Atlas -> Network Access -> Add IP Address -> 0.0.0.0/0 (Allow access from anywhere).';
  }
  if (msg.includes('querySrv ECONNREFUSED') || msg.includes('querySrv ETIMEOUT') || msg.includes('ENOTFOUND')) {
    return 'DNS/SRV Resolution Issue: Cluster hostname could not be resolved. Check cluster address and internet connection.';
  }
  if (msg.includes('Invalid scheme') || msg.includes('MongoParseError') || msg.includes('must begin with')) {
    return 'Invalid Connection String: The format of MONGODB_URI is invalid.';
  }
  if (msg.includes('ECONNREFUSED')) {
    return 'Connection Refused: Target MongoDB server is not running on the specified host/port.';
  }
  return `Database Connection Error: ${msg}`;
};

export const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) {
    return;
  }

  const uri = ENV.MONGODB_URI || 'mongodb://127.0.0.1:27017/stayeasy';
  const isLocalUri = uri.includes('127.0.0.1') || uri.includes('localhost');

  // In local development, if target port is not listening, automatically ensure local persistent MongoDB is started
  if (isLocalUri && ENV.NODE_ENV !== 'test') {
    const portMatch = uri.match(/:(\d+)\/?/);
    const targetPort = portMatch ? parseInt(portMatch[1], 10) : 27017;
    const listening = await isPortListening(targetPort);

    if (!listening) {
      console.log(`[Database] Port ${targetPort} not active. Launching persistent on-disk MongoDB service...`);
      try {
        await startPersistentMongod({ port: targetPort });
      } catch (launchErr) {
        console.warn(`[Database] Local mongod auto-start notice: ${launchErr.message}`);
      }
    }
  }

  // Attempt connection with retries to handle daemon spin-up delays
  let lastError = null;
  const maxRetries = isLocalUri ? 3 : 2;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const conn = await mongoose.connect(uri, {
        dbName: 'stayeasy',
        serverSelectionTimeoutMS: 5000,
      });

      isConnected = conn.connections[0].readyState === 1;
      console.log(`✅ [Database] MongoDB Connected: ${conn.connection.host} | DB: ${conn.connection.name}`);

      // Ensure idempotent seed runs so demo listings and accounts are always available
      try {
        const { seedProperties } = await import('../seed_properties.js');
        if (typeof seedProperties === 'function') {
          await seedProperties();
        }
      } catch (seedErr) {
        console.warn('[Database] Seed initialization notice:', seedErr.message);
      }

      return;
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        console.log(`[Database] Connection attempt ${attempt}/${maxRetries} failed (${error.message}). Retrying in 1.5s...`);
        await new Promise((r) => setTimeout(r, 1500));
      }
    }
  }

  isConnected = false;
  const diagnosis = diagnoseMongoError(lastError);

  console.error('\n================================================================================');
  console.error(`❌ [Database Connection Failed] ${diagnosis}`);
  console.error(`Target URI: ${sanitizeURI(uri)}`);
  console.error('================================================================================');
  console.error('To fix this permanently:');
  console.error('  Option 1 (Local Persistent MongoDB):');
  console.error('    - Run "npm run db" to start persistent local MongoDB on port 27017.');
  console.error('    - Storage is saved persistently to "server/data/db" on your hard drive.');
  console.error('  Option 2 (MongoDB Atlas Cloud Database):');
  console.error('    - In server/.env, set MONGODB_URI to your Atlas cluster connection string:');
  console.error('      MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/stayeasy?retryWrites=true&w=majority');
  console.error('    - Ensure your IP is whitelisted (0.0.0.0/0) in Atlas Network Access tab.');
  console.error('================================================================================\n');

  // Prevent silent fallback to in-memory database in development and production
  if (process.env.ALLOW_MEMORY_DB === 'true' && ENV.NODE_ENV === 'test') {
    console.log('[Database Fallback] Explicit ALLOW_MEMORY_DB requested for isolated unit tests...');
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      memoryServerInstance = await MongoMemoryServer.create({ binary: { version: '6.0.14' } });
      const memUri = memoryServerInstance.getUri();
      const conn = await mongoose.connect(memUri, { dbName: 'stayeasy' });
      isConnected = conn.connections[0].readyState === 1;
      console.log(`[Database Fallback] Connected to In-Memory MongoDB: ${memUri}`);
      return;
    } catch (memErr) {
      console.error('[Database Fallback Error]:', memErr.message);
    }
  }

  // Fail fast with clear error: Do NOT hide this failure with an in-memory fallback
  throw new Error(`MongoDB connection failed: ${diagnosis}`);
};

mongoose.connection.on('connected', () => {
  isConnected = true;
  console.log(`[Database Event] Mongoose connected successfully to '${mongoose.connection.name}' database.`);
});

mongoose.connection.on('error', (err) => {
  isConnected = false;
  console.error(`[Database Event] Mongoose connection error: ${diagnoseMongoError(err)}`);
});

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  console.warn('[Database Event] Mongoose disconnected from MongoDB.');
});

export const getDBStatus = () => {
  const stateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  const state = mongoose.connection.readyState;
  return {
    state: stateMap[state] || 'unknown',
    isConnected: state === 1,
    host: mongoose.connection.host || null,
    name: mongoose.connection.name || null,
    isMemoryServer: !!memoryServerInstance,
  };
};
