const express = require("express");
const router = express.Router();
const { client } = require("../../config/db");
const { ObjectId } = require("mongodb");

const GigBidsCollection = client.db("Master-Job-Shop").collection("Gig-Bids");

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

    const results = await GigBidsCollection.find(query).toArray();

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

    const applicationExists = await GigBidsCollection.findOne({ email, gigId });

    res.json({ exists: !!applicationExists });
  } catch (error) {
    console.error("GET /GigBids/exists error:", error);
    res
      .status(500)
      .json({ message: "Server error checking application status." });
  }
});

// GET: Fetch daily application count by multiple GigBidIds
router.get("/DailyStatus", async (req, res) => {
  try {
    const { gigIds } = req.query;

    let matchStage = {};
    if (gigIds) {
      const idsArray = Array.isArray(gigIds)
        ? gigIds
        : gigIds.split(",").map((id) => id.trim());

      matchStage.gigId = { $in: idsArray };
    }

    const pipeline = [
      { $match: matchStage }, // Filters only if gigIds were provided
      {
        $addFields: {
          submittedAtDate: {
            $cond: [
              { $ne: ["$submittedAt", null] },
              { $toDate: "$submittedAt" },
              null,
            ],
          },
        },
      },
      {
        $match: { submittedAtDate: { $ne: null } },
      },
      {
        $project: {
          date: {
            $dateToString: { format: "%Y-%m-%d", date: "$submittedAtDate" },
          },
        },
      },
      {
        $group: {
          _id: "$date",
          bids: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          Date: "$_id",
          bids: 1,
        },
      },
      { $sort: { Date: 1 } },
    ];

    const dailyCounts = await GigBidsCollection.aggregate(pipeline).toArray();

    res.status(200).json(dailyCounts);
  } catch (error) {
    console.error("Error fetching daily gig bid counts:", error);
    res.status(500).json({ message: "Server error fetching daily status." });
  }
});

// GET: Fetch latest bids for given gig IDs with controllable limit
router.get("/LatestBids", async (req, res) => {
  try {
    let { gigIds, limit } = req.query;

    if (!gigIds) {
      return res
        .status(400)
        .json({ message: "gigIds query parameter is required." });
    }

    if (typeof gigIds === "string") {
      gigIds = gigIds.split(",").map((id) => id.trim());
    }

    // Parse limit, default to 5 if not provided or invalid
    limit = parseInt(limit);
    if (isNaN(limit) || limit <= 0) {
      limit = 5;
    }

    // Query: match any gigId in the provided list
    const query = { gigId: { $in: gigIds } };

    // Fetch bids sorted by submittedAt descending, limited by 'limit'
    const results = await GigBidsCollection.find(query)
      .sort({ submittedAt: -1 })
      .limit(limit)
      .toArray();

    console.log(
      `LatestBids -> Gig IDs: ${gigIds.length}, Bids fetched: ${results.length}, Limit: ${limit}`
    );

    res.json(results);
  } catch (error) {
    console.error("GET /LatestBids error:", error);
    res.status(500).json({ message: "Server error fetching latest bids." });
  }
});

// POST: Submit new bid
router.post("/", async (req, res) => {
  try {
    const bid = req.body;

    if (!bid || !bid.gigId || !bid.email) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const result = await GigBidsCollection.insertOne(bid);
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

    const result = await GigBidsCollection.updateOne(
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

// PUT: Accept a job Bid and store interview details
router.put("/Accepted/:id", async (req, res) => {
  const { id } = req.params;

  // Validate ObjectId
  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid Bid ID." });
  }

  try {
    const filter = { _id: new ObjectId(id) };

    // Destructure nested interview object properly
    const { interview } = req.body || {};
    const { interviewTime, mode, platform, notes } = interview || {};

    // Build interview object dynamically to avoid empty fields
    const updatedInterview = {};
    if (interviewTime) updatedInterview.interviewTime = interviewTime;
    if (mode) updatedInterview.mode = mode;
    if (platform) updatedInterview.platform = platform;
    if (notes) updatedInterview.notes = notes;

    const updateDoc = {
      $set: {
        status: "Accepted",
        interview: updatedInterview,
        updatedAt: new Date(),
      },
    };

    const result = await GigBidsCollection.updateOne(filter, updateDoc);

    if (result.modifiedCount === 0) {
      return res
        .status(404)
        .json({ message: "Bid not found or no changes made." });
    }

    res.json({
      message: "Bid accepted and interview details stored.",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("PUT /Accepted/:id error:", error);
    res.status(500).json({ message: "Server error updating Bid." });
  }
});

// DELETE: Remove a bid by ID
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID format." });
    }

    const result = await GigBidsCollection.deleteOne({ _id: new ObjectId(id) });

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
