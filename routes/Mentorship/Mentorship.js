const express = require("express");
const router = express.Router();
const { client } = require("../../config/db");
const { ObjectId } = require("mongodb");

const MentorshipCollection = client
  .db("Master-Job-Shop")
  .collection("Mentorship");

// GET: Get Mentorship
router.get("/", async (req, res) => {
  const { id, postedBy, mentorEmail, archived, status } = req.query;

  try {
    let query = {};

    // --- Handle id as single or multiple ---
    if (id) {
      try {
        const idsArray = id.split(",").map((item) => {
          const trimmed = item.trim();
          if (!ObjectId.isValid(trimmed)) throw new Error();
          return new ObjectId(trimmed);
        });

        if (idsArray.length === 1) {
          query._id = idsArray[0]; // single
        } else {
          query._id = { $in: idsArray }; // multiple
        }
      } catch {
        return res.status(400).json({
          message:
            "Invalid id format. Must be a valid ObjectID or a comma-separated list of ObjectIDs.",
        });
      }
    }

    // --- Extra filters (only when id not used) ---
    else {
      query.$and = [];

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
            s.trim().toLowerCase() === "onhold"
              ? "onHold"
              : s.trim().toLowerCase()
          );
        query.$and.push({ status: { $in: statuses } });
      }

      // If no conditions, remove $and
      query = query.$and.length > 0 ? { $and: query.$and } : {};
    }

    // --- Query DB ---
    const results = await MentorshipCollection.find(query).toArray();

    if (results.length === 1 && id) {
      return res.send(results[0]); // return single object if one ID
    }

    res.send(results);
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

// GET: Get Mentorship Titles by ID(s)
router.get("/Title", async (req, res) => {
  let { id, ids } = req.query;

  let mentorshipIds = [];

  if (ids) {
    try {
      mentorshipIds = JSON.parse(ids);
      if (!Array.isArray(mentorshipIds)) throw new Error();
    } catch {
      return res
        .status(400)
        .json({ message: "Invalid 'ids' format. Must be a JSON array." });
    }
  } else if (id) {
    mentorshipIds = [id];
  } else {
    return res.status(400).json({ message: "Mentorship ID(s) required." });
  }

  const invalidIds = mentorshipIds.filter((mId) => !ObjectId.isValid(mId));
  if (invalidIds.length > 0) {
    return res
      .status(400)
      .json({ message: "Invalid ID format in array.", invalidIds });
  }

  try {
    const objectIds = mentorshipIds.map((mId) => new ObjectId(mId));

    const mentorshipDocs = await MentorshipCollection.find(
      { _id: { $in: objectIds } },
      { projection: { title: 1 } }
    ).toArray();

    if (!mentorshipDocs || mentorshipDocs.length === 0) {
      return res.status(404).json({ message: "No mentorship found." });
    }

    // Map results to preserve input order
    const result = mentorshipIds.map((mId) => {
      const doc = mentorshipDocs.find((m) => m._id.toString() === mId);
      return { id: mId, title: doc ? doc.title : null };
    });

    res.json(result);
  } catch (err) {
    console.error("Error fetching mentorship titles:", err);
    res.status(500).json({ message: "Server error." });
  }
});

// GET: Mentorship Status by Mentor Email
router.get("/Status", async (req, res) => {
  const { mentorEmail } = req.query;

  if (!mentorEmail) {
    return res.status(400).json({ message: "mentorEmail is required." });
  }

  try {
    const results = await MentorshipCollection.aggregate([
      // Match mentor email
      { $match: { "Mentor.email": mentorEmail } },

      // Group by postedAt date (converted from string to Date)
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%d-%b-%Y",
              date: { $toDate: "$postedAt" }, // Convert string to Date
            },
          },
          count: { $sum: 1 },
        },
      },

      // Clean projection
      {
        $project: {
          _id: 0,
          Date: "$_id",
          Count: "$count",
        },
      },

      { $sort: { Date: 1 } },
    ]).toArray();

    res.json(results);
  } catch (error) {
    console.error("Error fetching mentorship status:", error);
    res.status(500).json({ message: "Server error." });
  }
});

// GET: Fetch single mentorship by ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid mentorship ID." });
    }

    const mentorship = await MentorshipCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!mentorship) {
      return res.status(404).json({ message: "Mentorship not found." });
    }

    res.status(200).json(mentorship);
  } catch (error) {
    console.error("GET /Mentorship/:id error:", error);
    res.status(500).json({ message: "Server error fetching mentorship." });
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

// DELETE: Bulk delete mentorship by IDs
router.delete("/BulkDelete", async (req, res) => {
  try {
    const { ids } = req.body; // Expecting { ids: ["id1", "id2", ...] }

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No IDs provided." });
    }

    // Validate IDs
    const objectIds = [];
    const invalidIds = [];

    ids.forEach((id) => {
      if (!ObjectId.isValid(id)) {
        invalidIds.push(id);
      } else {
        objectIds.push(new ObjectId(id));
      }
    });

    if (invalidIds.length > 0) {
      return res
        .status(400)
        .json({ message: `Invalid ID(s): ${invalidIds.join(", ")}` });
    }

    // Delete mentorship
    const deleteResult = await MentorshipCollection.deleteMany({
      _id: { $in: objectIds },
    });

    res.status(200).json({
      message: `Successfully deleted ${deleteResult.deletedCount} Mentorship(s).`,
      deletedCount: deleteResult.deletedCount,
      deletedIds: ids,
    });
  } catch (error) {
    console.error("Bulk delete Mentorship error:", error);
    res
      .status(500)
      .json({ message: "Server error during bulk delete of Mentorship's." });
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
