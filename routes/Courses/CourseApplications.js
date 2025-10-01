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

// GET: Fetch applications grouped by courseIds
router.get("/ByCourse", async (req, res) => {
  try {
    let { courseId, status } = req.query;
    if (!courseId) {
      return res.status(400).json({ error: "courseId is required" });
    }

    const ids = courseId.split(",");

    // Build query
    const query = { courseId: { $in: ids } };
    if (status && status !== "all") {
      query.status = status; // keep case as stored in DB
    }

    // Fetch from Mongo (sort by appliedAt desc)
    const data = await CourseCollection.find(query)
      .sort({ appliedAt: -1 })
      .toArray();

    // Group results
    const grouped = {};
    ids.forEach((id) => {
      grouped[id] = data.filter((app) => app.courseId === id);
    });

    res.json(grouped);
  } catch (err) {
    console.error("ByCourse error:", err);
    res.status(500).json({ error: "Server error in ByCourse" });
  }
});

// GET: Course Applications Status by courseId
router.get("/Status", async (req, res) => {
  const { ids } = req.query;

  // Validate IDs
  if (!ids) return res.status(400).json({ message: "IDs are required." });

  // --- Handle array string or comma-separated string ---
  let courseIdsArray = [];

  try {
    // --- Handle array string or comma-separated string ---
    if (ids.startsWith("[") && ids.endsWith("]")) {
      courseIdsArray = JSON.parse(ids.replace(/'/g, '"')); // replace single quotes
    } else {
      courseIdsArray = ids.split(",").map((id) => id.trim());
    }

    // Validate IDs
    courseIdsArray = courseIdsArray.map((id) => {
      if (!ObjectId.isValid(id)) throw new Error(`Invalid ID: ${id}`);
      return id; // we keep as string because courseId is string
    });

    // Aggregation pipeline
    const results = await CourseCollection.aggregate([
      { $match: { courseId: { $in: courseIdsArray } } },
      {
        $group: {
          _id: {
            date: {
              $dateToString: {
                format: "%d-%b-%Y",
                date: { $toDate: "$appliedAt" },
              },
            },
            courseId: "$courseId",
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
          courseId: "$_id.courseId",
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
    console.error("Error fetching course application status:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// POST: Submit new application
router.post("/", async (req, res) => {
  try {
    const application = req.body;

    // Basic validation
    if (!application || !application.courseId || !application.email) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    // Insert into MongoDB
    const result = await CourseCollection.insertOne(application);

    // Return the inserted ID
    res.status(201).json({
      message: "Application submitted successfully",
      insertedId: result.insertedId,
    });
  } catch (error) {
    console.error("POST /CourseApplications error:", error);
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
    const result = await CourseCollection.updateOne(
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

// DELETE: Remove an application by ID
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID format." });
    }

    const result = await CourseCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Application not found." });
    }

    res.json({ message: "Application deleted successfully." });
  } catch (error) {
    console.error("DELETE /CourseApplications/:id error:", error);
    res.status(500).json({ message: "Server error deleting application." });
  }
});

module.exports = router;
