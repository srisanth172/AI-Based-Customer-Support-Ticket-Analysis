const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let memoryServer;

const isTruthy = (value) => String(value || '').toLowerCase() === 'true';

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  const allowInMemoryDb = isTruthy(process.env.ALLOW_IN_MEMORY_DB);

  if (!mongoUri && !allowInMemoryDb) {
    throw new Error('MONGODB_URI (or MONGO_URI) is required when ALLOW_IN_MEMORY_DB is false.');
  }

  try {
    if (mongoUri) {
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
        retryWrites: true,
        maxPoolSize: 10,
      });
      console.log('MongoDB connected successfully');
      return mongoose.connection;
    }
    throw new Error('No MongoDB URI configured.');
  } catch (error) {
    if (!allowInMemoryDb) {
      throw error;
    }

    console.warn('MongoDB connection failed, starting in-memory MongoDB for development.');
    console.warn(`Reason: ${error.message}`);

    try {
      process.env.MONGOMS_STARTUP_TIMEOUT = process.env.MONGOMS_STARTUP_TIMEOUT || '120000';
      memoryServer = await MongoMemoryServer.create({
        instance: {
          dbName: 'support_system',
          storageEngine: 'wiredTiger',
        },
      });
      const memoryUri = memoryServer.getUri();
      process.env.MONGODB_URI = memoryUri; // Set it so other parts of the app can use it

      await mongoose.connect(memoryUri);
      console.log('In-memory MongoDB connected successfully');

      const shutdown = async () => {
        await mongoose.connection.close();
        if (memoryServer) {
          await memoryServer.stop();
        }
        process.exit(0);
      };

      process.once('SIGINT', shutdown);
      process.once('SIGTERM', shutdown);
      return mongoose.connection;
    } catch (memoryError) {
      console.error('In-memory MongoDB fallback failed.');
      console.error(`Reason: ${memoryError.message}`);
      throw memoryError;
    }
  }
};

module.exports = connectDB;
