const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");
const { client } = require("../config/db");

const HomeBannerCollection = client
  .db("Master-Job-Shop")
  .collection("Home-Banner");

// GET: Retrieve all Home Banners
router.get("/", async (req, res) => {
  try {
    const banners = await HomeBannerCollection.find().toArray();
    res.status(200).json(banners.length === 1 ? banners[0] : banners);
  } catch (error) {
    console.error("Error fetching Home Banners:", error);
    res.status(500).json({ message: "Failed to fetch home banners." });
  }
});

// POST: Add a new Home Banner
router.post("/", async (req, res) => {
  const newBanner = req.body;

  try {
    const result = await HomeBannerCollection.insertOne(newBanner);
    res.status(201).json({
      message: "Home banner added successfully.",
      insertedId: result.insertedId,
    });
  } catch (error) {
    console.error("Error adding Home Banner:", error);
    res.status(500).json({ message: "Failed to add home banner." });
  }
});

// PUT: Update a Home Banner by ID
router.put("/:id", async (req, res) => {
  const id = req.params.id;
  const updatedData = req.body;

  try {
    const result = await HomeBannerCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedData }
    );

    if (result.modifiedCount > 0) {
      res.status(200).json({ message: "Home banner updated successfully." });
    } else {
      res
        .status(404)
        .json({ message: "Home banner not found or no change made." });
    }
  } catch (error) {
    console.error("Error updating Home Banner:", error);
    res.status(500).json({ message: "Failed to update home banner." });
  }
});

// DELETE: Remove a Home Banner by ID
router.delete("/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const result = await HomeBannerCollection.deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount > 0) {
      res.status(200).json({ message: "Home banner deleted successfully." });
    } else {
      res.status(404).json({ message: "Home banner not found." });
    }
  } catch (error) {
    console.error("Error deleting Home Banner:", error);
    res.status(500).json({ message: "Failed to delete home banner." });
  }
});

module.exports = router;
