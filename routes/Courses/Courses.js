const express = require("express");
const router = express.Router();
const { client } = require("../../config/db");
const { ObjectId } = require("mongodb");

const CoursesCollection = client.db("Master-Job-Shop").collection("Courses");

// Get Courses
router.get("/", async (req, res) => {
  const { id, postedBy, email, courseIds, mentorEmail, status, archived } =
    req.query;

  try {
    let query = {};

    // Query by single ID
    if (id) {
      if (!ObjectId.isValid(id)) {
        return res.status(400).send({ message: "Invalid ID format." });
      }
      query._id = new ObjectId(id);
    }

    // Query by multiple course IDs
    else if (courseIds) {
      try {
        const idsArray = courseIds.split(",").map((id) => {
          const trimmed = id.trim();
          if (!ObjectId.isValid(trimmed)) throw new Error();
          return new ObjectId(trimmed);
        });

        query._id = { $in: idsArray };
      } catch {
        return res.status(400).send({
          message:
            "Invalid courseIds format. Must be a comma-separated list of valid MongoDB ObjectIDs.",
        });
      }
    }

    // Additional filters (only when courseIds/id are not used)
    else {
      // Initialize $and array for combining multiple conditions
      query.$and = [];

      // Posted By or Mentor Email
      if (postedBy || mentorEmail) {
        const emailOr = [];
        if (postedBy) emailOr.push({ postedBy });
        if (mentorEmail) emailOr.push({ "Mentor.email": mentorEmail });
        if (emailOr.length > 0) query.$and.push({ $or: emailOr });
      }

      // Applicant Email
      if (email) {
        query.$and.push({ "applicants.applicantEmail": email });
      }

      // Status filter
      if (status) {
        const statuses = status
          .split(",")
          .map((s) =>
            s.trim().toLowerCase() === "onhold"
              ? "onHold"
              : s.trim().toLowerCase()
          );
        query.$and.push({ status: { $in: statuses } });
      }

      // Archived filter
      if (archived !== undefined) {
        if (archived === "true" || archived === "false") {
          const isArchived = archived === "true";
          if (isArchived) {
            query.$and.push({ archived: true });
          } else {
            query.$and.push({
              $or: [{ archived: false }, { archived: { $exists: false } }],
            });
          }
        } else {
          return res
            .status(400)
            .json({ message: "Invalid archived value. Use true or false." });
        }
      }

      // If $and is empty, just query everything
      query = query.$and.length > 0 ? { $and: query.$and } : {};
    }

    const results = await CoursesCollection.find(query).toArray();

    if (results.length === 1 && (id || courseIds)) {
      return res.send(results[0]); // return single object when explicitly fetching single(s)
    }

    return res.send(results);
  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).send({ message: "Error fetching courses", error });
  }
});

// Get Total Count of Courses
router.get("/CoursesCount", async (req, res) => {
  try {
    const count = await CoursesCollection.countDocuments();
    res.json({ count });
  } catch (error) {
    console.error("Error counting courses:", error);
    res.status(500).send({ message: "Failed to count courses", error });
  }
});

// GET: Get Course Title by ID
router.get("/Title", async (req, res) => {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ message: "Course ID is required." });
  }

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid ID format." });
  }

  try {
    const course = await CoursesCollection.findOne(
      { _id: new ObjectId(id) },
      { projection: { title: 1 } } // Only return the title
    );

    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    res.json({ title: course.title });
  } catch (err) {
    console.error("Error fetching course title:", err);
    res.status(500).json({ message: "Server error." });
  }
});

// Create a new Course
router.post("/", async (req, res) => {
  const courseData = req.body;

  if (!courseData || Object.keys(courseData).length === 0) {
    return res.status(400).send({ message: "Course data is required." });
  }

  try {
    const result = await CoursesCollection.insertOne(courseData);
    res.status(201).send({
      message: "Course created successfully.",
      insertedId: result.insertedId,
    });
  } catch (error) {
    console.error("Error creating course:", error);
    res.status(500).send({ message: "Error creating course.", error });
  }
});

// Apply for a Course
router.post("/Apply/:id", async (req, res) => {
  const { courseId } = req.params;
  const applicantData = req.body;

  if (!applicantData || Object.keys(applicantData).length === 0) {
    return res.status(400).send({ message: "Applicant data is required." });
  }

  try {
    const query = { _id: new ObjectId(courseId) };
    const update = { $push: { applicants: applicantData } };

    const result = await CoursesCollection.updateOne(query, update);

    if (result.modifiedCount > 0) {
      res.status(200).send({ message: "Application submitted successfully!" });
    } else {
      res.status(404).send({ message: "Course not found or no changes made." });
    }
  } catch (error) {
    console.error("Error applying for the course:", error);
    res.status(500).send({ message: "Error applying for the course", error });
  }
});

// Update a Course by ID
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  if (!updateData || Object.keys(updateData).length === 0) {
    return res.status(400).send({ message: "Update data is required." });
  }

  try {
    const query = { _id: new ObjectId(id) };
    const result = await CoursesCollection.updateOne(query, {
      $set: updateData,
    });

    if (result.modifiedCount > 0) {
      res.status(200).send({ message: "Course updated successfully." });
    } else {
      res.status(404).send({ message: "Course not found or no changes made." });
    }
  } catch (error) {
    console.error("Error updating course:", error);
    res.status(500).send({ message: "Error updating course.", error });
  }
});

// Toggle Archive Status
router.put("/Archive/:id", async (req, res) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid ID format." });
  }

  try {
    // Find the mentorship first
    const mentorship = await CoursesCollection.findOne({
      _id: new ObjectId(id),
    });
    if (!mentorship) {
      return res.status(404).json({ message: "Mentorship not found." });
    }

    // Determine new archive status
    const newArchivedStatus = !mentorship.archived; // if undefined, !undefined => true

    // Update the mentorship
    await CoursesCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { archived: newArchivedStatus } }
    );

    res.status(200).json({
      message: `Mentorship ${
        newArchivedStatus ? "Archived" : "Un-Archived"
      } successfully.`,
      archived: newArchivedStatus,
    });
  } catch (error) {
    console.error("Error toggling archive status:", error);
    res.status(500).json({ message: "Server error." });
  }
});

// PATCH: Update Course status by ID
router.patch("/Status/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: "Status value is required." });
    }

    let objectId;
    try {
      objectId = new ObjectId(id);
    } catch (err) {
      return res.status(400).json({ message: "Invalid ID format." });
    }

    const result = await CoursesCollection.updateOne(
      { _id: objectId },
      { $set: { status } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Application not found." });
    }

    res.json({ message: "Status updated successfully.", updatedId: id });
  } catch (error) {
    console.error("PATCH Course ID status Updating error:", error);
    res.status(500).json({ message: "Server error updating status." });
  }
});

// Delete a Course by ID
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const query = { _id: new ObjectId(id) };
    const result = await CoursesCollection.deleteOne(query);

    if (result.deletedCount > 0) {
      res.status(200).send({ message: "Course deleted successfully." });
    } else {
      res.status(404).send({ message: "Course not found or already deleted." });
    }
  } catch (error) {
    console.error("Error deleting the course:", error);
    res.status(500).send({ message: "Error deleting the course.", error });
  }
});

// Delete a Participant by Email from a Specific Course
router.delete("/:id/Participants/:email", async (req, res) => {
  const { id, email } = req.params;

  try {
    const query = { _id: new ObjectId(id) };
    const update = { $pull: { applicants: { applicantEmail: email } } };
    const result = await CoursesCollection.updateOne(query, update);

    if (result.modifiedCount > 0) {
      res.status(200).send({ message: "Participant removed successfully." });
    } else {
      res
        .status(404)
        .send({ message: "Participant not found or no changes made." });
    }
  } catch (error) {
    console.error("Error removing participant:", error);
    res.status(500).send({ message: "Error removing participant.", error });
  }
});

module.exports = router;
