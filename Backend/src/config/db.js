import mongoose from "mongoose";

export const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  // console.log(uri);

  if (!uri) {
    throw new Error("MONGO_URI missing");
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log("✅ MongoDB connected successfully");

  } catch (err) {
    console.error("❌ MongoDB connection FAILED");
    console.error(err);
    throw err;   // 🔥 THIS IS THE KEY
  }
};
