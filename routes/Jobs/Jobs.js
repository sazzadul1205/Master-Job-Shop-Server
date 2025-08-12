const express = require("express");
const router = express.Router();
const { client } = require("../../config/db");
const { ObjectId } = require("mongodb");

const JobsCollection = client.db("Master-Job-Shop").collection("Posted-Job");

// GET: Fetch Posted Jobs
router.get("/", async (req, res) => {
  try {
    const { id, jobIds, companyCode, postedBy } = req.query; // changed here
    const query = {};

    // Handle single job by id
    if (id) {
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid job ID." });
      }
      const job = await JobsCollection.findOne({ _id: new ObjectId(id) });
      if (!job) {
        return res.status(404).json({ message: "Job not found." });
      }
      return res.status(200).json(job);
    }

    // Handle multiple jobIds (as CSV string)
    if (jobIds) {
      let idsArray;
      try {
        idsArray = jobIds.split(",").map((id) => new ObjectId(id.trim()));
      } catch (err) {
        return res.status(400).json({ message: "Invalid jobIds format." });
      }

      const jobs = await JobsCollection.find({
        _id: { $in: idsArray },
      }).toArray();
      return res.status(200).json(jobs);
    }

    // Filter by companyCode
    if (companyCode) {
      query.companyCode = companyCode;
    }

    // Filter by postedBy (exact match)
    if (postedBy) {
      query.postedBy = postedBy;
    }

    const jobs = await JobsCollection.find(query).toArray();

    if (jobs.length === 0) {
      return res.status(404).json({ message: "No jobs found." });
    }

    if (jobs.length === 1) {
      return res.status(200).json(jobs[0]);
    }

    res.status(200).json(jobs);
  } catch (error) {
    console.error("Error fetching posted jobs:", error);
    res.status(500).json({ message: "An error occurred while fetching jobs." });
  }
});

// Total Posted Jobs Count API
router.get("/JobsCount", async (req, res) => {
  try {
    // Optional: extend this to filter by companyCode, email, etc.
    const count = await JobsCollection.countDocuments();
    res.status(200).json({ count });
  } catch (error) {
    console.error("Error counting posted jobs:", error);
    res.status(500).json({ message: "Failed to count posted jobs." });
  }
});

// GET: Daily job post counts by postedBy
router.get("/DailyJobPosted", async (req, res) => {
  try {
    const { postedBy } = req.query;

    const matchStage = postedBy ? { postedBy } : {};

    const pipeline = [
      { $match: matchStage },
      {
        $addFields: {
          postedAtDate: {
            $convert: {
              input: "$postedAt",
              to: "date",
              onError: null,
              onNull: null,
            },
          },
        },
      },
      {
        $match: {
          postedAtDate: { $ne: null },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$postedAtDate" } },
          DocumentCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          postedDate: "$_id",
          DocumentCount: 1,
        },
      },
    ];

    const results = await JobsCollection.aggregate(pipeline).toArray();

    if (results.length === 0) {
      return res.status(404).json({
        message: postedBy
          ? "No jobs found for the given postedBy."
          : "No jobs found.",
      });
    }

    res.status(200).json(results);
  } catch (error) {
    console.error("Error fetching daily job posts:", error);
    res.status(500).json({
      message: "An error occurred while fetching daily job posts.",
    });
  }
});

// Apply for a Posted Job (update PeopleApplied array)
router.post("/Apply/:id", async (req, res) => {
  const { id } = req.params;
  const applicantData = req.body;

  // Validate ObjectId
  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid job ID." });
  }

  // Validate applicant data
  if (
    !applicantData ||
    typeof applicantData !== "object" ||
    !applicantData.email
  ) {
    return res.status(400).json({ message: "Invalid applicant data." });
  }

  try {
    const query = { _id: new ObjectId(id) };
    const update = {
      $push: {
        PeopleApplied: applicantData,
      },
    };

    const result = await JobsCollection.updateOne(query, update);

    if (result.modifiedCount > 0) {
      return res
        .status(200)
        .json({ message: "Application submitted successfully." });
    } else {
      return res
        .status(404)
        .json({ message: "Job not found or application already exists." });
    }
  } catch (error) {
    console.error("Error applying for the job:", error);
    return res
      .status(500)
      .json({ message: "Server error while applying for job.", error });
  }
});

// POST: Create a new posted job
router.post("/", async (req, res) => {
  const jobData = req.body;

  // Basic validation
  if (
    !jobData ||
    typeof jobData !== "object" ||
    !jobData.title ||
    !jobData.postedBy
  ) {
    return res.status(400).json({
      message: "Invalid job data. 'title' and 'postedBy' are required.",
    });
  }

  try {
    const result = await JobsCollection.insertOne(jobData);

    if (result.insertedId) {
      return res.status(201).json({
        message: "Job posted successfully.",
        jobId: result.insertedId,
      });
    } else {
      return res.status(500).json({ message: "Failed to post job." });
    }
  } catch (error) {
    console.error("Error posting job:", error);
    return res.status(500).json({
      message: "An error occurred while posting the job.",
      error: error.message,
    });
  }
});

// Approve Posted Job by ID
router.patch("/Approve/:id", async (req, res) => {
  const jobId = req.params.id;

  // Validate ObjectId format
  if (!ObjectId.isValid(jobId)) {
    return res.status(400).json({ message: "Invalid job ID." });
  }

  const query = { _id: new ObjectId(jobId) };
  const update = { $set: { state: "Approved" } };

  try {
    const result = await JobsCollection.updateOne(query, update);

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Job not found." });
    }

    if (result.modifiedCount === 0) {
      // Could be already approved or no actual change
      return res
        .status(200)
        .json({ message: "Job already approved or no change needed." });
    }

    res.status(200).json({ message: "Job approved successfully!" });
  } catch (error) {
    console.error("Error approving job:", error);
    res.status(500).json({
      message: "An error occurred while approving the job.",
      error: error.message,
    });
  }
});

// Update Posted Job by ID
router.put("/:id", async (req, res) => {
  const id = req.params.id;
  const updatedData = req.body;

  // Validate ObjectId format
  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid job ID." });
  }

  // Check if updatedData is not empty
  if (!updatedData || Object.keys(updatedData).length === 0) {
    return res.status(400).json({ message: "No data provided for update." });
  }

  const query = { _id: new ObjectId(id) };
  const update = { $set: updatedData };

  try {
    const result = await JobsCollection.updateOne(query, update);

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Job not found." });
    }

    if (result.modifiedCount === 0) {
      return res
        .status(200)
        .json({ message: "No changes detected. Job remains unchanged." });
    }

    res.status(200).json({ message: "Job updated successfully!" });
  } catch (error) {
    console.error("Error updating the job:", error);
    res.status(500).json({
      message: "An error occurred while updating the job.",
      error: error.message,
    });
  }
});

// Delete a single applicant from PeopleApplied by job ID and applicant email
router.delete("/Applicant/:id/", async (req, res) => {
  const jobId = req.params.id;
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Applicant's email is required." });
  }

  if (!ObjectId.isValid(jobId)) {
    return res.status(400).json({ message: "Invalid job ID." });
  }

  try {
    const query = { _id: new ObjectId(jobId) };
    const update = {
      $pull: { PeopleApplied: { email } },
    };

    const result = await JobsCollection.updateOne(query, update);

    if (result.modifiedCount > 0) {
      return res
        .status(200)
        .json({ message: "Applicant deleted successfully!" });
    } else {
      return res.status(404).json({ message: "Job or applicant not found." });
    }
  } catch (error) {
    console.error("Error deleting applicant:", error);
    return res.status(500).json({
      message: "An error occurred while deleting applicant.",
      error: error.message,
    });
  }
});

// Delete a single Posted Job by ID
router.delete("/:id", async (req, res) => {
  const jobId = req.params.id;

  // Validate ID
  if (!ObjectId.isValid(jobId)) {
    return res.status(400).json({ message: "Invalid job ID." });
  }

  try {
    const result = await JobsCollection.deleteOne({
      _id: new ObjectId(jobId),
    });

    if (result.deletedCount === 1) {
      return res.status(200).json({ message: "Job deleted successfully." });
    } else {
      return res.status(404).json({ message: "Job not found." });
    }
  } catch (error) {
    console.error("Error deleting job:", error);
    return res.status(500).json({
      message: "An error occurred while deleting the job.",
      error: error.message,
    });
  }
});

module.exports = router;
