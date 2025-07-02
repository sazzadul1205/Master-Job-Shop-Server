const express = require("express");
const router = express.Router();
const { client } = require("../config/db");
const { ObjectId } = require("mongodb");

const GigsCollection = client.db("Master-Job-Shop").collection("Posted-Gig");

// Get Posted Gig
app.get("/Gigs", async (req, res) => {
  const { id, postedBy, email } = req.query;

  try {
    const query = {};

    // Filter by Gig ID
    if (id) {
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid ID format." });
      }
      query._id = new ObjectId(id);
    }

    // Filter by PostedBy email
    if (postedBy) {
      query.PostedBy = postedBy;
    }

    // Filter by applicant email or related email fields (adjust field name if needed)
    if (email) {
      query["PeopleApplied.email"] = email;
    }

    const results = await GigsCollection.find(query).toArray();

    // Return single object if only one match
    if (results.length === 1) {
      return res.status(200).json(results[0]);
    }

    // Return array (empty or multiple)
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
app.get("/GigsCount", async (req, res) => {
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

// Apply for a Posted Gig
app.post("/Gigs/Apply/:id", async (req, res) => {
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
app.post("/Gigs", async (req, res) => {
  const gigData = req.body;

  if (!gigData || !gigData.title || !gigData.PostedBy) {
    return res
      .status(400)
      .send({ message: "Invalid gig data. Title and PostedBy are required." });
  }

  try {
    const result = await GigsCollection.insertOne(gigData);
    res.status(201).send({
      message: "Gig posted successfully!",
      insertedId: result.insertedId,
    });
  } catch (error) {
    console.error("Error posting gig:", error);
    res
      .status(500)
      .send({ message: "Failed to post gig", error: error.message });
  }
});

module.exports = router;
