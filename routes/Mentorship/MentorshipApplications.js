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
      return res
        .status(400)
        .json({ message: "Missing email or mentorshipId." });
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

// GET: Fetch applications grouped by mentorshipIds
router.get("/ByMentorship", async (req, res) => {
  try {
    let { mentorshipId } = req.query; // accept "mentorshipId" (singular) as string

    if (!mentorshipId) {
      return res.status(400).json({
        message: "Please provide mentorshipId(s) as a query parameter.",
      });
    }

    // Split comma-separated string into array
    let mentorshipIds = mentorshipId.split(",");

    // Fetch all documents matching the mentorshipIds
    const results = await MentorshipCollection.find({
      mentorshipId: { $in: mentorshipIds },
    }).toArray();

    // Group results by mentorshipId
    const groupedResults = mentorshipIds.reduce((acc, id) => {
      acc[id] = results.filter((doc) => doc.mentorshipId === id);
      return acc;
    }, {});

    res.json(groupedResults);
  } catch (error) {
    console.error("GET /MentorshipApplications/ByMentorship error:", error);
    res.status(500).json({
      message: "Server error fetching applications by mentorshipIds.",
    });
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

// DELETE: Remove mentorship application by ID
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "Missing application ID." });
  }

  let objectId;
  try {
    objectId = new ObjectId(id);
  } catch (err) {
    return res.status(400).json({ message: "Invalid ID format." });
  }

  try {
    const result = await MentorshipCollection.deleteOne({ _id: objectId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Application not found." });
    }

    res.json({ message: "Mentorship application deleted successfully." });
  } catch (error) {
    console.error("DELETE /MentorshipApplications/:id error:", error);
    res.status(500).json({ message: "Server error deleting application." });
  }
});

module.exports = router;
