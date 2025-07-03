const express = require("express");
const router = express.Router();
const { client } = require("../../config/db");
const { ObjectId } = require("mongodb");

const CoursesCollection = client.db("Master-Job-Shop").collection("Courses");

// Get Courses
app.get("/Courses", async (req, res) => {
  const { id, postedBy, email } = req.query;

  try {
    let query = {};

    if (id) {
      if (!ObjectId.isValid(id)) {
        return res.status(400).send({ message: "Invalid ID format." });
      }
      query._id = new ObjectId(id);
    } else {
      if (postedBy) {
        query.postedBy = postedBy;
      }
      if (email) {
        query["applicants.applicantEmail"] = email;
      }
    }

    const results = await CoursesCollection.find(query).toArray();

    if (results.length === 1) {
      return res.send(results[0]); // Send single object if only one found
    } else {
      return res.send(results); // Send array otherwise
    }
  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).send({ message: "Error fetching courses", error });
  }
});

// Get Total Count of Courses
app.get("/CoursesCount", async (req, res) => {
  try {
    const count = await CoursesCollection.countDocuments();
    res.json({ count });
  } catch (error) {
    console.error("Error counting courses:", error);
    res.status(500).send({ message: "Failed to count courses", error });
  }
});

// Apply for a Course
app.post("/Courses/Apply/:id", async (req, res) => {
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

// Create a new Course
app.post("/Courses", async (req, res) => {
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

// Update a Course by ID
app.put("/Courses/:id", async (req, res) => {
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

// Delete a Course by ID
app.delete("/Courses/:id", async (req, res) => {
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
app.delete("/Courses/:id/Participants/:email", async (req, res) => {
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
