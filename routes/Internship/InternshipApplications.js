const express = require("express");
const router = express.Router();
const { client } = require("../../config/db");
const { ObjectId } = require("mongodb");

const InternshipCollection = client
  .db("Master-Job-Shop")
  .collection("Internship-Applications");

// GET: Fetch all or filtered applications
router.get("/", async (req, res) => {
  try {
    const { id, internshipId, email, phone } = req.query;
    const query = {};

    if (id) {
      try {
        query._id = new ObjectId(id);
      } catch (err) {
        return res.status(400).json({ message: "Invalid ID format." });
      }
    }
    if (internshipId) query.internshipId = internshipId;
    if (email) query.email = email;
    if (phone) query.phone = phone;

    const results = await InternshipCollection.find(query).toArray();

    res.json(results.length === 1 ? results[0] : results);
  } catch (error) {
    console.error("GET /InternshipApplications error:", error);
    res.status(500).json({ message: "Server error fetching applications." });
  }
});

// GET: Check if a user already applied for a specific Internship
router.get("/Exists", async (req, res) => {
  try {
    const { email, internshipId } = req.query;

    if (!email || !internshipId) {
      return res
        .status(400)
        .json({ message: "Missing email or internshipId." });
    }

    const applicationExists = await InternshipCollection.findOne({
      email,
      internshipId,
    });

    res.json({ exists: !!applicationExists });
  } catch (error) {
    console.error("GET /InternshipApplications/Exists error:", error);
    res
      .status(500)
      .json({ message: "Server error checking application status." });
  }
});

// POST: Submit new application
router.post("/", async (req, res) => {
  try {
    const application = req.body;

    if (!application || !application.internshipId || !application.email) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const result = await InternshipCollection.insertOne(application);
    res.status(201).json({ insertedId: result.insertedId });
  } catch (error) {
    console.error("POST /InternshipApplications error:", error);
    res.status(500).json({ message: "Server error submitting application." });
  }
});

// DELETE: Remove application by ID
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
    const result = await InternshipCollection.deleteOne({ _id: objectId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Application not found." });
    }

    res.json({ message: "Application deleted successfully." });
  } catch (error) {
    console.error("DELETE /InternshipApplications/:id error:", error);
    res.status(500).json({ message: "Server error deleting application." });
  }
});

module.exports = router;
