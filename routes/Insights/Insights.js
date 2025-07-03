const express = require("express");
const router = express.Router();
const { client } = require("../../config/db");
const { ObjectId } = require("mongodb");

const InsightsCollection = client
  .db("Master-Job-Shop")
  .collection("Salary-Insight");

// Get Salary Insight(s)
app.get("/Insights", async (req, res) => {
  try {
    const { id } = req.query;
    let query = {};

    if (id) {
      // Query by specific ID
      query._id = new ObjectId(id);
    }

    const result = await InsightsCollection.find(query).toArray();

    if (result.length === 1) {
      res.send(result[0]); // Send single object
    } else {
      res.send(result); // Send array
    }
  } catch (error) {
    console.error("Error fetching salary insight(s):", error);
    res
      .status(500)
      .send({ message: "Failed to fetch salary insight(s)", error });
  }
});

// Total Posted Salary Insight Count API
app.get("/InsightsCount", async (req, res) => {
  try {
    const count = await InsightsCollection.countDocuments();
    res.status(200).json({ count });
  } catch (error) {
    console.error("Error counting salary insights:", error);
    res.status(500).send({
      message: "Failed to retrieve salary insight count.",
      error,
    });
  }
});

// Post Salary Insight
app.post("/Insights", async (req, res) => {
  try {
    const request = req.body;

    if (!request || Object.keys(request).length === 0) {
      return res.status(400).send({ message: "Request body is required." });
    }

    const result = await InsightsCollection.insertOne(request);

    res.status(201).send({
      message: "Salary Insight posted successfully.",
      insertedId: result.insertedId,
    });
  } catch (error) {
    console.error("Error posting salary insight:", error);
    res.status(500).send({
      message: "Failed to post Salary Insight.",
      error,
    });
  }
});

// Delete a single Salary Insight by ID
app.delete("/Insights/:id", async (req, res) => {
  try {
    const id = req.params.id;

    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ message: "Invalid ID format." });
    }

    const query = { _id: new ObjectId(id) };
    const result = await InsightsCollection.deleteOne(query);

    if (result.deletedCount === 1) {
      res.status(200).send({ message: "Salary Insight deleted successfully." });
    } else {
      res.status(404).send({ message: "Salary Insight not found." });
    }
  } catch (error) {
    console.error("Error deleting salary insight:", error);
    res.status(500).send({
      message: "Failed to delete Salary Insight.",
      error,
    });
  }
});

module.exports = router;
