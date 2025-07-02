const express = require("express");
const router = express.Router();
const { client } = require("../config/db");
const { ObjectId } = require("mongodb");

const PostedJobCollection = client
  .db("Master-Job-Shop")
  .collection("Posted-Job");

// GET: Fetch Posted Jobs
app.get("/Jobs", async (req, res) => {
  try {
    const { id, companyCode, email } = req.query;
    const query = {};

    // Filter by _id if provided
    if (id) {
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid job ID." });
      }
      query._id = new ObjectId(id);
    }

    // Filter by companyCode if provided
    if (companyCode) {
      query.companyCode = companyCode;
    }

    // Filter by postedBy.email if provided
    if (email) {
      query["postedBy.email"] = email;
    }

    // Determine whether to fetch single or multiple results
    if (id) {
      const job = await PostedJobCollection.findOne(query);
      if (!job) {
        return res.status(404).json({ message: "Job not found." });
      }
      return res.status(200).json(job); // Return object directly
    }

    const jobs = await PostedJobCollection.find(query).toArray();

    if (jobs.length === 0) {
      return res.status(404).json({ message: "No jobs found." });
    }

    if (jobs.length === 1) {
      return res.status(200).json(jobs[0]); // Return single object
    }

    res.status(200).json(jobs); // Return array of jobs
  } catch (error) {
    console.error("Error fetching posted jobs:", error);
    res.status(500).json({ message: "An error occurred while fetching jobs." });
  }
});

// Total Posted Jobs Count API
app.get("/JobsCount", async (req, res) => {
  try {
    // Optional: extend this to filter by companyCode, email, etc.
    const count = await PostedJobCollection.countDocuments();
    res.status(200).json({ count });
  } catch (error) {
    console.error("Error counting posted jobs:", error);
    res.status(500).json({ message: "Failed to count posted jobs." });
  }
});

module.exports = router;
