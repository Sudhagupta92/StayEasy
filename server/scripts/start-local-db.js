import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import { spawn, execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load server .env
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const DEFAULT_PORT = 27017;
const DB_PATH = path.resolve(__dirname, '../data/db');

// Helper to test if a process ID is currently running
export const isPidAlive = (pid) => {
  if (!pid || isNaN(pid)) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return false;
  }
};

// Check if a given host:port is listening
export const isPortListening = (port, host = '127.0.0.1', timeout = 1000) => {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let isConnected = false;

    socket.setTimeout(timeout);
    socket.once('connect', () => {
      isConnected = true;
      socket.destroy();
      resolve(true);
    });

    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });

    socket.once('error', () => {
      socket.destroy();
      resolve(false);
    });

    socket.connect(port, host);
  });
};

// Locate native mongod executable
export const findMongodExecutable = async () => {
  if (process.env.MONGOD_PATH && fs.existsSync(process.env.MONGOD_PATH)) {
    return process.env.MONGOD_PATH;
  }

  // 1. Check user cache from mongodb-memory-server download (prioritizing newest version, e.g. 6.0+)
  const userProfile = process.env.USERPROFILE || '';
  const candidateCache = path.join(userProfile, '.cache', 'mongodb-binaries');
  if (fs.existsSync(candidateCache)) {
    const files = fs.readdirSync(candidateCache).filter((f) => f.startsWith('mongod') && f.endsWith('.exe'));
    files.sort((a, b) => b.localeCompare(a, undefined, { numeric: true, sensitivity: 'base' }));
    if (files.length > 0) {
      return path.join(candidateCache, files[0]);
    }
  }

  // 2. Query mongodb-memory-server MongoBinary if installed
  try {
    const { MongoBinary } = await import('mongodb-memory-server');
    if (MongoBinary && typeof MongoBinary.getPath === 'function') {
      const binaryPath = await MongoBinary.getPath({ version: '6.0.14' });
      if (binaryPath && fs.existsSync(binaryPath)) {
        return binaryPath;
      }
    }
  } catch (e) {
    // Ignore and proceed to next candidate
  }

  // 3. Check standard Program Files locations on Windows
  const programFilesCandidates = [
    'C:\\Program Files\\MongoDB\\Server\\7.0\\bin\\mongod.exe',
    'C:\\Program Files\\MongoDB\\Server\\6.0\\bin\\mongod.exe',
    'C:\\Program Files\\MongoDB\\Server\\5.0\\bin\\mongod.exe',
  ];
  for (const candidate of programFilesCandidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  // 4. Check system PATH
  try {
    const whichCmd = process.platform === 'win32' ? 'where mongod' : 'which mongod';
    const output = execSync(whichCmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
    if (output) {
      const firstLine = output.split(/\r?\n/)[0];
      if (fs.existsSync(firstLine)) return firstLine;
    }
  } catch (e) {
    // Not in PATH
  }

  return null;
};

// Parse port from MONGODB_URI
export const getTargetPort = () => {
  const uri = process.env.MONGODB_URI || '';
  const portMatch = uri.match(/:(\d+)\/?/);
  return portMatch ? parseInt(portMatch[1], 10) : DEFAULT_PORT;
};

// Start persistent mongod with race-condition prevention & self-healing recovery
export const startPersistentMongod = async (options = {}) => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/stayeasy';
  const isLocal = uri.includes('127.0.0.1') || uri.includes('localhost');

  if (!isLocal) {
    console.log('[Local DB] Remote MongoDB detected in MONGODB_URI. No local daemon needed.');
    return { isRemote: true, isConnected: true };
  }

  const port = options.port || getTargetPort();
  const dbPath = options.dbPath || DB_PATH;

  // Step 1: Check if port is already active and accepting connections
  const alreadyRunning = await isPortListening(port);
  if (alreadyRunning) {
    console.log(`[Local DB] MongoDB is already active and listening on port ${port}.`);
    return { alreadyRunning: true, port };
  }

  // Step 2: Ensure persistent data directory exists
  if (!fs.existsSync(dbPath)) {
    fs.mkdirSync(dbPath, { recursive: true });
    console.log(`[Local DB] Created persistent storage directory: ${dbPath}`);
  }

  // Step 3: Prevent race condition between concurrent processes (e.g. concurrently running npm run db & server.js)
  const bootLockFile = path.join(dbPath, '.mongod_booting.lock');
  if (fs.existsSync(bootLockFile)) {
    try {
      const lockData = JSON.parse(fs.readFileSync(bootLockFile, 'utf8'));
      if (lockData.pid && isPidAlive(lockData.pid) && (Date.now() - lockData.timestamp < 20000)) {
        console.log(`[Local DB] Daemon boot in progress by PID ${lockData.pid}. Waiting for port ${port}...`);
        const startWait = Date.now();
        while (Date.now() - startWait < 20000) {
          await new Promise((r) => setTimeout(r, 300));
          if (await isPortListening(port)) {
            console.log(`✅ [Local DB] MongoDB is ready & accepting connections at 127.0.0.1:${port}.`);
            return { alreadyRunning: true, port };
          }
        }
      }
    } catch (e) {
      // Ignore corrupted boot lock
    }
    // Clean stale boot lock
    try { fs.unlinkSync(bootLockFile); } catch (e) {}
  }

  // Acquire boot lock for this process
  try {
    fs.writeFileSync(bootLockFile, JSON.stringify({ pid: process.pid, timestamp: Date.now() }));
  } catch (e) {}

  const releaseBootLock = () => {
    try {
      if (fs.existsSync(bootLockFile)) fs.unlinkSync(bootLockFile);
    } catch (e) {}
  };

  // Step 4: Handle stale mongod.lock after abnormal system shutdown / termination
  const lockFile = path.join(dbPath, 'mongod.lock');
  if (fs.existsSync(lockFile)) {
    let isStale = true;
    try {
      const lockContent = fs.readFileSync(lockFile, 'utf8').trim();
      if (lockContent) {
        const pid = parseInt(lockContent, 10);
        if (isPidAlive(pid)) {
          isStale = false;
        }
      }
    } catch (e) {}

    if (isStale) {
      console.log('[Local DB] Cleaning stale lock file from previous abnormal shutdown...');
      try {
        fs.unlinkSync(lockFile);
      } catch (e) {
        try {
          fs.writeFileSync(lockFile, '');
        } catch (e2) {}
      }
    }
  }

  const mongodBinary = await findMongodExecutable();
  if (!mongodBinary) {
    releaseBootLock();
    throw new Error(
      `[Local DB] Could not locate 'mongod.exe'.\n` +
      `Please ensure MongoDB Community Server is installed or set MONGOD_PATH in server/.env.\n` +
      `Alternatively, configure MongoDB Atlas in server/.env with: MONGODB_URI=mongodb+srv://...`
    );
  }

  console.log(`[Local DB] Launching persistent MongoDB on port ${port}...`);
  console.log(`[Local DB] Storage Engine: WiredTiger (Disk directory: ${dbPath})`);

  let isShuttingDown = false;
  let hasRepaired = false;
  let capturedErrors = [];

  const spawnMongod = () => {
    const proc = spawn(
      mongodBinary,
      ['--dbpath', dbPath, '--port', String(port), '--bind_ip', '127.0.0.1'],
      {
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: false,
      }
    );

    proc.stdout.on('data', (data) => {
      const text = data.toString();
      if (text.includes('"s":"E"') || text.includes('"s":"F"') || text.includes('exception')) {
        capturedErrors.push(text.trim());
        console.error(`[Local DB Mongod]: ${text.trim()}`);
      }
    });

    proc.stderr.on('data', (data) => {
      const errText = data.toString().trim();
      capturedErrors.push(errText);
      console.error(`[Local DB Stderr]: ${errText}`);
    });

    return proc;
  };

  let mongodProcess = spawnMongod();

  mongodProcess.on('exit', (code, signal) => {
    if (code !== 0 && code !== null && !hasRepaired && !isShuttingDown) {
      hasRepaired = true;
      console.log(`[Local DB] Detected unclean database shutdown (code ${code}). Running automatic WiredTiger recovery (--repair)...`);
      try {
        execSync(`"${mongodBinary}" --repair --dbpath "${dbPath}"`, { stdio: ['ignore', 'pipe', 'pipe'] });
        console.log('✅ [Local DB] Recovery complete. Relaunching mongod...');
        mongodProcess = spawnMongod();
      } catch (err) {
        console.error('[Local DB Recovery Error]:', err.message);
      }
    } else if (code !== 0 && code !== null && !isShuttingDown) {
      console.warn(`[Local DB] mongod process exited with code ${code} (signal: ${signal})`);
    }
  });

  // Step 5: Wait for port to become active
  let isReady = false;
  const start = Date.now();
  while (Date.now() - start < 20000) {
    await new Promise((r) => setTimeout(r, 250));
    if (await isPortListening(port)) {
      isReady = true;
      break;
    }
  }

  releaseBootLock();

  if (!isReady) {
    try {
      mongodProcess.kill();
    } catch (e) {}
    const recentErrors = capturedErrors.slice(-3).join('\n');
    throw new Error(
      `[Local DB] Timed out waiting for MongoDB to listen on port ${port}.\n${recentErrors}`
    );
  }

  console.log(`✅ [Local DB] MongoDB is ready & accepting connections at 127.0.0.1:${port}.`);

  // Handle clean exit on termination
  const cleanShutdown = () => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    releaseBootLock();
    if (mongodProcess && !mongodProcess.killed) {
      console.log('\n[Local DB] Stopping mongod process gracefully...');
      try {
        mongodProcess.kill('SIGINT');
      } catch (e) {}
    }
  };

  process.on('SIGINT', cleanShutdown);
  process.on('SIGTERM', cleanShutdown);
  process.on('exit', cleanShutdown);

  return { mongodProcess, port, dbPath };
};

// Stop persistent mongod daemon
export const stopPersistentMongod = async (options = {}) => {
  const port = options.port || getTargetPort();
  const dbPath = options.dbPath || DB_PATH;

  console.log(`[Local DB] Stopping MongoDB daemon on port ${port}...`);

  const lockFile = path.join(dbPath, 'mongod.lock');
  if (fs.existsSync(lockFile)) {
    try {
      const content = fs.readFileSync(lockFile, 'utf8').trim();
      const pid = parseInt(content, 10);
      if (pid && isPidAlive(pid)) {
        console.log(`[Local DB] Terminating mongod process with PID ${pid}...`);
        process.kill(pid, 'SIGINT');
      }
    } catch (e) {}
  }

  // Poll until port is no longer listening
  const start = Date.now();
  while (Date.now() - start < 5000) {
    if (!(await isPortListening(port))) {
      console.log(`✅ [Local DB] MongoDB on port ${port} has stopped.`);
      return true;
    }
    await new Promise((r) => setTimeout(r, 200));
  }

  const stopped = !(await isPortListening(port));
  if (stopped) {
    console.log(`✅ [Local DB] MongoDB on port ${port} is stopped.`);
  } else {
    console.warn(`[Local DB] MongoDB on port ${port} is still listening.`);
  }
  return stopped;
};

// If executed directly from CLI: node server/scripts/start-local-db.js [--stop]
if (process.argv[1] && process.argv[1].includes('start-local-db')) {
  if (process.argv.includes('--stop')) {
    stopPersistentMongod()
      .then(() => process.exit(0))
      .catch((err) => {
        console.error('❌ Stop error:', err.message);
        process.exit(1);
      });
  } else {
    (async () => {
      try {
        const result = await startPersistentMongod();
        if (result.alreadyRunning || result.isRemote) {
          process.exit(0);
        }
        console.log('[Local DB] Press Ctrl+C to stop persistent database server.');
      } catch (err) {
        console.error('❌', err.message);
        process.exit(1);
      }
    })();
  }
}
