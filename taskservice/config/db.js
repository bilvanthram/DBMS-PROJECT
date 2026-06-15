import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const DBURL = process.env.DBURL;

let db;

export async function connectDB() {
    try {
        if (!DBURL) {
            throw new Error("DBURL is missing in .env file");
        }

        if (!db) {
            db = await mongoose.connect(DBURL, {
                serverSelectionTimeoutMS: 30000,
                family: 4
            });

            console.log("MongoDB connected successfully");
        }

        return db;
    } catch (error) {
        console.error("MongoDB connection failed:", error.message);
        process.exit(1);
    }
}
