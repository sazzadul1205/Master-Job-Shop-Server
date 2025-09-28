const express = require("express");
const router = express.Router();
const cloudinary = require("cloudinary").v2;
const multer = require("multer");

// Multer memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper to upload PDF
function uploadToCloudinary(buffer, folder = "pdf_uploads") {
  return new Promise(function (resolve, reject) {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: "raw", folder: folder },
      function (error, result) {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
}

// PDF upload route
router.post("/", upload.single("file"), async function (req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const result = await uploadToCloudinary(req.file.buffer, "pdf_uploads");

    if (!result || !result.secure_url) {
      return res.status(500).json({ message: "Failed to upload PDF" });
    }

    res.json({ url: result.secure_url });
  } catch (err) {
    console.error("PDF upload error:", err);
    res.status(500).json({ message: "Server error during PDF upload" });
  }
});

module.exports = router;
