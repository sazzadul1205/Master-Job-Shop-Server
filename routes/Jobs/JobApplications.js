const express = require("express");
const router = express.Router();
const { client } = require("../../config/db");
const { ObjectId } = require("mongodb");

const JobCollection = client
  .db("Master-Job-Shop")
  .collection("Job-Applications");

// GET: Fetch all or filtered job applications
router.get("/", async (req, res) => {
  try {
    // Destructure query parameters from the request
    const { id, jobId, email, phone, jobIds } = req.query;
    const query = {};

    // If a single application ID is provided, validate and convert it to ObjectId
    if (id) {
      try {
        query._id = new ObjectId(id);
      } catch (err) {
        return res.status(400).json({ message: "Invalid ID format." });
      }
    }

    // If a single jobId is provided, add it to the query
    if (jobId) {
      query.jobId = jobId;
    }

    // If email is provided, add it to the query
    if (email) {
      query.email = email;
    }

    // If phone is provided, add it to the query
    if (phone) {
      query.phone = phone;
    }

    // If multiple job IDs are provided as an array (jobIds[]), handle it
    if (jobIds) {
      // Ensure jobIds is always treated as an array
      const jobIdArray = Array.isArray(jobIds) ? jobIds : [jobIds];
      query.jobId = { $in: jobIdArray }; // Match any jobId in the array
    }

    // Query the database with the built query object
    const results = await JobCollection.find(query).toArray();

    // If only one result found, return the object directly, else return array
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

// DELETE: Delete application by ID
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid application ID." });
    }

    const result = await JobCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Application not found." });
    }

    res.json({ message: "Application deleted successfully." });
  } catch (error) {
    console.error("DELETE /JobApplications/:id error:", error);
    res.status(500).json({ message: "Server error deleting application." });
  }
});

module.exports = router;
