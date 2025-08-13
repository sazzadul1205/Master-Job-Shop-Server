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

// GET: Fetch daily application count by multiple jobIds
router.get("/DailyStatus", async (req, res) => {
  try {
    const { jobIds } = req.query;

    let matchStage = {};
    if (jobIds) {
      const idsArray = Array.isArray(jobIds)
        ? jobIds
        : jobIds.split(",").map((id) => id.trim());

      matchStage.jobId = { $in: idsArray };
    }

    const pipeline = [
      { $match: matchStage }, // Filters only if jobIds were provided
      {
        $addFields: {
          appliedAtDate: {
            $cond: [
              { $ne: ["$appliedAt", null] },
              { $toDate: "$appliedAt" },
              null,
            ],
          },
        },
      },
      {
        $match: { appliedAtDate: { $ne: null } },
      },
      {
        $project: {
          date: {
            $dateToString: { format: "%Y-%m-%d", date: "$appliedAtDate" },
          },
        },
      },
      {
        $group: {
          _id: "$date",
          applied: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          Date: "$_id",
          applied: 1,
        },
      },
      { $sort: { Date: 1 } },
    ];

    const dailyCounts = await JobCollection.aggregate(pipeline).toArray();

    res.status(200).json(dailyCounts);
  } catch (error) {
    console.error("Error fetching daily job application counts:", error);
    res.status(500).json({ message: "Server error fetching daily status." });
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

// PUT: Update status of an application by ID
router.put("/Status/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid application ID." });
    }

    // Validate status presence
    if (typeof status !== "string" || !status.trim()) {
      return res.status(400).json({
        message: "Status is required and must be a non-empty string.",
      });
    }

    // Update status field (set or create)
    const result = await JobCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: status.trim() } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Application not found." });
    }

    res.json({ message: "Status updated successfully." });
  } catch (error) {
    console.error("PUT /JobApplications/:id/status error:", error);
    res.status(500).json({ message: "Server error updating status." });
  }
});

// PUT: Accept a job application and store interview details
router.put("/Accepted/:id", async (req, res) => {
  const { id } = req.params;

  // Validate ObjectId
  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid application ID." });
  }

  try {
    const filter = { _id: new ObjectId(id) };

    // Destructure nested interview object properly
    const { interview } = req.body || {};
    const { interviewTime, mode, platform, notes } = interview || {};

    // Build interview object dynamically to avoid empty fields
    const updatedInterview = {};
    if (interviewTime) updatedInterview.interviewTime = interviewTime;
    if (mode) updatedInterview.mode = mode;
    if (platform) updatedInterview.platform = platform;
    if (notes) updatedInterview.notes = notes;

    const updateDoc = {
      $set: {
        status: "Accepted",
        interview: updatedInterview,
        updatedAt: new Date(),
      },
    };

    const result = await JobCollection.updateOne(filter, updateDoc);

    if (result.modifiedCount === 0) {
      return res
        .status(404)
        .json({ message: "Application not found or no changes made." });
    }

    res.json({
      message: "Application accepted and interview details stored.",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("PUT /Accepted/:id error:", error);
    res.status(500).json({ message: "Server error updating application." });
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
