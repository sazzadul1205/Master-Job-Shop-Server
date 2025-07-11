const express = require("express");
const router = express.Router();
const { upload } = require("../../config/cloudinary");

router.post("/", upload.single("file"), (req, res) => {
  const fileUrl = req.file.path;
  res.json({ url: fileUrl });
});

module.exports = router;
