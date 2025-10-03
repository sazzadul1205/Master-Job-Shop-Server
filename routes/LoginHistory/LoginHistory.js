const express = require("express");
const router = express.Router();
const { client } = require("../../config/db");
const { ObjectId } = require("mongodb");

// Collection for Login History
const LoginHistoryCollection = client
  .db("Master-Job-Shop")
  .collection("Login_History");

// GET - Fetch all login records
router.get("/", async (req, res) => {
  try {
    const records = await LoginHistoryCollection.find({}).toArray();
    res.status(200).json(records);
  } catch (err) {
    console.error(err);
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
