const express = require("express");
const router = express.Router();
const { client } = require("../../config/db");
const { ObjectId } = require("mongodb");

const EventsCollection = client
  .db("Master-Job-Shop")
  .collection("Upcoming-Events");

// Get Events
router.get("/", async (req, res) => {
  try {
    const { id, postedBy } = req.query;
    let query = {};

    // If ID is provided, validate and search by ObjectId
    if (id) {
      if (!ObjectId.isValid(id)) {
        return res.status(400).send({ message: "Invalid ID format." });
      }
      query._id = new ObjectId(id);
    }

    // If postedBy (email) is provided
    if (postedBy) {
      query.postedBy = postedBy;
    }

    const result = await EventsCollection.find(query).toArray();

    if (result.length === 0) {
      return res.status(404).send({ message: "No matching event(s) found." });
    }

    // If only one document is found, send it as an object
    if (result.length === 1) {
      res.send(result[0]);
    } else {
      res.send(result);
    }
  } catch (error) {
    console.error("Error fetching upcoming events:", error);
    res.status(500).send({ message: "Internal Server Error", error });
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
