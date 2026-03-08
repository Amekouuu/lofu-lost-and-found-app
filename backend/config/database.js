const mongoose = require('mongoose');

// ── Connection Options ───────────────────────────────────────────
const MONGOOSE_OPTIONS = {
  // Recommended Atlas options
  serverSelectionTimeoutMS: 5000,   // Fail fast if Atlas unreachable
  socketTimeoutMS: 45000,
  maxPoolSize: 10,                  // Connection pool
  minPoolSize: 2,
  retryWrites: true,
  w: 'majority',                    // Write concern
};

// ── Connection State Tracker ─────────────────────────────────────
let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    console.log('📦 MongoDB: Using existing connection');
    return;
  }

  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(
      '❌  MONGODB_URI is not defined in environment variables.\n' +
      '    Add it to your .env file:\n' +
      '    MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/lofu?retryWrites=true&w=majority'
    );
  }

  try {
    const conn = await mongoose.connect(uri, MONGOOSE_OPTIONS);
    isConnected = true;

    console.log(`
╔═══════════════════════════════════════════════╗
║  ✅  MongoDB Atlas Connected                  ║
║  Host : ${conn.connection.host.padEnd(35)} ║
║  DB   : ${conn.connection.name.padEnd(35)} ║
╚═══════════════════════════════════════════════╝
    `);

    // ── Connection Event Listeners ───────────────────────────────
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected. Attempting to reconnect...');
      isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅  MongoDB reconnected');
      isConnected = true;
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌  MongoDB connection error:', err.message);
      isConnected = false;
    });

  } catch (err) {
    console.error('❌  MongoDB connection failed:', err.message);
    process.exit(1); // Crash fast — app is useless without DB
  }
};

// ── Graceful Shutdown ────────────────────────────────────────────
const disconnectDB = async () => {
  if (isConnected) {
    await mongoose.connection.close();
    isConnected = false;
    console.log('🔌  MongoDB connection closed');
  }
};

process.on('SIGINT', async () => {
  await disconnectDB();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectDB();
  process.exit(0);
});

module.exports = { connectDB, disconnectDB };