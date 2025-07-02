const express = require("express");
const router = express.Router();
const { client } = require("../config/db");
const { ObjectId } = require("mongodb");

const BlogsCollection = client.db("Master-Job-Shop").collection("Blogs");

// Get Blogs (optionally filter by postedBy or id)
app.get("/Blogs", async (req, res) => {
  const { postedBy, id } = req.query;

  let query = {};

  if (postedBy) {
    query.postedBy = postedBy;
  }

  if (id) {
    try {
      query._id = new ObjectId(id);
    } catch (error) {
      return res.status(400).send({ message: "Invalid blog ID." });
    }
  }

  try {
    const result = await BlogsCollection.find(query).toArray();

    if (result.length === 1) {
      res.send(result[0]); // Return single object if only one found
    } else {
      res.send(result); // Otherwise return array
    }
  } catch (error) {
    console.error("Error fetching blogs:", error);
    res.status(500).send({ message: "Internal Server Error", error });
  }
});

// Total Posted Blogs Count API
app.get("/BlogsCount", async (req, res) => {
  try {
    const count = await BlogsCollection.countDocuments();
    res.status(200).json({ count });
  } catch (error) {
    console.error("Error counting blogs:", error);
    res.status(500).json({ message: "Failed to retrieve blog count.", error });
  }
});

module.exports = router;
