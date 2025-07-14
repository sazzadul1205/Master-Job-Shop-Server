const express = require("express");
const router = express.Router();
const { client } = require("../../config/db");
const { ObjectId } = require("mongodb");

const MentorshipCollection = client
  .db("Master-Job-Shop")
  .collection("Mentorship-Applications");

// GET: Fetch all or filtered applications
router.get("/", async (req, res) => {
  try {
    const { id, mentorshipId, email, phone } = req.query;
    const query = {};

    if (id) {
      try {
        query._id = new ObjectId(id);
      } catch (err) {
        return res.status(400).json({ message: "Invalid ID format." });
      }
    }
    if (mentorshipId) query.mentorshipId = mentorshipId;
    if (email) query.email = email;
    if (phone) query.phone = phone;

    const results = await MentorshipCollection.find(query).toArray();

    res.json(results.length === 1 ? results[0] : results);
  } catch (error) {
    console.error("GET /MentorshipApplications error:", error);
    res.status(500).json({ message: "Server error fetching applications." });
  }
});

// GET: Check if a user already applied for a specific Mentorship
router.get("/Exists", async (req, res) => {
  try {
    const { email, mentorshipId } = req.query;

    if (!email || !mentorshipId) {
      return res.status(400).json({ message: "Missing email or mentorshipId." });
    }

    const applicationExists = await MentorshipCollection.findOne({
      email,
      mentorshipId,
    });

    res.json({ exists: !!applicationExists });
  } catch (error) {
    console.error("GET /MentorshipApplications/Exists error:", error);
    res
      .status(500)
      .json({ message: "Server error checking application status." });
  }
});

// POST: Submit new application
router.post("/", async (req, res) => {
  try {
    const application = req.body;

    if (!application || !application.mentorshipId || !application.email) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const result = await MentorshipCollection.insertOne(application);
    res.status(201).json({ insertedId: result.insertedId });
  } catch (error) {
    console.error("POST /MentorshipApplications error:", error);
    res.status(500).json({ message: "Server error submitting application." });
  }
});

module.exports = router;
