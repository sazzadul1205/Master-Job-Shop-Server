const express = require("express");
const router = express.Router();
const { client } = require("../../config/db");
const { ObjectId } = require("mongodb");

const CourseCollection = client
  .db("Master-Job-Shop")
  .collection("Course-Applications");

// GET: Fetch all or filtered applications
router.get("/", async (req, res) => {
  try {
    const { id, courseId, email, phone } = req.query;
    const query = {};

    if (id) {
      try {
        query._id = new ObjectId(id);
      } catch (err) {
        return res.status(400).json({ message: "Invalid ID format." });
      }
    }
    if (courseId) query.courseId = courseId;
    if (email) query.email = email;
    if (phone) query.phone = phone;

    const results = await CourseCollection.find(query).toArray();

    res.json(results.length === 1 ? results[0] : results);
  } catch (error) {
    console.error("GET /CourseApplications error:", error);
    res.status(500).json({ message: "Server error fetching applications." });
  }
});

// GET: Check if a user already applied for a specific course
router.get("/Exists", async (req, res) => {
  try {
    const { email, courseId } = req.query;

    if (!email || !courseId) {
      return res.status(400).json({ message: "Missing email or courseId." });
    }

    const applicationExists = await CourseCollection.findOne({
      email,
      courseId,
    });

    res.json({ exists: !!applicationExists });
  } catch (error) {
    console.error("GET /CourseApplications/Exists error:", error);
    res
      .status(500)
      .json({ message: "Server error checking application status." });
  }
});

// POST: Submit new application
router.post("/", async (req, res) => {
  try {
    const application = req.body;

    if (!application || !application.courseId || !application.email) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const result = await CourseCollection.insertOne(application);
    res.status(201).json({ insertedId: result.insertedId });
  } catch (error) {
    console.error("POST /CourseApplications error:", error);
    res.status(500).json({ message: "Server error submitting application." });
  }
});

module.exports = router;
