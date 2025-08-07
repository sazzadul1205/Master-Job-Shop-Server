const express = require("express");
const router = express.Router();
const { client } = require("../../config/db");
const { ObjectId } = require("mongodb");

const GigCollection = client.db("Master-Job-Shop").collection("Gig-Bids");

// GET: Fetch all or filtered bids
router.get("/", async (req, res) => {
  try {
    const { id, email, phone, gigId, gigIds } = req.query;
    const query = {};

    // Handle single _id
    if (id) {
      try {
        query._id = new ObjectId(id);
      } catch (err) {
        return res.status(400).json({ message: "Invalid ID format." });
      }
    }

    // Handle single gigId (string)
    if (gigId) {
      query.gigId = gigId;
    }

    // If email is provided, add it to the query
    if (email) {
      query.email = email;
    }

    // If phone is provided, add it to the query
    if (phone) {
      query.phone = phone;
    }

    // If multiple gig IDs are provided as an array (gigIds[]), handle it
    if (gigIds) {
      const gigIdArray = Array.isArray(gigIds) ? gigIds : [gigIds];
      query.gigId = { $in: gigIdArray };
    }

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

    const applicationExists = await GigCollection.findOne({ email, gigId });

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

// PUT: Update status of an Bid by ID
router.put("/Status/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid Bid ID." });
    }

    if (typeof status !== "string" || !status.trim()) {
      return res.status(400).json({
        message: "Status is required and must be a non-empty string.",
      });
    }

    const result = await GigCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: status.trim() } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Bid not found." });
    }

    res.json({ message: "Status updated successfully." });
  } catch (error) {
    console.error("PUT /Status/:id error:", error);
    res.status(500).json({ message: "Server error updating status." });
  }
});

// DELETE: Remove a bid by ID
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID format." });
    }

    const result = await GigCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Bid not found." });
    }

    res.json({ message: "Bid deleted successfully." });
  } catch (error) {
    console.error("DELETE /GigBids/:id error:", error);
    res.status(500).json({ message: "Server error deleting bid." });
  }
});

module.exports = router;
