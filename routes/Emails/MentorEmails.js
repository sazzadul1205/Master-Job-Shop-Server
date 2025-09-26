const express = require("express");
const router = express.Router();
const { client } = require("../../config/db");
const { ObjectId } = require("mongodb");

const MentorEmailCollection = client
  .db("Master-Job-Shop")
  .collection("Mentor_Emails");

// GET all Mentor Emails
router.get("/", async (req, res) => {
  try {
    const { type, email, recipient_email } = req.query;
    const query = {};

    if (type) query.type = type;

    if (email) {
      query.email = { $regex: new RegExp(`^${email}$`, "i") };
    }

    if (recipient_email) {
      query["recipients.to_email"] = {
        $regex: new RegExp(`^${recipient_email}$`, "i"),
      };
    }

    const emails = await MentorEmailCollection.find(query).toArray();
    res.status(200).json(emails);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch mentor emails" });
  }
});

// GET single mentor email by _id
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const email = await MentorEmailCollection.findOne({ _id: ObjectId(id) });
    if (!email) {
      return res.status(404).json({ error: "Email not found" });
    }
    res.status(200).json(email);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch mentor email" });
  }
});

// POST a new mentor email
router.post("/", async (req, res) => {
  const payload = req.body;

  if (!payload.name || !payload.email) {
    return res.status(400).json({ error: "Name and Email are required" });
  }

  try {
    // Insert everything in the request body
    const result = await MentorEmailCollection.insertOne(payload);

    res.status(201).json({
      message: "Mentor email logged",
      id: result.insertedId,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to log mentor email" });
  }
});

// DELETE a mentor email by _id
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await MentorEmailCollection.deleteOne({ _id: ObjectId(id) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Email not found" });
    }
    res.status(200).json({ message: "Mentor email deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete mentor email" });
  }
});

module.exports = router;
