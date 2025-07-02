const express = require("express");
const router = express.Router();
const { client } = require("../config/db");
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

    const result = await SalaryInsightCollection.find(query).toArray();

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

module.exports = router;
