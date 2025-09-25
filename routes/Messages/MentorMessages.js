const express = require("express");
const router = express.Router();
const { client } = require("../../config/db");
const { ObjectId } = require("mongodb");

const MentorMessagesCollection = client
  .db("Master-Job-Shop")
  .collection("Mentor_Messages");

// GET all messages
router.get("/", async (req, res) => {
  try {
    const messages = await MentorMessagesCollection.find({}).toArray();
    res.status(200).json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// GET message by ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const message = await MentorMessagesCollection.findOne({
      _id: new ObjectId(id),
    });
    if (!message) return res.status(404).json({ error: "Message not found" });
    res.status(200).json(message);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch message" });
  }
});

// POST a new mentor message
router.post("/", async (req, res) => {
  const payload = req.body;

  // Require only name and email
  if (!payload.name || !payload.email) {
    return res.status(400).json({ error: "Name and Email are required" });
  }

  try {
    // Insert entire payload as-is
    const result = await MentorMessagesCollection.insertOne(payload);

    res.status(201).json({
      message: "Mentor message logged",
      id: result.insertedId,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to log mentor message" });
  }
});

// PUT / update a message by ID
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  try {
    const result = await MentorMessagesCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    if (result.matchedCount === 0)
      return res.status(404).json({ error: "Message not found" });
    res.status(200).json({ message: "Message updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update message" });
  }
});

// DELETE a message by ID
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await MentorMessagesCollection.deleteOne({
      _id: new ObjectId(id),
    });
    if (result.deletedCount === 0)
      return res.status(404).json({ error: "Message not found" });
    res.status(200).json({ message: "Message deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete message" });
  }
});

module.exports = router;
