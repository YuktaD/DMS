import express from "express";
import multer from "multer";
import fs from "fs";
import cloudinary from "../config/cloudinary.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" }); // temporary folder

// ✅ Upload PDF to Cloudinary
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: "raw", // important for PDFs and other non-image files
    });

    // Delete temporary local file
    fs.unlinkSync(req.file.path);

    res.status(200).json({
      message: "File uploaded successfully",
      url: result.secure_url,
    });
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    res.status(500).json({ message: "Upload failed", error: error.message });
  }
});

export default router;
