const express = require("express");
const router = express.Router();
const { client } = require("../../config/db");
const { ObjectId } = require("mongodb");

const MentorshipCollection = client
  .db("Master-Job-Shop")
  .collection("Mentorship");

// Get Mentorship
app.get("/Mentorship", async (req, res) => {
  const { id, postedBy } = req.query;

  let query = {};

  if (id) {
    try {
      query._id = new ObjectId(id);
    } catch {
      return res.status(400).send({ message: "Invalid id format." });
    }
  } else if (postedBy) {
    query.postedBy = postedBy;
  }

  try {
    const results = await MentorshipCollection.find(query).toArray();

    if (results.length === 1) {
      res.send(results[0]); // Send single object if only one result
    } else {
      res.send(results); // Otherwise send array
    }
  } catch (error) {
    console.error("Error fetching mentorship:", error);
    res.status(500).send("Server error.");
  }
});

// Total Posted Mentorship Count API
app.get("/MentorshipCount", async (req, res) => {
  try {
    const count = await MentorshipCollection.countDocuments();
    res.json({ count });
  } catch (error) {
    console.error("Error counting mentorship:", error);
    res.status(500).json({ message: "Failed to get mentorship count." });
  }
});

// Post Mentorship
app.post("/Mentorship", async (req, res) => {
  try {
    const request = req.body;
    const result = await MentorshipCollection.insertOne(request);
    res.status(201).send(result);
  } catch (error) {
    console.error("Error posting mentorship:", error);
    res.status(500).send({ message: "Failed to create mentorship." });
  }
});

// Apply Review for a Mentorship by ID
app.post("/Mentorship/Review/:id", async (req, res) => {
  const id = req.params.id;
  const reviewData = req.body;

  try {
    const query = { _id: new ObjectId(id) };
    const update = { $push: { reviews: reviewData } };
    const result = await MentorshipCollection.updateOne(query, update);

    if (result.modifiedCount > 0) {
      res.status(200).send({ message: "Review submitted successfully!" });
    } else {
      res
        .status(404)
        .send({ message: "Mentorship not found or no changes made." });
    }
  } catch (error) {
    console.error("Error submitting review:", error);
    res.status(500).send({ message: "Error submitting review", error });
  }
});

// Apply for a Mentorship
app.post("/Mentorship/Apply/:id", async (req, res) => {
  const id = req.params.id;
  const applicantData = req.body;

  try {
    const query = { _id: new ObjectId(id) };
    const update = { $push: { applicant: applicantData } };
    const result = await MentorshipCollection.updateOne(query, update);

    if (result.modifiedCount > 0) {
      res.status(200).send({ message: "Application submitted successfully!" });
    } else {
      res
        .status(404)
        .send({ message: "Mentorship not found or no changes made." });
    }
  } catch (error) {
    console.error("Error applying for mentorship:", error);
    res.status(500).send({ message: "Error applying for mentorship", error });
  }
});

// Update a Mentorship by ID
app.put("/Mentorship/:id", async (req, res) => {
  const id = req.params.id;
  const updateData = req.body;

  try {
    const query = { _id: new ObjectId(id) };
    const update = { $set: updateData };

    const result = await MentorshipCollection.updateOne(query, update);

    if (result.modifiedCount > 0) {
      return res
        .status(200)
        .send({ message: "Mentorship updated successfully!" });
    }

    res
      .status(404)
      .send({ message: "Mentorship not found or no changes made." });
  } catch (error) {
    console.error("Error updating mentorship:", error);
    res.status(500).send({ message: "Error updating mentorship", error });
  }
});

// Delete a Mentorship by ID
app.delete("/Mentorship/:id", async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };

  try {
    const result = await MentorshipCollection.deleteOne(query);

    if (result.deletedCount > 0) {
      return res
        .status(200)
        .send({ message: "Mentorship deleted successfully!" });
    }

    res
      .status(404)
      .send({ message: "Mentorship not found or already deleted." });
  } catch (error) {
    console.error("Error deleting mentorship:", error);
    res.status(500).send({ message: "Error deleting mentorship", error });
  }
});

// Delete a review by reviewerEmail from a mentorship post
app.delete("/Mentorship/Reviews/:id", async (req, res) => {
  const mentorshipId = req.params.id;
  const { reviewerEmail } = req.body;

  if (!reviewerEmail) {
    return res.status(400).send({ message: "Reviewer email is required." });
  }

  try {
    const query = { _id: new ObjectId(mentorshipId) };
    const update = { $pull: { reviews: { reviewerEmail } } };

    const result = await MentorshipCollection.updateOne(query, update);

    if (result.modifiedCount > 0) {
      return res.status(200).send({ message: "Review deleted successfully!" });
    }

    res.status(404).send({ message: "Review not found or no changes made." });
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).send({ message: "Error deleting review", error });
  }
});

// Delete an applicant by applicantEmail from a mentorship post
app.delete("/Mentorship/Apply/:id", async (req, res) => {
  const mentorshipId = req.params.id;
  const { applicantEmail } = req.body;

  if (!applicantEmail) {
    return res.status(400).send({ message: "Applicant email is required." });
  }

  try {
    const query = { _id: new ObjectId(mentorshipId) };
    const update = { $pull: { applicant: { applicantEmail } } };

    const result = await MentorshipCollection.updateOne(query, update);

    if (result.modifiedCount > 0) {
      return res
        .status(200)
        .send({ message: "Applicant deleted successfully!" });
    }

    res
      .status(404)
      .send({ message: "Applicant not found or no changes made." });
  } catch (error) {
    console.error("Error deleting applicant:", error);
    res.status(500).send({ message: "Error deleting applicant", error });
  }
});

module.exports = router;
