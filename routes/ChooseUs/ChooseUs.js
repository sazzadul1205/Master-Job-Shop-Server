const express = require("express");
const router = express.Router();
const { client } = require("../../config/db");
const { ObjectId } = require("mongodb");

const ChooseUsCollection = client
  .db("Master-Job-Shop")
  .collection("WhyChooseUs");

// GET WhyChooseUs (optionally by id)
router.get("/", async (req, res) => {
  const { id } = req.query;

  let query = {};
  if (id) {
    try {
      query._id = new ObjectId(id);
    } catch {
      return res.status(400).send({ message: "Invalid ID format." });
    }
  }

  try {
    const result = await ChooseUsCollection.find(query).toArray();
    res.send(result.length === 1 ? result[0] : result);
  } catch (error) {
    console.error("Error fetching WhyChooseUs:", error);
    res.status(500).send({ message: "Error fetching WhyChooseUs", error });
  }
});

// PUT (edit) a WhyChooseUs entry by ID
router.put("/:id", async (req, res) => {
  const id = req.params.id;
  const updatedData = req.body;

  let query;
  try {
    query = { _id: new ObjectId(id) };
  } catch {
    return res.status(400).send({ message: "Invalid ID format." });
  }

  try {
    const result = await ChooseUsCollection.updateOne(query, {
      $set: updatedData,
    });

    if (result.modifiedCount > 0) {
      res.status(200).send({ message: "WhyChooseUs updated successfully!" });
    } else {
      res.status(404).send({ message: "Entry not found or no changes made." });
    }
  } catch (error) {
    console.error("Error updating WhyChooseUs:", error);
    res.status(500).send({ message: "Error updating WhyChooseUs", error });
  }
});

module.exports = router;
