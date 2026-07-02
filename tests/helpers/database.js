const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

beforeAll(async () => {
  const systemBinary = process.env.MONGOMS_SYSTEM_BINARY;
  mongoServer = await MongoMemoryServer.create({
    binary: systemBinary ? { systemBinary } : undefined,
  });
  await mongoose.connect(mongoServer.getUri());
  await Promise.all(
    Object.values(mongoose.models).map((model) => model.createIndexes()),
  );
});

afterEach(async () => {
  if (mongoose.connection.readyState === 1) {
    await Promise.all(
      Object.values(mongoose.connection.collections).map((collection) =>
        collection.deleteMany({}),
      ),
    );
  }
  jest.restoreAllMocks();
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});
