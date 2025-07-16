const express = require("express");
const router = express.Router();
const { client } = require("../../config/db");
const { ObjectId } = require("mongodb");

const AboutUsCollection = client.db("Master-Job-Shop").collection("AboutUs");

// GET: Retrieve About Us content (single document expected)
router.get("/", async (req, res) => {
  try {
    const data = await AboutUsCollection.findOne({});
    if (!data) {
      return res.status(404).send({ error: "No About Us content found." });
    }
    res.send(data);
  } catch (err) {
    res.status(500).send({ error: "Failed to fetch About Us content." });
  }
});

// POST: Add new About Us content
router.post("/", async (req, res) => {
  try {
    const newContent = req.body;
    if (!newContent || Object.keys(newContent).length === 0) {
      return res.status(400).send({ error: "Request body is empty." });
    }

    const result = await AboutUsCollection.insertOne(newContent);
    res.status(201).send({ insertedId: result.insertedId });
  } catch (err) {
    res.status(500).send({ error: "Failed to add About Us content." });
  }
});

// PUT: Update existing About Us content by ID
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;

  if (!ObjectId.isValid(id)) {
    return res.status(400).send({ error: "Invalid ID format." });
  }

  try {
    const filter = { _id: new ObjectId(id) };
    const update = { $set: updatedData };

    const result = await AboutUsCollection.updateOne(filter, update);

    if (result.matchedCount === 0) {
      return res.status(404).send({ error: "About Us content not found." });
    }

    res.send({ message: "Content updated successfully." });
  } catch (err) {
    res.status(500).send({ error: "Failed to update About Us content." });
  }
});

module.exports = router;
