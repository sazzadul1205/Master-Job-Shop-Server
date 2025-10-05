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
    let { mentorshipId, status } = req.query;
    if (!mentorshipId) {
      return res.status(400).json({ error: "mentorshipId is required" });
    }

    const ids = mentorshipId.split(",");

    const query = { mentorshipId: { $in: ids } };
    if (status && status !== "all") {
      query.status = status;
    }

    const data = await MentorshipCollection.find(query)
      .sort({ appliedAt: -1 })
      .toArray();

    const grouped = {};
    ids.forEach((id) => {
      grouped[id] = data.filter((app) => app.mentorshipId === id);
    });

    res.json(grouped);
  } catch (err) {
    console.error("ByMentorship error:", err);
    res.status(500).json({ error: "Server error in ByMentorship" });
  }
});

// GET: Mentorship Applications Status
router.get("/Status", async (req, res) => {
  const { ids } = req.query;

  // Validate IDs
  if (!ids) return res.status(400).json({ message: "IDs are required." });

  // --- Handle array string or comma-separated string ---
  let mentorshipIdsArray = [];

  try {
    // --- Handle array string or comma-separated string ---
    if (ids.startsWith("[") && ids.endsWith("]")) {
      mentorshipIdsArray = JSON.parse(ids.replace(/'/g, '"')); // replace single quotes
    } else {
      mentorshipIdsArray = ids.split(",").map((id) => id.trim());
    }

    // Validate IDs
    mentorshipIdsArray = mentorshipIdsArray.map((id) => {
      if (!id) throw new Error(`Invalid ID: ${id}`);
      return id;
    });

    // Aggregation pipeline
    const results = await MentorshipCollection.aggregate([
      { $match: { mentorshipId: { $in: mentorshipIdsArray } } },
      {
        $group: {
          _id: {
            date: {
              $dateToString: {
                format: "%d-%b-%Y",
                date: { $toDate: "$appliedAt" },
              },
            },
            mentorshipId: "$mentorshipId",
          },
          total: { $sum: 1 },
          accepted: {
            $sum: {
              $cond: [{ $in: [{ $toLower: "$status" }, ["accepted"]] }, 1, 0],
            },
          },
          rejected: {
            $sum: {
              $cond: [{ $in: [{ $toLower: "$status" }, ["rejected"]] }, 1, 0],
            },
          },
          pending: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $eq: ["$status", null] },
                    { $eq: ["$status", ""] },
                    {
                      $and: [
                        { $ne: [{ $toLower: "$status" }, "accepted"] },
                        { $ne: [{ $toLower: "$status" }, "rejected"] },
                      ],
                    },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      { $sort: { "_id.date": 1 } },
      {
        $project: {
          _id: 0,
          date: "$_id.date",
          mentorshipId: "$_id.mentorshipId",
          count: "$total",
          detailed: {
            accepted: "$accepted",
            rejected: "$rejected",
            pending: "$pending",
          },
        },
      },
    ]).toArray();

    // Send response
    res.json(results);
  } catch (error) {
    console.error("Error fetching mentorship application status:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// POST: Submit new application
router.post("/", async (req, res) => {
  try {
    const application = req.body;

    // Basic validation
    if (!application || !application.mentorshipId || !application.email) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    // Insert into MongoDB
    const result = await MentorshipCollection.insertOne(application);

    // Return the inserted ID
    res.status(201).json({
      message: "Application submitted successfully",
      insertedId: result.insertedId,
    });
  } catch (error) {
    console.error("POST /MentorshipApplications error:", error);
    res.status(500).json({ message: "Server error submitting application." });
  }
});

// PUT: Update application status
router.put("/Status/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // new status value

    if (!status) {
      return res.status(400).json({ message: "Status is required." });
    }

    let objectId;
    try {
      objectId = new ObjectId(id);
    } catch (err) {
      return res.status(400).json({ message: "Invalid ID format." });
    }

    // Update or create the 'status' field
    const result = await MentorshipCollection.updateOne(
      { _id: objectId },
      { $set: { status: status } },
      { upsert: false } // do not create new doc, only update existing
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Application not found." });
    }

    res.json({
      message: "Status updated successfully.",
      updatedStatus: status,
    });
  } catch (error) {
    console.error("PUT /MentorshipApplications/update-status error:", error);
    res.status(500).json({ message: "Server error updating status." });
  }
});

// DELETE: Bulk delete mentorship applications by IDs
router.delete("/BulkDelete", async (req, res) => {
  try {
    const { ids } = req.body; // Expecting { ids: ["id1", "id2", ...] }

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No IDs provided." });
    }

    // Validate IDs
    const objectIds = [];
    for (const id of ids) {
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: `Invalid ID: ${id}` });
      }
      objectIds.push(new ObjectId(id));
    }

    // Perform actual bulk deletion
    const deleteResult = await MentorshipCollection.deleteMany({
      _id: { $in: objectIds },
    });

    res.status(200).json({
      message: `Deleted ${deleteResult.deletedCount} mentorship application(s).`,
      deletedCount: deleteResult.deletedCount,
    });
  } catch (error) {
    console.error("Bulk delete error:", error);
    res.status(500).json({ message: "Server error during bulk delete." });
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
