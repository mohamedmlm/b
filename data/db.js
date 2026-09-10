const mongoose = require("mongoose");
require("dotenv").config();

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  throw new Error("Please define the MONGO_URI environment variable");
}

// ✅ الـ caching ده أساسي على Vercel: كل cold start بيعيد تنفيذ الملف من الأول،
// فمن غير الـ cache ده هيتفتح اتصال جديد بـ MongoDB مع كل استدعاء وهيوصلك بسرعة
// لحد الـ connection pool limit بتاع Atlas تحت أي حمل حقيقي.
let cached = global._mongooseConnection;

if (!cached) {
  cached = global._mongooseConnection = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGO_URI, {
        bufferCommands: false,
      })
      .then((mongooseInstance) => {
        console.log("MongoDB connected");
        return mongooseInstance;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    console.log("MongoDB connection error:", err.message);
    throw err;
  }

  return cached.conn;
};

module.exports = connectDB;