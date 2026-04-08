const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let memoryServer;

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

  try {
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected successfully');
  } catch (error) {
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
    } catch (memoryError) {
      console.error('In-memory MongoDB fallback failed.');
      console.error(`Reason: ${memoryError.message}`);
      console.error('Backend will stay running, but database operations will fail until MongoDB is available.');
    }
  }
};

module.exports = connectDB;
