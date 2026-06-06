import mongoose from "mongoose";

// Dynamic import to avoid 'net' module error during Next.js build
// mongodb-memory-server uses Node.js native modules not available in browser context
let MongoMemoryServer;

async function getMongoMemoryServer() {
  if (!MongoMemoryServer) {
    const mod = await import("mongodb-memory-server");
    MongoMemoryServer = mod.MongoMemoryServer;
  }
  return MongoMemoryServer;
}

let connectionPromise;
const DEFAULT_DB_NAME = "TechNest";

function resolveDbName(uri) {
  const explicitDbName = process.env.MONGODB_DB_NAME?.trim();
  if (explicitDbName) return explicitDbName;

  try {
    const parsed = new URL(uri);
    const pathDb = parsed.pathname?.replace("/", "").trim();
    if (pathDb) return undefined;
  } catch {
    // Ignore URL parse issues and fall back to default db name.
  }

  return DEFAULT_DB_NAME;
}

export async function initMongoose() {
  if (connectionPromise) {
    return connectionPromise;
  }

  if (mongoose.connection.readyState === 1) {
    connectionPromise = mongoose.connection.asPromise();
    return connectionPromise;
  }

  connectionPromise = (async () => {
    const uri = process.env.MONGODB_URL;
    if (uri && uri.trim().length > 0) {
      const dbName = resolveDbName(uri);
      const options = dbName ? { dbName } : undefined;
      const connection = await mongoose.connect(uri, options);
      return connection;
    }

    const MMS = await getMongoMemoryServer();
    const mongoServer = await MMS.create();
    const localUri = mongoServer.getUri();
    await mongoose.connect(localUri);
    await seedProducts();
  })();

  return connectionPromise;
}
