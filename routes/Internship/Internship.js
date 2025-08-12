const express = require("express");
const router = express.Router();
const { client } = require("../../config/db");
const { ObjectId } = require("mongodb");

const InternshipCollection = client
  .db("Master-Job-Shop")
  .collection("Internship");

// Get Internship(s)
router.get("/", async (req, res) => {
  const { id, postedBy, internshipIds } = req.query;
  let query = {};

  try {
    // Single Internship ID
    if (id) {
      if (!ObjectId.isValid(id)) {
        return res
          .status(400)
          .json({ message: "Invalid internship ID format." });
      }
      query._id = new ObjectId(id);
    }

    // Multiple Internship IDs (comma-separated string)
    if (internshipIds) {
      try {
        const idsArray = internshipIds.split(",").map((id) => {
          const trimmed = id.trim();
          if (!ObjectId.isValid(trimmed)) throw new Error();
          return new ObjectId(trimmed);
        });
        query._id = { $in: idsArray };
      } catch (err) {
        return res.status(400).json({
          message:
            "Invalid internshipIds format. Must be a comma-separated list of valid IDs.",
        });
      }
    }

    // Posted by email
    if (postedBy) {
      query["postedBy.email"] = postedBy;
    }

    const results = await InternshipCollection.find(query).toArray();

    // Return single or multiple results
    if (results.length === 1) {
      return res.status(200).json(results[0]);
    } else {
      return res.status(200).json(results);
    }
  } catch (error) {
    console.error("Error fetching internships:", error);
    res.status(500).json({ message: "Error fetching internships", error });
  }
});

// Total Posted Internship Count
router.get("/InternshipCount", async (req, res) => {
  try {
    const count = await InternshipCollection.countDocuments();
    res.json({ count });
  } catch (error) {
    console.error("Error counting internships:", error);
    res.status(500).json({ message: "Error counting internships", error });
  }
});

// GET: Daily Internship post counts by postedBy email or all if none provided
router.get("/DailyInternshipPosted", async (req, res) => {
  try {
    const { postedBy } = req.query;

    const matchStage = postedBy ? { "postedBy.email": postedBy } : {};

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

    const results = await InternshipCollection.aggregate(pipeline).toArray();

    if (results.length === 0) {
      return res.status(404).json({
        message: postedBy
          ? "No internships found for the given postedBy."
          : "No internships found.",
      });
    }

    res.status(200).json(results);
  } catch (error) {
    console.error("Error fetching daily internship posts:", error);
    res.status(500).json({
      message: "An error occurred while fetching daily internship posts.",
    });
  }
});

// GET: Fetch Internship IDs by postedBy email
router.get("/Ids", async (req, res) => {
  try {
    const { postedBy } = req.query;

    if (!postedBy) {
      return res
        .status(400)
        .json({ message: "postedBy query parameter is required." });
    }

    // Find internships where postedBy.email matches the query param
    const internships = await InternshipCollection.find(
      { "postedBy.email": postedBy },
      { projection: { _id: 1 } }
    ).toArray();

    if (!internships || internships.length === 0) {
      return res
        .status(404)
        .json({ message: "No internships found for the given postedBy." });
    }

    // Extract _id strings
    const ids = internships.map((internship) => internship._id.toString());

    return res.status(200).json(ids);
  } catch (error) {
    console.error("Error fetching internship IDs by postedBy:", error);
    return res
      .status(500)
      .json({ message: "An error occurred while fetching internship IDs." });
  }
});

// Post a new Internship
router.post("/", async (req, res) => {
  try {
    const request = req.body;
    const result = await InternshipCollection.insertOne(request);
    res.status(201).send(result);
  } catch (error) {
    console.error("Error posting internship:", error);
    res.status(500).send({ message: "Error posting internship", error });
  }
});

// Apply for an Internship (push applicant data to applicants array)
router.post("/Apply/:id", async (req, res) => {
  const id = req.params.id; // Internship ID from URL params
  const applicantData = req.body; // Applicant data from request body

  const query = { _id: new ObjectId(id) };
  const update = {
    $push: { applicants: applicantData },
  };

  try {
    const result = await InternshipCollection.updateOne(query, update);

    if (result.modifiedCount > 0) {
      res.status(200).send({ message: "Application submitted successfully!" });
    } else {
      res
        .status(404)
        .send({ message: "Internship not found or no changes made." });
    }
  } catch (error) {
    console.error("Error applying for internship:", error);
    res.status(500).send({ message: "Error applying for internship", error });
  }
});

// Update an Internship by ID
router.put("/:id", async (req, res) => {
  const id = req.params.id;
  const updateData = req.body;

  try {
    const result = await InternshipCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.modifiedCount > 0) {
      res.status(200).send({ message: "Internship updated successfully!" });
    } else {
      res
        .status(404)
        .send({ message: "Internship not found or no changes made." });
    }
  } catch (error) {
    console.error("Error updating internship:", error);
    res.status(500).send({ message: "Error updating internship", error });
  }
});

// Delete an Internship by ID
router.delete("/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const result = await InternshipCollection.deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount > 0) {
      res.status(200).send({ message: "Internship deleted successfully!" });
    } else {
      res
        .status(404)
        .send({ message: "Internship not found or already deleted." });
    }
  } catch (error) {
    console.error("Error deleting internship:", error);
    res.status(500).send({ message: "Error deleting internship", error });
  }
});

// Delete an Applicant from a Posted Internship by ID
router.delete("/Apply/:id", async (req, res) => {
  const id = req.params.id;
  const { applicantEmail } = req.body;

  if (!applicantEmail) {
    return res.status(400).send({ message: "Applicant email is required." });
  }

  try {
    const result = await InternshipCollection.updateOne(
      { _id: new ObjectId(id) },
      { $pull: { applicants: { applicantEmail } } } // Match the field name properly
    );

    if (result.modifiedCount > 0) {
      res.status(200).send({ message: "Applicant removed successfully!" });
    } else {
      res.status(404).send({ message: "Internship or applicant not found." });
    }
  } catch (error) {
    console.error("Error removing applicant:", error);
    res.status(500).send({ message: "Error removing applicant", error });
  }
});

module.exports = router;
