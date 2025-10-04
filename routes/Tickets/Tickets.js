const express = require("express");
const router = express.Router();
const { client } = require("../../config/db");
const { ObjectId } = require("mongodb");

const TicketsCollection = client.db("Master-Job-Shop").collection("Tickets");

// GET - Fetch all Tickets
router.get("/", async (req, res) => {
  try {
    const tickets = await TicketsCollection.find().toArray();
    res.send(tickets);
  } catch (error) {
    console.error("Error fetching tickets:", error);
    res.status(500).send({ message: "Failed to fetch tickets", error });
  }
});

// GET - Fetch a specific Ticket
router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const ticket = await TicketsCollection.findOne({ _id: new ObjectId(id) });

    if (!ticket) {
      return res.status(404).send({ message: "Ticket not found" });
    }

    res.send(ticket);
  } catch (error) {
    console.error("Error fetching ticket:", error);
    res.status(500).send({ message: "Failed to fetch ticket", error });
  }
});

// POST - Create a new Ticket
router.post("/", async (req, res) => {
  try {
    const ticket = req.body;
    const result = await TicketsCollection.insertOne(ticket);
    res.status(201).send({ message: "Ticket created successfully", result });
  } catch (error) {
    console.error("Error creating ticket:", error);
    res.status(500).send({ message: "Failed to create ticket", error });
  }
});

// PATCH - Update a Ticket
router.patch("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const updates = req.body;

    const result = await TicketsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updates }
    );

    if (result.matchedCount === 0) {
      return res.status(404).send({ message: "Ticket not found" });
    }

    res.send({ message: "Ticket updated successfully", result });
  } catch (error) {
    console.error("Error updating ticket:", error);
    res.status(500).send({ message: "Failed to update ticket", error });
  }
});

// DELETE - Delete a Ticket
router.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const result = await TicketsCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).send({ message: "Ticket not found" });
    }

    res.send({ message: "Ticket deleted successfully", result });
  } catch (error) {
    console.error("Error deleting ticket:", error);
    res.status(500).send({ message: "Failed to delete ticket", error });
  }
});

module.exports = router;
