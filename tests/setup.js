const os = require('os');
const path = require('path');
const fs = require('fs');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-that-is-long-enough';
process.env.JWT_EXPIRES_IN = '1h';
process.env.JWT_COOKIE_EXPIRES_IN = '1';
process.env.MONGOMS_DOWNLOAD_DIR = path.join(os.tmpdir(), 'mongodb-binaries');
process.env.MONGOMS_SYSTEM_BINARY_VERSION_CHECK = 'false';
if (process.platform === 'win32') {
  const localMongoBinary =
    'C:\\Program Files\\MongoDB\\Server\\8.2\\bin\\mongod.exe';
  if (!process.env.MONGOMS_SYSTEM_BINARY && fs.existsSync(localMongoBinary)) {
    process.env.MONGOMS_SYSTEM_BINARY = localMongoBinary;
  }
}

jest.setTimeout(60000);
