const express = require("express");
const router = express.Router();
const { client } = require("../../config/db");
const { ObjectId } = require("mongodb");

const BugReportCollection = client
  .db("Master-Job-Shop")
  .collection("BugReport");

// GET - Fetch all BugReport
router.get("/", async (req, res) => {
  try {
    const report = await BugReportCollection.find()
      .sort({ date: -1 })
      .toArray();

    res.status(200).json({
      success: true,
      count: report.length,
      data: report,
    });
  } catch (error) {
    console.error("Error fetching Improvement Report:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch improvement report.",
      error: error.message,
    });
  }
});

// GET - Fetch a specific Ticket
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid ID format." });
    }

    const report = await BugReportCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!report) {
      return res
        .status(404)
        .json({ success: false, message: "Report not found." });
    }

    res.status(200).json({ success: true, data: report });
  } catch (error) {
    console.error("Error fetching report:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch the report.",
      error: error.message,
    });
  }
});

// POST - Create a new Bug Report
router.post("/", async (req, res) => {
  try {
    const { userEmail, errorType, errorDescription, from, image, date } =
      req.body;

    // Validate required fields
    if (!userEmail || !errorType || !errorDescription) {
      return res.status(400).json({
        message:
          "Missing required fields: userEmail, errorType, or errorDescription",
      });
    }

    // Construct ticket object
    const ticketData = {
      userEmail,
      errorType,
      errorDescription,
      from: from || "Mentor",
      image: image || null,
      type: "Bug Report", // categorize type
      date: date ? new Date(date) : new Date(),
      status: "Open",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Insert into DB
    const result = await BugReportCollection.insertOne(ticketData);

    return res.status(201).json({
      message: "Bug report submitted successfully",
      reportId: result.insertedId,
    });
  } catch (error) {
    console.error("Error creating bug report:", error);
    return res.status(500).json({
      message: "Failed to submit bug report",
      error: error.message,
    });
  }
});

// PATCH - Update a Ticket
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid ID format." });
    }

    const updates = req.body;
    const report = await BugReportCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updates }
    );

    if (report.matchedCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Suggestion not found." });
    }

    res.status(200).json({
      success: true,
      message: "Improvement suggestion updated successfully.",
      data: report,
    });
  } catch (error) {
    console.error("Error Updating Suggestion:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update improvement suggestion.",
      error: error.message,
    });
  }
});

// DELETE - Delete a Ticket
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid ID format." });
    }

    const report = await BugReportCollection.deleteOne({
      _id: new ObjectId(id),
    });

    if (report.deletedCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Suggestion not found." });
    }

    res.status(200).json({
      success: true,
      message: "Improvement Suggestion Deleted successfully.",
      data: report,
    });
  } catch (error) {
    console.error("Error Deleting suggestion:", error);
    res.status(500).json({
      success: false,
      message: "Failed to Delete improvement suggestion.",
      error: error.message,
    });
  }
});

module.exports = router;
