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
    let { courseId } = req.query;

    if (!courseId) {
      return res.status(400).json({
        message: "Please provide courseId(s) as a query parameter.",
      });
    }

    // Split comma-separated string into array
    let courseIds = courseId.split(",");

    // Fetch all documents matching the courseIds
    const results = await CourseCollection.find({
      courseId: { $in: courseIds },
    }).toArray();

    // Group results by courseId
    const groupedResults = courseIds.reduce((acc, id) => {
      acc[id] = results.filter((doc) => doc.courseId === id);
      return acc;
    }, {});

    res.json(groupedResults);
  } catch (error) {
    console.error("GET /Applications/ByCourse error:", error);
    res.status(500).json({
      message: "Server error fetching applications by courseIds.",
    });
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
