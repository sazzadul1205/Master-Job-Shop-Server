const express = require("express");
const router = express.Router();
const { client } = require("../../config/db");
const { ObjectId } = require("mongodb");

const MentorMessagesCollection = client
  .db("Master-Job-Shop")
  .collection("Mentor_Messages");

// GET all Mentor Messages
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

    const messages = await MentorMessagesCollection.find(query).toArray();
    res.status(200).json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// GET: Mentor Messages Status by sent date (total count only)
router.get("/Status", async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ message: "email is required" });
    }

    // Find all mentor message documents matching the email
    const messages = await MentorMessagesCollection.find({
      email: { $regex: new RegExp(`^${email}$`, "i") },
    }).toArray();

    // Flatten all recipients into a single array with the sentAt date
    const allRecipients = [];
    messages.forEach((doc) => {
      if (doc.recipients && Array.isArray(doc.recipients)) {
        doc.recipients.forEach((recipient) => {
          allRecipients.push({
            to_email: recipient.to_email,
            sentAt: doc.sentAt,
          });
        });
      }
    });

    // Helper function to format date as DD-MMM-YYYY
    const formatDate = (isoString) => {
      const dateObj = new Date(isoString);
      const day = String(dateObj.getDate()).padStart(2, "0");
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const month = monthNames[dateObj.getMonth()];
      const year = dateObj.getFullYear();
      return `${day}-${month}-${year}`;
    };

    // Group by formatted date
    const grouped = {};
    allRecipients.forEach((item) => {
      const date = formatDate(item.sentAt);
      grouped[date] = (grouped[date] || 0) + 1;
    });

    const result = Object.keys(grouped)
      .sort((a, b) => new Date(a) - new Date(b))
      .map((date) => ({
        date,
        count: grouped[date],
      }));

    res.json(result);
  } catch (error) {
    console.error("Error fetching mentor Messages application status:", error);
    res.status(500).json({ message: "Server error", error: error.message });
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
