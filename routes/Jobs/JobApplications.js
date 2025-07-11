const express = require("express");
const router = express.Router();
const { client } = require("../../config/db");
const { ObjectId } = require("mongodb");

const JobCollection = client
  .db("Master-Job-Shop")
  .collection("Job-Applications");

// GET: Fetch all or filtered applications
router.get("/", async (req, res) => {
  try {
    const { id, jobId, email, phone } = req.query;
    const query = {};

    if (id) {
      try {
        query._id = new ObjectId(id);
      } catch (err) {
        return res.status(400).json({ message: "Invalid ID format." });
      }
    }
    if (jobId) query.jobId = jobId;
    if (email) query.email = email;
    if (phone) query.phone = phone;

    const results = await JobCollection.find(query).toArray();

    res.json(results.length === 1 ? results[0] : results);
  } catch (error) {
    console.error("GET /JobApplications error:", error);
    res.status(500).json({ message: "Server error fetching applications." });
  }
});

// GET: Check if a user already applied for a specific job
router.get("/Exists", async (req, res) => {
  try {
    const { email, jobId } = req.query;

    if (!email || !jobId) {
      return res.status(400).json({ message: "Missing email or jobId." });
    }

    const applicationExists = await JobCollection.findOne({ email, jobId });

    res.json({ exists: !!applicationExists });
  } catch (error) {
    console.error("GET /JobApplications/exists error:", error);
    res
      .status(500)
      .json({ message: "Server error checking application status." });
  }
});

// POST: Submit new application
router.post("/", async (req, res) => {
  try {
    const application = req.body;

    if (!application || !application.jobId || !application.email) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const result = await JobCollection.insertOne(application);
    res.status(201).json({ insertedId: result.insertedId });
  } catch (error) {
    console.error("POST /JobApplications error:", error);
    res.status(500).json({ message: "Server error submitting application." });
  }
});

module.exports = router;
