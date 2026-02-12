const express = require("express");
const router = express.Router();
const { client } = require("../../config/db");
const { ObjectId } = require("mongodb");

// Collection for Login History
const LoginHistoryCollection = client
  .db("Master-Job-Shop")
  .collection("Login_History");

// GET - Fetch recent login history by email/uid (just return, no delete)
router.get("/", async (req, res) => {
  try {
    const { email, uid } = req.query;

    if (!email && !uid) {
      return res.status(400).json({ error: "Email or UID required" });
    }

    // Build query filter
    const filter = {};
    if (email) filter.email = email;
    if (uid) filter.uid = uid;

    // Fetch recent 10 logins (newest first)
    const records = await LoginHistoryCollection.find(filter)
      .sort({ loginTime: -1 })
      .limit(10)
      .toArray();

    res.json(records);
  } catch (err) {
    console.error("Error fetching login history:", err);
    res.status(500).json({ error: "Failed to fetch login history" });
  }
});

// GET - Fetch a single login record by ID
router.get("/:id", async (req, res) => {
  try {
    const record = await LoginHistoryCollection.findOne({
      _id: new ObjectId(req.params.id),
    });
    if (!record) return res.status(404).json({ error: "Record not found" });
    res.status(200).json(record);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch login record" });
  }
});

// POST - Add a new login record
router.post("/", async (req, res) => {
  try {
    const { uid, email } = req.body;

    if (!uid || !email) {
      return res.status(400).json({ error: "Missing uid or email" });
    }

    // Fetch client IP (supports proxies like nginx)
    const clientIp =
      req.headers["x-forwarded-for"]?.split(",").shift().trim() ||
      req.socket?.remoteAddress ||
      "Unknown";

    // Fetch user agent
    const userAgent = req.headers["user-agent"] || "Unknown";

    // Construct login record
    const newRecord = {
      uid,
      email,
      ip: clientIp,
      userAgent,
      loginTime: new Date(),
    };

    const result = await LoginHistoryCollection.insertOne(newRecord);

    res.status(201).json({
      message: "Login record added successfully",
      id: result.insertedId,
      ip: clientIp,
      userAgent,
    });
  } catch (err) {
    console.error("Error adding login record:", err);
    res.status(500).json({ error: "Failed to add login record" });
  }
});

// PUT - Update a login record by ID
router.put("/:id", async (req, res) => {
  try {
    const updatedRecord = req.body;
    const result = await LoginHistoryCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updatedRecord }
    );
    if (result.matchedCount === 0)
      return res.status(404).json({ error: "Record not found" });
    res.status(200).json({ message: "Login record updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update login record" });
  }
});

// DELETE - Cleanup old login records (keep 20, delete the rest)
router.delete("/cleanup", async (req, res) => {
  try {
    const { email, uid } = req.query;

    if (!email && !uid) {
      return res.status(400).json({ error: "Email or UID required" });
    }

    const filter = {};
    if (email) filter.email = email;
    if (uid) filter.uid = uid;

    // Fetch all logins sorted by newest first
    const allRecords = await LoginHistoryCollection.find(filter)
      .sort({ loginTime: -1 })
      .toArray();

    const keepRecords = allRecords.slice(0, 20);
    const deleteRecords = allRecords.slice(20);

    if (deleteRecords.length > 0) {
      const deleteIds = deleteRecords.map((rec) => rec._id);
      await LoginHistoryCollection.deleteMany({ _id: { $in: deleteIds } });
    }

    res.json({
      message: "Cleanup done",
      kept: keepRecords.length,
      deleted: deleteRecords.length,
    });
  } catch (err) {
    console.error("Error cleaning up login history:", err);
    res.status(500).json({ error: "Failed to cleanup login history" });
  }
});

// DELETE - Remove a login record by ID
router.delete("/:id", async (req, res) => {
  try {
    const result = await LoginHistoryCollection.deleteOne({
      _id: new ObjectId(req.params.id),
    });
    if (result.deletedCount === 0)
      return res.status(404).json({ error: "Record not found" });
    res.status(200).json({ message: "Login record deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete login record" });
  }
});

module.exports = router;
