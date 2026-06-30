import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import uploadRoute from "./routes/uploadRoute.js";

// Fix __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
// dotenv.config({ path: path.join(__dirname, "config/config.env") });
dotenv.config({ path: "./config/config.env" });

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./config/mongodb.js";
import adminRouter from "./routes/adminRoute.js";
import connectCloudinary from "./config/cloudinary.js";
import documentRoutes from "./routes/documentRoute.js";
import userRouter from "./routes/userRoute.js";
const app = express();



// Connect to DB and Cloudinary
connectDB();
connectCloudinary();

// CORS
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URI,
      process.env.FRONTEND_URI_SECOND,
      process.env.FRONTEND_URI_THIRD,
    ].filter(Boolean),
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/admin", adminRouter);
app.use("/api/documents", documentRoutes);
app.use("/api/users", userRouter);
// app.use("/uploads", express.static("uploads"));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api", uploadRoute);


// Check env variables
// console.log("Frontend 1:", process.env.FRONTEND_URI);
// console.log("Frontend 2:", process.env.FRONTEND_URI_SECOND);
// console.log("Frontend 3:", process.env.FRONTEND_URL_THIRD);
// console.log("PORT:", process.env.PORT);
console.log("Mongo_URI:", process.env.MONGO_URI ? "Database Connected ✅" : "❌ Not loaded");

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
