const dotenv = require('dotenv');

dotenv.config({ path: './.env' });
const mongoose = require('mongoose');
const { databaseUrl, validateEnvironment } = require('./utils/env');

mongoose.set('autoIndex', false);

let server;
const shutdown = (reason, exitCode = 0) => {
  process.stdout.write(
    `${JSON.stringify({ level: 'info', event: 'shutdown', reason })}\n`,
  );
  const finish = async () => {
    await mongoose.connection.close().catch(() => {});
    process.exit(exitCode);
  };
  if (server) server.close(finish);
  else finish();
  setTimeout(() => process.exit(exitCode || 1), 10000).unref();
};

process.on('uncaughtException', (error) => {
  process.stderr.write(
    `${JSON.stringify({ level: 'error', event: 'uncaughtException', message: error.message })}\n`,
  );
  shutdown('uncaughtException', 1);
});

const start = async () => {
  const env = validateEnvironment();
  await mongoose.connect(databaseUrl(env), {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
  });
  const app = require('./app');
  server = app.listen(env.PORT, () => {
    process.stdout.write(
      `${JSON.stringify({ level: 'info', event: 'listening', port: env.PORT })}\n`,
    );
  });
};

start().catch((error) => {
  process.stderr.write(
    `${JSON.stringify({ level: 'error', event: 'startup', message: error.message })}\n`,
  );
  shutdown('startup', 1);
});

process.on('unhandledRejection', (error) => {
  process.stderr.write(
    `${JSON.stringify({ level: 'error', event: 'unhandledRejection', message: error.message })}\n`,
  );
  shutdown('unhandledRejection', 1);
});
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
