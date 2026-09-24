import mongoose from "mongoose";
import { env } from "@/lib/env";

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

// Cached on globalThis so that warm serverless invocations and dev-mode HMR
// reuse one connection pool instead of opening a new one per request/reload.
const globalForMongoose = globalThis as typeof globalThis & {
  _mongoose?: MongooseCache;
};

const cached: MongooseCache = (globalForMongoose._mongoose ??= {
  conn: null,
  promise: null,
});

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(env().MONGODB_URI, {
      bufferCommands: false, // fail fast instead of queueing queries while disconnected
      maxPoolSize: 10, // per instance; keep pool × max instances under the cluster's connection limit
      serverSelectionTimeoutMS: 5_000,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null; // let the next call retry instead of re-throwing a stale rejection
    throw error;
  }

  return cached.conn;
}
