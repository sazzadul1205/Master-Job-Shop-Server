const express = require("express");
const router = express.Router();
const { client } = require("../../config/db");
const { ObjectId } = require("mongodb");

const EventCollection = client
  .db("Master-Job-Shop")
  .collection("Event-Applications");

// GET: Fetch all or filtered applications
router.get("/", async (req, res) => {
  try {
    // Destructure query parameters from the request
    const { id, eventId, eventIds, email, phone } = req.query;
    const query = {};

    // If a single application ID is provided, validate and convert it to ObjectId
    if (id) {
      try {
        query._id = new ObjectId(id);
      } catch (err) {
        return res.status(400).json({ message: "Invalid ID format." });
      }
    }

    // If a single eventId is provided, add it to the query
    if (eventId) {
      query.eventId = eventId;
    }

    // If email is provided, add it to the query
    if (email) {
      query.email = email;
    }

    // If phone is provided, add it to the query
    if (phone) {
      query.phone = phone;
    }

    // If multiple event IDs are provided as an array (eventIds[]), handle it
    if (eventIds) {
      // Ensure eventIds is always treated as an array
      const eventIdArray = Array.isArray(eventIds) ? eventIds : [eventIds];
      query.eventId = { $in: eventIdArray }; // Match any eventId in the array
    }

    // Query the database with the built query object
    const results = await EventCollection.find(query).toArray();

    // If only one result found, return the object directly, else return array
    res.json(results.length === 1 ? results[0] : results);
  } catch (error) {
    console.error("GET /EventApplications error:", error);
    res.status(500).json({ message: "Server error fetching applications." });
  }
});

// GET: Check if a user already applied for a specific Event
router.get("/Exists", async (req, res) => {
  try {
    const { email, eventId } = req.query;

    if (!email || !eventId) {
      return res.status(400).json({ message: "Missing email or eventId." });
    }

    const applicationExists = await EventCollection.findOne({
      email,
      eventId,
    });

    res.json({ exists: !!applicationExists });
  } catch (error) {
    console.error("GET /EventApplications/Exists error:", error);
    res
      .status(500)
      .json({ message: "Server error checking application status." });
  }
});

// POST: Submit new application
router.post("/", async (req, res) => {
  try {
    const application = req.body;

    if (!application || !application.eventId || !application.email) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const result = await EventCollection.insertOne(application);
    res.status(201).json({ insertedId: result.insertedId });
  } catch (error) {
    console.error("POST /EventApplications error:", error);
    res.status(500).json({ message: "Server error submitting application." });
  }
});

// DELETE: Delete an application by ID
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID format." });
    }

    const result = await EventCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Application not found." });
    }

    res.json({ message: "Application deleted successfully." });
  } catch (error) {
    console.error("DELETE /EventApplications/:id error:", error);
    res.status(500).json({ message: "Server error deleting application." });
  }
});

module.exports = router;
