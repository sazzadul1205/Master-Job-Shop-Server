const express = require("express");
const router = express.Router();
const { client } = require("../../config/db");
const { ObjectId } = require("mongodb");

const EventCollection = client
  .db("Master-Job-Shop")
  .collection("Event-Applications");

// GET: Fetch all or filtered applications
router.get("/", async (req, res) => {
  try {
    const { id, eventId, email, phone } = req.query;
    const query = {};

    if (id) {
      try {
        query._id = new ObjectId(id);
      } catch (err) {
        return res.status(400).json({ message: "Invalid ID format." });
      }
    }
    if (eventId) query.eventId = eventId;
    if (email) query.email = email;
    if (phone) query.phone = phone;

    const results = await EventCollection.find(query).toArray();

    res.json(results.length === 1 ? results[0] : results);
  } catch (error) {
    console.error("GET /EventApplications error:", error);
    res.status(500).json({ message: "Server error fetching applications." });
  }
});

// GET: Check if a user already applied for a specific Event
router.get("/Exists", async (req, res) => {
  try {
    const { email, eventId } = req.query;

    if (!email || !eventId) {
      return res.status(400).json({ message: "Missing email or eventId." });
    }

    const applicationExists = await EventCollection.findOne({
      email,
      eventId,
    });

    res.json({ exists: !!applicationExists });
  } catch (error) {
    console.error("GET /EventApplications/Exists error:", error);
    res
      .status(500)
      .json({ message: "Server error checking application status." });
  }
});

// POST: Submit new application
router.post("/", async (req, res) => {
  try {
    const application = req.body;

    if (!application || !application.eventId || !application.email) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const result = await EventCollection.insertOne(application);
    res.status(201).json({ insertedId: result.insertedId });
  } catch (error) {
    console.error("POST /EventApplications error:", error);
    res.status(500).json({ message: "Server error submitting application." });
  }
});

module.exports = router;
