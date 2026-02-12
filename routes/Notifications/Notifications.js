const express = require("express");
const router = express.Router();
const { client } = require("../../config/db");
const { ObjectId } = require("mongodb");

const NotificationsCollection = client
  .db("Master-Job-Shop")
  .collection("Notifications");

// GET - Fetch all notifications
router.get("/", async (req, res) => {
  try {
    const { userEmail, mentorId, type, read, AppliedToId, applicationId } =
      req.query;

    const query = {};
    if (userEmail) query.userEmail = userEmail;
    if (mentorId) query.mentorEmail = mentorId; // <-- use mentorEmail
    if (type) query.type = type;
    if (AppliedToId) query.AppliedToId = AppliedToId;
    if (applicationId) query.applicationId = applicationId;
    if (read !== undefined) query.read = read === "true";

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

// GET: Check if mentor has any notifications
router.get("/CheckMentor", async (req, res) => {
  const { mentorId } = req.query;

  // Handle missing or empty email safely
  if (!mentorId || mentorId.trim() === "") {
    return res.status(200).json({ hasNotifications: false, count: 0 });
  }

  try {
    // Case-insensitive search for mentor notifications
    const count = await NotificationsCollection.countDocuments({
      mentorId: { $regex: new RegExp(`^${mentorId}$`, "i") },
    });

    // Always return a safe structured response
    return res.status(200).json({
      hasNotifications: count > 0,
      count,
    });
  } catch (error) {
    console.error("Error checking mentor notifications:", error);
    // Fallback response — avoid throwing a 500 to frontend
    return res.status(200).json({ hasNotifications: false, count: 0 });
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
    const notificationPayload = {
      ...req.body, // Accept all fields sent by client
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

// DELETE: Bulk Delete Notification by IDs
router.delete("/BulkDelete", async (req, res) => {
  try {
    const { ids } = req.body; // Expecting { ids: ["id1", "id2", ...] }

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No IDs provided." });
    }

    // Validate IDs
    const objectIds = [];
    const invalidIds = [];

    ids.forEach((id) => {
      if (!ObjectId.isValid(id)) {
        invalidIds.push(id);
      } else {
        objectIds.push(new ObjectId(id));
      }
    });

    if (invalidIds.length > 0) {
      return res
        .status(400)
        .json({ message: `Invalid ID(s): ${invalidIds.join(", ")}` });
    }

    // Delete Notifications
    const deleteResult = await NotificationsCollection.deleteMany({
      _id: { $in: objectIds },
    });

    res.status(200).json({
      message: `Successfully deleted ${deleteResult.deletedCount} Notification(s).`,
      deletedCount: deleteResult.deletedCount,
      deletedIds: ids,
    });
  } catch (error) {
    console.error("Bulk delete Notification error:", error);
    res
      .status(500)
      .json({ message: "Server error during bulk delete of Notification's." });
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
