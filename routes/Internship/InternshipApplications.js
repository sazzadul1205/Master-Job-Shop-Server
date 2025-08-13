const express = require("express");
const router = express.Router();
const { client } = require("../../config/db");
const { ObjectId } = require("mongodb");

const InternshipApplicationsCollection = client
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

    const results = await InternshipApplicationsCollection.find(
      query
    ).toArray();

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

    const applicationExists = await InternshipApplicationsCollection.findOne({
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

router.get("/DailyStatus", async (req, res) => {
  try {
    const { internshipIds } = req.query;

    let matchStage = {};
    if (internshipIds) {
      const idsArray = Array.isArray(internshipIds)
        ? internshipIds
        : internshipIds.split(",").map((id) => id.trim());

      matchStage.internshipId = { $in: idsArray };
    }

    const pipeline = [
      { $match: matchStage }, // Filters only if internshipIds were provided
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
          applications: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          Date: "$_id",
          applications: 1,
        },
      },
      { $sort: { Date: 1 } },
    ];

    const dailyCounts = await InternshipApplicationsCollection.aggregate(
      pipeline
    ).toArray();

    res.status(200).json(dailyCounts);
  } catch (error) {
    console.error("Error fetching daily internship application counts:", error);
    res.status(500).json({ message: "Server error fetching daily status." });
  }
});

// POST: Submit new application
router.post("/", async (req, res) => {
  try {
    const application = req.body;

    if (!application || !application.internshipId || !application.email) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const result = await InternshipApplicationsCollection.insertOne(
      application
    );
    res.status(201).json({ insertedId: result.insertedId });
  } catch (error) {
    console.error("POST /InternshipApplications error:", error);
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
    const result = await InternshipApplicationsCollection.updateOne(
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

    const result = await InternshipApplicationsCollection.updateOne(
      filter,
      updateDoc
    );

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
    const result = await InternshipApplicationsCollection.deleteOne({
      _id: objectId,
    });

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
