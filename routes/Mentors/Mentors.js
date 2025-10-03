const express = require("express");
const router = express.Router();
const { client } = require("../../config/db");
const { ObjectId } = require("mongodb");

// Collection for Mentors
const MentorsCollection = client.db("Master-Job-Shop").collection("Mentors");

// GET - Fetch all mentors or by id/email
router.get("/", async (req, res) => {
  try {
    const { id, email } = req.query;
    let query = {};

    // Search by ID
    if (id) {
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      query._id = new ObjectId(id);
    }

    // Search by Email
    if (email) {
      query.email = email.trim().toLowerCase(); // normalize email
    }

    const mentors = await MentorsCollection.find(query).toArray();

    if (!mentors || mentors.length === 0) {
      return res.status(404).json({ message: "No mentor(s) found." });
    }

    // If only one result, return an object instead of array
    const response = mentors.length === 1 ? mentors[0] : mentors;
    return res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching Mentors:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// POST - Create a new mentor
router.post("/", async (req, res) => {
  try {
    const mentorData = req.body;

    if (!mentorData?.email) {
      return res.status(400).json({ message: "Email is required" });
    }

    mentorData.createdAt = new Date();
    const result = await MentorsCollection.insertOne(mentorData);

    return res.status(201).json(result);
  } catch (error) {
    console.error("Error adding mentor:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// PUT - Update a mentor by ID
router.put("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const updateData = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    if (updateData._id) delete updateData._id;

    const result = await MentorsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Mentor not found" });
    }

    const updatedMentor = await MentorsCollection.findOne({
      _id: new ObjectId(id),
    });
    return res.status(200).json(updatedMentor);
  } catch (error) {
    console.error("Error updating mentor:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// PATCH - Deactivate mentor
router.patch("/Deactivate", async (req, res) => {
  try {
    const { email, deactivate, deactivateUntil } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    // Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    // Update fields
    const updateDoc = {
      $set: {
        deactivate: !!deactivate,
        deactivateUntil: deactivateUntil || null,
        updatedAt: new Date(),
      },
    };

    const result = await MentorsCollection.updateOne(
      { email: normalizedEmail },
      updateDoc
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Mentor not found." });
    }

    return res
      .status(200)
      .json({ message: "Mentor deactivated successfully." });
  } catch (error) {
    console.error("Error deactivating mentor:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// DELETE - Delete a mentor by ID
router.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const result = await MentorsCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Mentor not found" });
    }

    return res.status(200).json({ message: "Mentor deleted successfully" });
  } catch (error) {
    console.error("Error deleting mentor:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
});

module.exports = router;
