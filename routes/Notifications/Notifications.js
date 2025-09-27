const express = require("express");
const router = express.Router();
const { client } = require("../../config/db");
const { ObjectId } = require("mongodb");

const NotificationsCollection = client
  .db("Master-Job-Shop")
  .collection("Notifications");

// Get all notifications
router.get("/", async (req, res) => {
  try {
    const notifications = await NotificationsCollection.find({}).toArray();
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a single notification by ID
router.get("/:id", async (req, res) => {
  try {
    const notification = await NotificationsCollection.findOne({
      _id: new ObjectId(req.params.id),
    });
    if (!notification) return res.status(404).json({ message: "Not found" });
    res.json(notification);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a new notification with required fields validation
router.post("/", async (req, res) => {
  try {
    const { title, message, userId, type, referenceId } = req.body;

    // Check for missing fields
    const missingFields = [];
    if (!title) missingFields.push("title");
    if (!message) missingFields.push("message");
    if (!userId) missingFields.push("userId");
    if (!type) missingFields.push("type");
    if (!referenceId) missingFields.push("referenceId");

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: `Missing required field(s): ${missingFields.join(", ")}`,
      });
    }

    const notificationPayload = {
      title,
      message,
      userId,
      type,
      referenceId,
      createdAt: new Date().toISOString(),
      read: false,
    };

    const result = await NotificationsCollection.insertOne(notificationPayload);
    res.status(201).json({ insertedId: result.insertedId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update a notification by ID
router.put("/:id", async (req, res) => {
  try {
    const result = await NotificationsCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: req.body }
    );
    res.json({ modifiedCount: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete a notification by ID
router.delete("/:id", async (req, res) => {
  try {
    const result = await NotificationsCollection.deleteOne({
      _id: new ObjectId(req.params.id),
    });
    res.json({ deletedCount: result.deletedCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
