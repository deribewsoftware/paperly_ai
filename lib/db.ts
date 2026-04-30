import mongoose from "mongoose";

declare global {
  var mongooseConnection:
    | {
        conn: typeof mongoose | null;
        promise: Promise<typeof mongoose> | null;
      }
    | undefined;
}

const globalCache = global.mongooseConnection ?? {
  conn: null,
  promise: null,
};

if (!global.mongooseConnection) {
  global.mongooseConnection = globalCache;
}

export async function connectToDatabase() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is not configured.");
  }

  if (globalCache.conn) {
    return globalCache.conn;
  }

  if (!globalCache.promise) {
    globalCache.promise = mongoose.connect(uri, {
      dbName: "paperly_ai",
    });
  }

  globalCache.conn = await globalCache.promise;
  return globalCache.conn;
}
