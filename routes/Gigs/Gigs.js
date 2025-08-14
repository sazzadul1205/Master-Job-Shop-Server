const express = require("express");
const router = express.Router();
const { client } = require("../../config/db");
const { ObjectId } = require("mongodb");

const GigsCollection = client.db("Master-Job-Shop").collection("Posted-Gig");

// Get Posted Gig
router.get("/", async (req, res) => {
  const { id, gigIds, postedBy, email } = req.query;

  try {
    const query = {};

    // Single Gig ID
    if (id) {
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid ID format." });
      }
      query._id = new ObjectId(id);
    }

    // Multiple Gig IDs
    if (gigIds) {
      try {
        const idsArray = gigIds.split(",").map((id) => {
          if (!ObjectId.isValid(id.trim())) throw new Error();
          return new ObjectId(id.trim());
        });

        query._id = { $in: idsArray };
      } catch (err) {
        return res.status(400).json({ message: "Invalid gigIds format." });
      }
    }

    // Posted by email
    if (postedBy) {
      query["postedBy.email"] = postedBy;
    }

    // Filter by applicant email
    if (email) {
      query["PeopleApplied.email"] = email;
    }

    const results = await GigsCollection.find(query).toArray();

    // Return single object if only one match
    if (results.length === 1) {
      return res.status(200).json(results[0]);
    }

    return res.status(200).json(results);
  } catch (error) {
    console.error("Error fetching gigs:", error);
    return res.status(500).json({
      message: "An error occurred while fetching gigs.",
      error: error.message,
    });
  }
});

// Get Total Posted Gigs Count
router.get("/GigsCount", async (req, res) => {
  try {
    const count = await GigsCollection.countDocuments();
    res.status(200).json({ count });
  } catch (error) {
    console.error("Error counting posted gigs:", error);
    res.status(500).json({
      message: "Failed to retrieve posted gig count.",
      error: error.message,
    });
  }
});

// GET: Daily gig post counts by postedBy email or all if none provided
router.get("/DailyGigPosted", async (req, res) => {
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
      { $match: { postedAtDate: { $ne: null } } },
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

    const results = await GigsCollection.aggregate(pipeline).toArray();

    if (results.length === 0) {
      return res
        .status(404)
        .json({ message: "No gigs found for the given criteria." });
    }

    res.status(200).json(results);
  } catch (error) {
    console.error("Error fetching daily gig posts:", error);
    res.status(500).json({
      message: "An error occurred while fetching daily gig posts.",
    });
  }
});

// GET: Fetch Gig IDs by postedBy email
router.get("/Ids", async (req, res) => {
  try {
    const { postedBy } = req.query;

    if (!postedBy) {
      return res
        .status(400)
        .json({ message: "postedBy query parameter is required." });
    }

    // Find gigs where postedBy.email matches the query param
    const gigs = await GigsCollection.find(
      { "postedBy.email": postedBy },
      { projection: { _id: 1 } }
    ).toArray();

    if (!gigs || gigs.length === 0) {
      return res
        .status(404)
        .json({ message: "No gigs found for the given postedBy." });
    }

    // Extract _id strings
    const ids = gigs.map((gig) => gig._id.toString());

    return res.status(200).json(ids);
  } catch (error) {
    console.error("Error fetching gig IDs by postedBy:", error);
    return res
      .status(500)
      .json({ message: "An error occurred while fetching gig IDs." });
  }
});

// GET: Fetch Job Summaries by ID(s)
router.get("/Summary", async (req, res) => {
  try {
    const { id, gigIds } = req.query;

    // Handle single gig by id
    if (id) {
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid gig ID." });
      }

      const gig = await GigsCollection.findOne(
        { _id: new ObjectId(id) },
        { projection: { _id: 1, title: 1 } }
      );

      if (!gig) {
        return res.status(404).json({ message: "Gig not found." });
      }
      return res.status(200).json(job);
    }

    // Handle multiple gigIds (CSV string)
    if (gigIds) {
      let idsArray;
      try {
        idsArray = gigIds.split(",").map((id) => new ObjectId(id.trim()));
      } catch (err) {
        return res.status(400).json({ message: "Invalid gigIds format." });
      }

      const gigs = await GigsCollection.find(
        { _id: { $in: idsArray } },
        { projection: { _id: 1, title: 1 } }
      ).toArray();

      return res.status(200).json(gigs);
    }

    res
      .status(400)
      .json({ message: "Please provide either 'id' or 'gigIds'." });
  } catch (error) {
    console.error("Error fetching gig summaries:", error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching gig summaries." });
  }
});

// Apply for a Posted Gig
router.post("/Apply/:id", async (req, res) => {
  const id = req.params.id;
  const bidData = req.body;

  if (!id || !bidData || !bidData.email) {
    return res.status(400).send({
      message:
        "Invalid request. Gig ID and bidder info with email are required.",
    });
  }

  try {
    const query = { _id: new ObjectId(id) };
    const update = {
      $push: { peopleBided: bidData },
    };

    const result = await GigsCollection.updateOne(query, update);

    if (result.modifiedCount > 0) {
      res.status(200).send({ message: "Application submitted successfully!" });
    } else {
      res.status(404).send({ message: "Gig not found or no changes made." });
    }
  } catch (error) {
    console.error("Error applying for the gig:", error);
    res
      .status(500)
      .send({ message: "Error applying for the gig", error: error.message });
  }
});

// Post a New Gig
router.post("/", async (req, res) => {
  const gigData = req.body;

  if (!gigData || !gigData.title || !gigData.postedBy) {
    return res.status(400).send({
      message: "Invalid gig data. 'title' and 'postedBy' are required.",
    });
  }

  try {
    // Insert into database
    const result = await GigsCollection.insertOne(gigData);

    res.status(201).send({
      message: "Gig posted successfully!",
      insertedId: result.insertedId,
    });
  } catch (error) {
    console.error("Error posting gig:", error);
    res.status(500).send({
      message: "Failed to post gig",
      error: error.message,
    });
  }
});

// Update a Posted Gig
router.put("/:id", async (req, res) => {
  const id = req.params.id;
  const updatedData = req.body;

  if (!id || !updatedData || typeof updatedData !== "object") {
    return res.status(400).json({
      message: "Invalid request. Gig ID and update data are required.",
    });
  }

  try {
    const query = { _id: new ObjectId(id) };
    const update = { $set: updatedData };

    const result = await GigsCollection.updateOne(query, update);

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Gig not found." });
    }

    if (result.modifiedCount === 0) {
      // No changes detected
      return res
        .status(200)
        .json({ message: "No changes were made to the gig." });
    }

    return res.status(200).json({ message: "Gig updated successfully!" });
  } catch (error) {
    console.error("Error updating the gig:", error);
    return res.status(500).json({
      message: "An error occurred while updating the gig.",
      error: error.message,
    });
  }
});

// Update a Posted Gig's State or Rating
router.patch("/:id", async (req, res) => {
  const gigId = req.params.id;
  const { state, rating } = req.body;

  if (!state && rating === undefined) {
    return res.status(400).send({
      message: "At least one of 'state' or 'rating' must be provided.",
    });
  }

  let updateFields = {};
  if (state) updateFields.state = state;
  if (rating !== undefined) updateFields.rating = rating;

  try {
    const query = { _id: new ObjectId(gigId) };
    const update = { $set: updateFields };

    const result = await GigsCollection.updateOne(query, update);

    if (result.matchedCount === 0) {
      return res.status(404).send({ message: "Gig not found." });
    }

    if (result.modifiedCount === 0) {
      return res
        .status(200)
        .send({ message: "No changes were made to the gig." });
    }

    res.status(200).send({
      message: "Gig updated successfully!",
      updatedFields: updateFields,
    });
  } catch (error) {
    console.error("Error updating gig:", error);
    res.status(500).send({
      message: "An error occurred while updating the gig.",
      error: error.message,
    });
  }
});

// Delete a specific bidder from the peopleBided array
router.delete("/Bidder/:id", async (req, res) => {
  const { id } = req.params;
  const { email } = req.body;

  // Input validation
  if (!id || !email) {
    return res.status(400).send({
      message: "Both gig ID and bidder email are required.",
    });
  }

  try {
    const query = { _id: new ObjectId(id) };
    const update = {
      $pull: {
        peopleBided: { biderEmail: email },
      },
    };

    const result = await GigsCollection.updateOne(query, update);

    if (result.modifiedCount > 0) {
      res.status(200).send({ message: "Bidder removed successfully." });
    } else {
      res
        .status(404)
        .send({ message: "Gig not found or bidder does not exist." });
    }
  } catch (error) {
    console.error("Error removing bidder:", error);
    res.status(500).send({
      message: "An error occurred while removing the bidder.",
      error: error.message,
    });
  }
});

// Delete a single Posted Gig by ID
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  // Validate ID
  if (!id) {
    return res.status(400).send({ message: "Gig ID is required." });
  }

  try {
    const query = { _id: new ObjectId(id) };
    const result = await GigsCollection.deleteOne(query);

    if (result.deletedCount > 0) {
      res.status(200).send({ message: "Gig deleted successfully!" });
    } else {
      res.status(404).send({ message: "Gig not found with the provided ID." });
    }
  } catch (error) {
    console.error("Error deleting gig:", error);
    res.status(500).send({
      message: "An error occurred while deleting the gig.",
      error: error.message,
    });
  }
});

module.exports = router;
