const express = require("express");
const router = express.Router();
const { client } = require("../config/db");
const { ObjectId } = require("mongodb");

const NewsLetterCollection = client
  .db("Master-Job-Shop")
  .collection("NewsLetter");

// Get all Newsletters
app.get("/NewsLetter", async (req, res) => {
  try {
    const result = await NewsLetterCollection.find().toArray();
    res.send(result.length === 1 ? result[0] : result);
  } catch (error) {
    console.error("Error fetching newsletters:", error);
    res.status(500).send({ message: "Error fetching newsletters", error });
  }
});

// Get total Newsletter count
app.get("/NewsLetterCount", async (req, res) => {
  try {
    const count = await NewsLetterCollection.countDocuments();
    res.json({ count });
  } catch (error) {
    console.error("Error getting newsletter count:", error);
    res.status(500).send({ message: "Error getting newsletter count", error });
  }
});

// Post a new Newsletter
app.post("/NewsLetter", async (req, res) => {
  const request = req.body;
  try {
    const result = await NewsLetterCollection.insertOne(request);
    res
      .status(201)
      .send({ message: "Newsletter posted successfully!", result });
  } catch (error) {
    console.error("Error posting newsletter:", error);
    res.status(500).send({ message: "Failed to post newsletter", error });
  }
});

// Delete a Newsletter by ID
app.delete("/NewsLetter/:id", async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };

  try {
    const result = await NewsLetterCollection.deleteOne(query);
    if (result.deletedCount > 0) {
      res.status(200).send({ message: "Newsletter deleted successfully!" });
    } else {
      res
        .status(404)
        .send({ message: "Newsletter not found or already deleted." });
    }
  } catch (error) {
    console.error("Error deleting newsletter:", error);
    res.status(500).send({ message: "Error deleting newsletter", error });
  }
});

module.exports = router;
