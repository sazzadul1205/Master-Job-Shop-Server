const express = require("express");
const router = express.Router();
const { client } = require("../../config/db");
const { ObjectId } = require("mongodb");

const NotificationsCollection = client
  .db("Master-Job-Shop")
  .collection("Notifications");

// Get all notifications (with optional filters)
router.get("/", async (req, res) => {
  try {
    const { userEmail, mentorId, type, read, AppliedToId, applicationId } =
      req.query;

    // Build query object dynamically
    const query = {};
    if (userEmail) query.userEmail = userEmail;
    if (mentorId) query.mentorId = mentorId;
    if (type) query.type = type;
    if (AppliedToId) query.AppliedToId = AppliedToId;
    if (applicationId) query.applicationId = applicationId;
    if (read !== undefined) query.read = read === "true"; // convert string to boolean

    const notifications = await NotificationsCollection.find(query).toArray();
    res.json(notifications);
  } catch (err) {
    console.error("GET /Notifications error:", err);
    res.status(500).json({ message: err.message });
  }
});

// Get notifications grouped by day for a specific mentorEmail
router.get("/Status", async (req, res) => {
  try {
    // Extract mentorEmail from query parameters
    const { mentorEmail } = req.query;

    // Validate mentorEmail
    if (!mentorEmail) {
      return res.status(400).json({ message: "mentorEmail is required" });
    }

    // Fetch notifications for the given mentorEmail
    const notifications = await NotificationsCollection.find({
      mentorEmail,
    }).toArray();

    // Group notifications by day
    const grouped = {};

    // Iterate through notifications and group by date
    notifications.forEach((notify) => {
      const date = new Date(notify.createdAt).toISOString().split("T")[0]; // YYYY-MM-DD
      grouped[date] = (grouped[date] || 0) + 1;
    });

    // Convert grouped object to an array of { date, count } objects
    const result = Object.keys(grouped)
      .sort()
      .map((date) => ({ date, count: grouped[date] }));

    // Send the grouped result
    res.json(result);
  } catch (err) {
    console.error("Error fetching Notifications status:", error);
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
    const {
      title,
      message,
      userEmail,
      mentorId,
      type,
      AppliedToId,
      applicationId,
    } = req.body;

    // Check for missing fields
    const missingFields = [];
    if (!title) missingFields.push("title");
    if (!message) missingFields.push("message");
    if (!userEmail) missingFields.push("userEmail");
    if (!mentorId) missingFields.push("mentorId");
    if (!type) missingFields.push("type");
    if (!AppliedToId) missingFields.push("AppliedToId");
    if (!applicationId) missingFields.push("applicationId");

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: `Missing required field(s): ${missingFields.join(", ")}`,
      });
    }

    // Build notification object
    const notificationPayload = {
      title,
      message,
      userEmail,
      mentorId,
      type,
      AppliedToId,
      applicationId,
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

// Mark notification as read
router.patch("/Read/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Notification ID is required" });
    }

    const result = await NotificationsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { read: true } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({
      message: "Notification marked as read",
      modifiedCount: result.modifiedCount,
    });
  } catch (err) {
    console.error("PATCH /Notifications/read/:id error:", err);
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
