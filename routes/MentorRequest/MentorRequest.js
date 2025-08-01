const express = require("express");
const router = express.Router();
const { client } = require("../../config/db");
const { ObjectId } = require("mongodb");

const MentorRequestCollection = client
  .db("Master-Job-Shop")
  .collection("MentorRequest");

// GET - Fetch all mentor requests
router.get("/", async (req, res) => {
  try {
    const { _id, userId, userEmail, status } = req.query;
    const query = {};

    if (_id) {
      if (!ObjectId.isValid(_id)) {
        return res.status(400).json({ message: "Invalid _id format" });
      }
      query._id = new ObjectId(_id);
    }

    if (userId) query.userId = userId;
    if (userEmail) query.userEmail = userEmail;
    if (status) query.status = status;

    const requests = await MentorRequestCollection.find(query).toArray();
    res.status(200).json(requests);
  } catch (error) {
    console.error("Error fetching mentor requests:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// POST - Submit a new mentor request
router.post("/", async (req, res) => {
  try {
    const requestData = req.body;

    if (!requestData || !requestData.contactEmail || !requestData.contactName) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    requestData.status = "pending";
    requestData.createdAt = new Date();

    const result = await MentorRequestCollection.insertOne(requestData);

    res.status(201).json({
      message: "Mentor request submitted successfully",
      insertedId: result.insertedId,
    });
  } catch (error) {
    console.error("Error submitting mentor request:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// DELETE - Remove a mentor request by ID
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id))
      return res.status(400).json({ message: "Invalid ID format" });

    const result = await MentorRequestCollection.deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Mentor request not found" });
    }

    res.status(200).json({ message: "Mentor request deleted successfully" });
  } catch (error) {
    console.error("Error deleting mentor request:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
