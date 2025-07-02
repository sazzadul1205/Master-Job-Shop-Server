const express = require("express");
const router = express.Router();
const { client } = require("../config/db");

const HomeBannerCollection = client
  .db("Master-Job-Shop")
  .collection("Home-Banner");

// GET: Retrieve all Home Banners
router.get("/", async (req, res) => {
  try {
    const banners = await HomeBannerCollection.find().toArray();
    res.status(200).json(banners);
  } catch (error) {
    console.error("Error fetching Home Banners:", error);
    res.status(500).json({ message: "Failed to fetch home banners." });
  }
});

module.exports = router;
