const express = require("express");
const router = express.Router();
const { client } = require("../../config/db");
const { ObjectId } = require("mongodb");

const GigCollection = client.db("Master-Job-Shop").collection("Gig-Bids");

// GET: Fetch all or filtered bids
router.get("/", async (req, res) => {
  try {
    const { id, gigId, email, phone } = req.query;
    const query = {};

    if (id) {
      try {
        query._id = new ObjectId(id);
      } catch (err) {
        return res.status(400).json({ message: "Invalid ID format." });
      }
    }
    if (gigId) query.gigId = gigId;
    if (email) query.email = email;
    if (phone) query.phone = phone;

    const results = await GigCollection.find(query).toArray();

    res.json(results.length === 1 ? results[0] : results);
  } catch (error) {
    console.error("GET /GigBids error:", error);
    res.status(500).json({ message: "Server error fetching bids." });
  }
});

// GET: Check if a user already applied for a specific job
router.get("/Exists", async (req, res) => {
  try {
    const { email, gigId } = req.query;

    if (!email || !gigId) {
      return res.status(400).json({ message: "Missing email or gigId." });
    }

    const applicationExists = await JobCollection.findOne({ email, gigId });

    res.json({ exists: !!applicationExists });
  } catch (error) {
    console.error("GET /GigBids/exists error:", error);
    res
      .status(500)
      .json({ message: "Server error checking application status." });
  }
});

// POST: Submit new bid
router.post("/", async (req, res) => {
  try {
    const bid = req.body;

    if (!bid || !bid.gigId || !bid.email) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const result = await GigCollection.insertOne(bid);
    res.status(201).json({ insertedId: result.insertedId });
  } catch (error) {
    console.error("POST /GigBids error:", error);
    res.status(500).json({ message: "Server error submitting bid." });
  }
});
module.exports = router;
