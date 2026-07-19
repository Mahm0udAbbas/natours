const mongoose = require('mongoose');
const { databaseUrl } = require('./env');

mongoose.set('autoIndex', false);

let connectionPromise;

exports.connectDatabase = async (env) => {
  if (mongoose.connection.readyState === 1) return mongoose.connection;

  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(databaseUrl(env), {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
      })
      .catch((error) => {
        connectionPromise = undefined;
        throw error;
      });
  }

  await connectionPromise;
  return mongoose.connection;
};
