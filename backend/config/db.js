import mongoose from "mongoose";

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/shopkart";

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.warn(`⚠️ Primary MongoDB connection failed (${error.message}).`);
    console.log("Attempting fallback to embedded in-memory MongoDB...");

    try {
      const { MongoMemoryServer } = await import("mongodb-memory-server");
      const memServer = await MongoMemoryServer.create({
        instance: { dbName: "shopkart" },
      });
      const memoryUri = memServer.getUri();
      const conn = await mongoose.connect(memoryUri);
      console.log(`✅ In-Memory MongoDB Connected at: ${memoryUri}`);
      return conn;
    } catch (fallbackError) {
      console.error("❌ Failed to start MongoDB:", fallbackError.message);
      console.log("Please ensure a MongoDB instance is running or update MONGODB_URI in .env");
    }
  }
};

export { connectDB };
