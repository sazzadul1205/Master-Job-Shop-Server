const express = require("express");
const router = express.Router();
const { client } = require("../../config/db");
const { ObjectId } = require("mongodb");

const EventsCollection = client.db("Master-Job-Shop").collection("Events");

// Get Events
router.get("/", async (req, res) => {
  try {
    const { id, postedBy, eventIds } = req.query;
    let query = {};

    // Single Event ID
    if (id) {
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid ID format." });
      }
      query._id = new ObjectId(id);
    }

    // Multiple Event IDs (comma-separated)
    if (eventIds) {
      try {
        const idsArray = eventIds.split(",").map((singleId) => {
          const trimmed = singleId.trim();
          if (!ObjectId.isValid(trimmed)) throw new Error();
          return new ObjectId(trimmed);
        });
        query._id = { $in: idsArray };
      } catch (err) {
        return res.status(400).json({
          message:
            "Invalid eventIds format. Must be a comma-separated list of valid ObjectIds.",
        });
      }
    }

    // Filter by postedBy email
    if (postedBy) {
      query.postedBy = postedBy;
    }

    const result = await EventsCollection.find(query).toArray();

    if (!result || result.length === 0) {
      return res.status(404).json({ message: "No events found." });
    }

    // Return single object if only one match
    if (result.length === 1) {
      return res.status(200).json(result[0]);
    }

    // Return full list
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ message: "Internal Server Error", error });
  }
});

// Get Total Count of Events
router.get("/EventsCount", async (req, res) => {
  try {
    const count = await EventsCollection.estimatedDocumentCount();
    res.status(200).json({ count });
  } catch (error) {
    console.error("Error counting upcoming events:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch upcoming event count", error });
  }
});

// GET: Daily Event post counts by postedBy email or all if none provided
router.get("/DailyEventsPosted", async (req, res) => {
  try {
    const { postedBy } = req.query;

    const matchStage = postedBy ? { postedBy } : {};

    const pipeline = [
      { $match: matchStage },
      {
        $addFields: {
          publishedAtDate: {
            $convert: {
              input: "$publishedAt",
              to: "date",
              onError: null,
              onNull: null,
            },
          },
        },
      },
      { $match: { publishedAtDate: { $ne: null } } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$publishedAtDate" },
          },
          DocumentCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          postedDate: "$_id",
          DocumentCount: 1,
        },
      },
    ];

    const results = await EventsCollection.aggregate(pipeline).toArray();

    if (results.length === 0) {
      return res.status(404).json({
        message: postedBy
          ? "No events found for the given postedBy."
          : "No events found.",
      });
    }

    res.status(200).json(results);
  } catch (error) {
    console.error("Error fetching daily event posts:", error);
    res.status(500).json({
      message: "An error occurred while fetching daily event posts.",
      error: error.message,
    });
  }
});

// GET: Fetch only Event IDs by postedBy email
router.get("/Ids", async (req, res) => {
  try {
    const { postedBy } = req.query;

    if (!postedBy) {
      return res
        .status(400)
        .json({ message: "postedBy query parameter is required." });
    }

    // Find events where postedBy matches the email, return only _id
    const events = await EventsCollection.find(
      { postedBy: postedBy },
      { projection: { _id: 1 } }
    ).toArray();

    if (!events.length) {
      return res
        .status(404)
        .json({ message: "No events found for the given postedBy." });
    }

    // Map to string IDs
    const ids = events.map((event) => event._id.toString());

    res.status(200).json(ids);
  } catch (error) {
    console.error("Error fetching event IDs:", error);
    res.status(500).json({ message: "Error fetching event IDs" });
  }
});

// GET: Fetch Event Summaries by ID(s)
router.get("/Summary", async (req, res) => {
  try {
    const { id, eventIds } = req.query;

    // Handle single event by id
    if (id) {
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid event ID." });
      }

      const event = await EventsCollection.findOne(
        { _id: new ObjectId(id) },
        { projection: { _id: 1, title: 1 } }
      );

      if (!event) {
        return res.status(404).json({ message: "Event not found." });
      }
      return res.status(200).json(event);
    }

    // Handle multiple eventIds (CSV string)
    if (eventIds) {
      let idsArray;
      try {
        idsArray = eventIds.split(",").map((id) => new ObjectId(id.trim()));
      } catch (err) {
        return res.status(400).json({ message: "Invalid eventIds format." });
      }

      const events = await EventsCollection.find(
        { _id: { $in: idsArray } },
        { projection: { _id: 1, title: 1 } }
      ).toArray();

      return res.status(200).json(events);
    }

    res
      .status(400)
      .json({ message: "Please provide either 'id' or 'eventIds'." });
  } catch (error) {
    console.error("Error fetching event summaries:", error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching event summaries." });
  }
});

// Apply for an Upcoming Event
router.post("/Apply/:id", async (req, res) => {
  const id = req.params.id;
  const applicantData = req.body;

  // Validate ID and applicantData
  if (!ObjectId.isValid(id)) {
    return res.status(400).send({ message: "Invalid event ID." });
  }

  if (!applicantData || typeof applicantData !== "object") {
    return res.status(400).send({ message: "Invalid applicant data." });
  }

  const query = { _id: new ObjectId(id) };
  const update = {
    $push: {
      ParticipantApplications: applicantData,
    },
  };

  try {
    const result = await EventsCollection.updateOne(query, update);

    if (result.modifiedCount > 0) {
      res.status(200).send({ message: "Application submitted successfully." });
    } else {
      res.status(404).send({ message: "Event not found or already updated." });
    }
  } catch (error) {
    console.error("Error applying for the event:", error);
    res.status(500).send({
      message: "An error occurred while applying for the event.",
      error,
    });
  }
});

// Post a new Upcoming Event
router.post("/", async (req, res) => {
  const eventData = req.body;

  if (!eventData || typeof eventData !== "object") {
    return res.status(400).send({ message: "Invalid event data provided." });
  }

  try {
    const result = await EventsCollection.insertOne(eventData);
    res.status(201).send({
      message: "Upcoming event created successfully.",
      insertedId: result.insertedId,
    });
  } catch (error) {
    console.error("Error inserting event:", error);
    res.status(500).send({ message: "Failed to create event.", error });
  }
});

// Update an Upcoming Event by ID
router.put("/:id", async (req, res) => {
  const id = req.params.id;
  const updateData = req.body;

  if (!ObjectId.isValid(id)) {
    return res.status(400).send({ message: "Invalid event ID." });
  }

  if (!updateData || typeof updateData !== "object") {
    return res.status(400).send({ message: "Invalid update data provided." });
  }

  const query = { _id: new ObjectId(id) };
  const update = { $set: updateData };

  try {
    const result = await EventsCollection.updateOne(query, update);

    if (result.modifiedCount > 0) {
      res.status(200).send({ message: "Event updated successfully." });
    } else {
      res.status(404).send({ message: "Event not found or no changes made." });
    }
  } catch (error) {
    console.error("Error updating the event:", error);
    res.status(500).send({ message: "Failed to update event.", error });
  }
});

// Update a Participant's State by applicantEmail
router.put("/:eventId/Participants/:applicantEmail", async (req, res) => {
  const { eventId, applicantEmail } = req.params;
  const { applicantState } = req.body;

  // Validate input
  if (!ObjectId.isValid(eventId)) {
    return res.status(400).send({ message: "Invalid event ID format." });
  }

  if (!applicantEmail || typeof applicantEmail !== "string") {
    return res
      .status(400)
      .send({ message: "Invalid or missing applicant email." });
  }

  if (!applicantState) {
    return res
      .status(400)
      .send({ message: "Missing applicant state to update." });
  }

  const query = {
    _id: new ObjectId(eventId),
    "ParticipantApplications.applicantEmail": applicantEmail,
  };

  const update = {
    $set: {
      "ParticipantApplications.$.applicantState": applicantState,
    },
  };

  try {
    const result = await EventsCollection.updateOne(query, update);

    if (result.modifiedCount > 0) {
      res
        .status(200)
        .send({ message: "Participant state updated successfully." });
    } else {
      res.status(404).send({
        message: "Event or participant not found, or no update needed.",
      });
    }
  } catch (error) {
    console.error("Error updating participant state:", error);
    res.status(500).send({ message: "Internal server error.", error });
  }
});

// Delete an Upcoming Event by ID
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.status(400).send({ message: "Invalid event ID format." });
  }

  const query = { _id: new ObjectId(id) };

  try {
    const result = await EventsCollection.deleteOne(query);

    if (result.deletedCount > 0) {
      res.status(200).send({ message: "Event deleted successfully!" });
    } else {
      res.status(404).send({ message: "Event not found or already deleted." });
    }
  } catch (error) {
    console.error("Error deleting the event:", error);
    res.status(500).send({ message: "Error deleting the event", error });
  }
});

// Delete a Participant by applicantEmail
router.delete("/:eventId/Participants/:applicantEmail", async (req, res) => {
  const { eventId, applicantEmail } = req.params;

  if (!ObjectId.isValid(eventId)) {
    return res.status(400).send({ message: "Invalid event ID format." });
  }

  if (!applicantEmail || typeof applicantEmail !== "string") {
    return res
      .status(400)
      .send({ message: "Invalid or missing applicant email." });
  }

  const query = { _id: new ObjectId(eventId) };
  const update = {
    $pull: {
      ParticipantApplications: { applicantEmail },
    },
  };

  try {
    const result = await EventsCollection.updateOne(query, update);

    if (result.modifiedCount > 0) {
      res.status(200).send({ message: "Participant deleted successfully!" });
    } else {
      res.status(404).send({ message: "Event or participant not found." });
    }
  } catch (error) {
    console.error("Error deleting participant:", error);
    res.status(500).send({ message: "Error deleting participant", error });
  }
});

module.exports = router;
