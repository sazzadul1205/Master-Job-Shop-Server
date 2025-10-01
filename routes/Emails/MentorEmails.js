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

// GET: Mentor Email Status by sent date
router.get("/Status", async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ message: "email is required" });
    }

    // Find all mentor email documents matching the email
    const emails = await MentorEmailCollection.find({
      email: { $regex: new RegExp(`^${email}$`, "i") },
    }).toArray();

    // Flatten all recipients into a single array with the sentAt date
    const allRecipients = [];
    emails.forEach((doc) => {
      if (doc.recipients && Array.isArray(doc.recipients)) {
        doc.recipients.forEach((recipient) => {
          allRecipients.push({
            to_email: recipient.to_email,
            sentAt: doc.sentAt,
          });
        });
      }
    });

    // Helper to format date as DD-MMM-YYYY
    const formatDate = (dateStr) => {
      const date = new Date(dateStr);
      const day = String(date.getDate()).padStart(2, "0");
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
      const month = monthNames[date.getMonth()];
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    };

    // Group by date
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
    console.error("Error fetching mentor Emails application status:", error);
    res.status(500).json({ message: "Server error", error: error.message });
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
