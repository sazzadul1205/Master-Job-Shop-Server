const express = require("express");
const router = express.Router();
const { client } = require("../../config/db");
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

// Update a Posted Gig
app.put("/Gigs/:id", async (req, res) => {
  const id = req.params.id;
  const updatedData = req.body;

  if (!id || !updatedData || typeof updatedData !== "object") {
    return res.status(400).send({
      message: "Invalid request. Gig ID and update data are required.",
    });
  }

  try {
    const query = { _id: new ObjectId(id) };
    const update = { $set: updatedData };

    const result = await PostedGigCollection.updateOne(query, update);

    if (result.matchedCount === 0) {
      return res.status(404).send({ message: "Gig not found." });
    }

    if (result.modifiedCount === 0) {
      return res
        .status(200)
        .send({ message: "No changes were made to the gig." });
    }

    res.status(200).send({ message: "Gig updated successfully!" });
  } catch (error) {
    console.error("Error updating the gig:", error);
    res.status(500).send({
      message: "An error occurred while updating the gig.",
      error: error.message,
    });
  }
});

// Update a Posted Gig's State or Rating
app.patch("/Gigs/:id", async (req, res) => {
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

    const result = await PostedGigCollection.updateOne(query, update);

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
app.delete("/Gigs/Bidder/:id", async (req, res) => {
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

    const result = await PostedGigCollection.updateOne(query, update);

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
app.delete("/Gigs/:id", async (req, res) => {
  const { id } = req.params;

  // Validate ID
  if (!id) {
    return res.status(400).send({ message: "Gig ID is required." });
  }

  try {
    const query = { _id: new ObjectId(id) };
    const result = await PostedGigCollection.deleteOne(query);

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
