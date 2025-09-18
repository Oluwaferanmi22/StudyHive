const mongoose = require('mongoose');

const DEFAULT_LOCAL_URI = 'mongodb://127.0.0.1:27017/StudyHive';

function isSrvDnsFailure(err) {
  if (!err) return false;
  const msg = String(err.message || '').toLowerCase();
  return (
    msg.includes('eservfail') ||
    msg.includes('enotfound') ||
    msg.includes('querysrv') ||
    msg.includes('_mongodb._tcp')
  );
}

async function tryConnect(uri, label = 'primary') {
  const opts = {
    serverSelectionTimeoutMS: 8000,
    socketTimeoutMS: 20000,
  };
  const conn = await mongoose.connect(uri, opts);
  console.log(`✅ MongoDB Connected (${label}): ${conn.connection.host}`);
  return conn;
}

const connectDB = async () => {
  const primaryUri = process.env.MONGODB_URI;
  const fallbackEnv = process.env.MONGODB_FALLBACK_URI;
  const fallbackUri = fallbackEnv || DEFAULT_LOCAL_URI;

  try {
    await tryConnect(primaryUri, 'primary');
  } catch (error) {
    console.error('❌ Database connection failed (primary):', error.message);
    if (isSrvDnsFailure(error)) {
      console.warn('🌐 Detected SRV/TXT DNS failure. Attempting fallback MongoDB URI...');
      try {
        await tryConnect(fallbackUri, fallbackEnv ? 'fallback' : 'local-default');
      } catch (fallbackError) {
        console.error('❌ Database connection failed (fallback):', fallbackError.message);
        process.exit(1);
      }
    } else {
      process.exit(1);
    }
  }

  // Connection event listeners
  mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.log('⚠️  MongoDB disconnected');
  });

  process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('🔒 MongoDB connection closed through app termination');
    process.exit(0);
  });
};

module.exports = connectDB;
