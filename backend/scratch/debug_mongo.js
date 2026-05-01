const { MongoStore } = require('connect-mongo');
console.log('MongoStore keys:', Object.keys(MongoStore));
console.log('MongoStore.create type:', typeof MongoStore.create);
