const express = require("express");
const router = express.Router();
const { client } = require("../../config/db");
const { ObjectId } = require("mongodb");

// MongoDB collection
const ImprovementSuggestionsCollection = client
  .db("Master-Job-Shop")
  .collection("ImprovementSuggestions");

// GET - Fetch all suggestions
router.get("/", async (req, res) => {
  try {
    const suggestions = await ImprovementSuggestionsCollection.find()
      .sort({ date: -1 })
      .toArray();

    res.status(200).json({
      success: true,
      count: suggestions.length,
      data: suggestions,
    });
  } catch (error) {
    console.error("Error fetching Improvement Suggestions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch improvement suggestions.",
      error: error.message,
    });
  }
});

// GET - Fetch a specific suggestion
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid ID format." });
    }

    const suggestion = await ImprovementSuggestionsCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!suggestion) {
      return res
        .status(404)
        .json({ success: false, message: "Suggestion not found." });
    }

    res.status(200).json({ success: true, data: suggestion });
  } catch (error) {
    console.error("Error fetching suggestion:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch the suggestion.",
      error: error.message,
    });
  }
});

// POST - Create a new improvement suggestion
router.post("/", async (req, res) => {
  try {
    const { userEmail, title, category, description, image, type, date } =
      req.body;

    // Simple validation
    if (!userEmail || !title || !category || !description) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: email, title, category, or description.",
      });
    }

    const suggestion = {
      userEmail,
      title,
      category,
      description,
      image: image || null,
      type: type || "Improvement Suggestion",
      date: date || new Date().toISOString(),
      status: "Pending", // Default status for tracking
    };

    const result = await ImprovementSuggestionsCollection.insertOne(suggestion);

    res.status(201).json({
      success: true,
      message: "Improvement suggestion created successfully.",
      data: result,
    });
  } catch (error) {
    console.error("Error creating suggestion:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create improvement suggestion.",
      error: error.message,
    });
  }
});

// PATCH - Update a suggestion
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid ID format." });
    }

    const updates = req.body;
    const result = await ImprovementSuggestionsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updates }
    );

    if (result.matchedCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Suggestion not found." });
    }

    res.status(200).json({
      success: true,
      message: "Improvement suggestion updated successfully.",
      data: result,
    });
  } catch (error) {
    console.error("Error updating suggestion:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update improvement suggestion.",
      error: error.message,
    });
  }
});

// DELETE - Delete a suggestion
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid ID format." });
    }

    const result = await ImprovementSuggestionsCollection.deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Suggestion not found." });
    }

    res.status(200).json({
      success: true,
      message: "Improvement suggestion deleted successfully.",
      data: result,
    });
  } catch (error) {
    console.error("Error deleting suggestion:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete improvement suggestion.",
      error: error.message,
    });
  }
});

module.exports = router;
