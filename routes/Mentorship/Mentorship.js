const express = require("express");
const router = express.Router();
const { client } = require("../../config/db");
const { ObjectId } = require("mongodb");

const MentorshipCollection = client
  .db("Master-Job-Shop")
  .collection("Mentorship");

// GET: Get Mentorship
router.get("/", async (req, res) => {
  const { id, postedBy, mentorEmail, mentorshipIds, archived, status } =
    req.query;

  const query = { $and: [] };

  // Single ID
  if (id) {
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid id format." });
    }
    query.$and.push({ _id: new ObjectId(id) });
  }

  // Multiple Mentorship IDs
  if (mentorshipIds) {
    try {
      const idsArray = mentorshipIds.split(",").map((id) => {
        const trimmed = id.trim();
        if (!ObjectId.isValid(trimmed)) throw new Error();
        return new ObjectId(trimmed);
      });
      query.$and.push({ _id: { $in: idsArray } });
    } catch (err) {
      return res.status(400).json({
        message:
          "Invalid mentorshipIds format. Must be a comma-separated list of valid IDs.",
      });
    }
  }

  // Posted By or Mentor Email
  if (postedBy || mentorEmail) {
    const emailOr = [];
    if (postedBy) emailOr.push({ postedBy });
    if (mentorEmail) emailOr.push({ "Mentor.email": mentorEmail });
    if (emailOr.length > 0) query.$and.push({ $or: emailOr });
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

  // Status filter
  if (status) {
    const statuses = status
      .split(",")
      .map((s) =>
        s.trim().toLowerCase() === "onhold" ? "onHold" : s.trim().toLowerCase()
      );
    query.$and.push({ status: { $in: statuses } });
  }

  // If $and is empty, just query everything
  const finalQuery = query.$and.length > 0 ? { $and: query.$and } : {};

  try {
    const results = await MentorshipCollection.find(finalQuery).toArray();
    res.send(
      Array.isArray(results) && results.length === 1 ? results[0] : results
    );
  } catch (error) {
    console.error("Error fetching mentorship:", error);
    res.status(500).send("Server error.");
  }
});

// GET: Total Posted Mentorship Count API
router.get("/MentorshipCount", async (req, res) => {
  try {
    const count = await MentorshipCollection.countDocuments();
    res.json({ count });
  } catch (error) {
    console.error("Error counting mentorship:", error);
    res.status(500).json({ message: "Failed to get mentorship count." });
  }
});

// POST: Post Mentorship
router.post("/", async (req, res) => {
  try {
    const request = req.body;
    const result = await MentorshipCollection.insertOne(request);
    res.status(201).send(result);
  } catch (error) {
    console.error("Error posting mentorship:", error);
    res.status(500).send({ message: "Failed to create mentorship." });
  }
});

// POST: ply Review for a Mentorship by ID
router.post("/Review/:id", async (req, res) => {
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

// POST: Apply for a Mentorship
router.post("/Apply/:id", async (req, res) => {
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

// PUT: Update a Mentorship by ID
router.put("/:id", async (req, res) => {
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

// PUT: Toggle Archive Status
router.put("/Archive/:id", async (req, res) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid ID format." });
  }

  try {
    // Find the mentorship first
    const mentorship = await MentorshipCollection.findOne({
      _id: new ObjectId(id),
    });
    if (!mentorship) {
      return res.status(404).json({ message: "Mentorship not found." });
    }

    // Determine new archive status
    const newArchivedStatus = !mentorship.archived; // if undefined, !undefined => true

    // Update the mentorship
    await MentorshipCollection.updateOne(
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

// PATCH: Update Mentorship status by ID
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

    const result = await MentorshipCollection.updateOne(
      { _id: objectId },
      { $set: { status } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Application not found." });
    }

    res.json({ message: "Status updated successfully.", updatedId: id });
  } catch (error) {
    console.error("PATCH Mentorship ID status Updating error:", error);

    res.status(500).json({ message: "Server error updating status." });
  }
});

// DELETE: Delete a Mentorship by ID
router.delete("/:id", async (req, res) => {
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

// DELETE: Delete a review by reviewerEmail from a mentorship post
router.delete("/Reviews/:id", async (req, res) => {
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

// DELETE: Delete an applicant by applicantEmail from a mentorship post
router.delete("/Apply/:id", async (req, res) => {
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
