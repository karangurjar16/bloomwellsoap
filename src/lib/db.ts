import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Missing MONGODB_URI in .env.local");
}

// Next.js hot-reloads modules in dev, which would open a fresh pool on every
// reload. Caching the promise on globalThis keeps exactly one pool per process.
const globalForMongoose = globalThis as typeof globalThis & {
  _mongoose?: Promise<typeof mongoose>;
};

// How long a buffered query waits for the pool before giving up. Global
// setting rather than a connect option.
mongoose.set("bufferTimeoutMS", 15_000);

// Each model checks/creates its indexes on first use — one round trip per
// model, ~31ms each, paid on every cold start. Dev creates them; production
// reuses what dev already built on the same cluster. If an index definition
// changes, run one dev boot against the cluster to apply it.
mongoose.set("autoIndex", process.env.NODE_ENV !== "production");

/**
 * Connection starts the moment this module is imported — no await needed at
 * the call site. Mongoose buffers commands issued before the socket is ready,
 * so `User.findOne()` on a cold start queues and runs once the pool is up.
 */
export const dbReady = (globalForMongoose._mongoose ??= mongoose
  .connect(MONGODB_URI, {
    // Sized for serverless. Every warm Vercel instance holds its own pool, so
    // a pre-warmed minPoolSize would multiply by the number of instances and
    // exhaust an Atlas M0's connection cap under traffic. 0 in / 5 max keeps
    // the total bounded; the cost is a TLS handshake on a cold instance.
    minPoolSize: 0,
    maxPoolSize: 5,

    serverSelectionTimeoutMS: 10_000,
    // Drop dead sockets quickly instead of waiting on the OS default.
    socketTimeoutMS: 45_000,

    // Reads go to the nearest healthy member. Safe here because the app never
    // reads a document expecting to see a write it just made in another
    // request; anything read-after-write happens in the same operation.
    readPreference: "primaryPreferred",

    writeConcern: { w: "majority" },
  })
  .catch((error: unknown) => {
    // Clear the cache so the next import retries instead of awaiting a
    // rejected promise forever.
    globalForMongoose._mongoose = undefined;
    throw error;
  }));
