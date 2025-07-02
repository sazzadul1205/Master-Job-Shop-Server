const express = require("express");
const router = express.Router();
const { client } = require("../config/db");
const { ObjectId } = require("mongodb");

const CompanyCollection = client
  .db("Master-Job-Shop")
  .collection("Company-Profiles");

// Get Company Profiles
app.get("/Company", async (req, res) => {
  const { id, email, postedBy } = req.query;

  let query = {};

  // Filter by _id if provided
  if (id) {
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid job ID." });
    }
    query._id = new ObjectId(id);
  }

  // Filter by email if provided
  if (email) {
    query.email = email;
  }

  // Filter by postedBy if provided
  if (postedBy) {
    query.postedBy = postedBy;
  }

  try {
    const results = await CompanyCollection.find(query).toArray();

    if (results.length === 1) {
      res.send(results[0]); // Send single object if only one found
    } else {
      res.send(results); // Otherwise send array
    }
  } catch (error) {
    console.error("Error fetching company profiles:", error);
    res
      .status(500)
      .send({ message: "Failed to fetch company profiles", error });
  }
});

module.exports = router;
