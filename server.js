const dotenv = require('dotenv');

dotenv.config({ path: './.env' });
const mongoose = require('mongoose');

process.on('uncaughtException', (err) => {
  console.log(err, err.name);
  console.log('UNHANDLED REJECTION , Shutting down');

  process.exit(1);
});
const app = require('./app');

// Use local DB or remote DB from .env
const DB_LOCAL = process.env.DATABASE_LOCAL;
// const DB_REMOTE = process.env.DATABASE.replace(
//   '<PASSWORD>',
//   process.env.DATABASE_PASSWORD,
// );

// Connect to MongoDB
mongoose
  .connect(DB_LOCAL) // you can replace with DB_REMOTE if you want
  .then(() => console.log('DB connection successful!'));
// .catch((err) => console.error('DB connection failed:', err.message));

// --- Start server ---
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`Server listening on port ${port}...`);
});

process.on('unhandledRejection', (err) => {
  console.log(err, err.name);
  console.log('UNHANDLED REJECTION , Shutting down');

  server.close(() => {
    process.exit(1);
  });
});
