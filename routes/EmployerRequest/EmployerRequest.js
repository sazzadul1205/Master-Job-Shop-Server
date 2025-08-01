const express = require("express");
const router = express.Router();
const { client } = require("../../config/db");
const { ObjectId } = require("mongodb");

const EmployerRequestCollection = client
  .db("Master-Job-Shop")
  .collection("EmployerRequest");

// GET - Fetch employer requests with optional filters
router.get("/", async (req, res) => {
  try {
    const { _id, userId, userEmail, status, employerType } = req.query;

    // Build dynamic query object
    const query = {};

    if (_id) {
      // Validate _id as ObjectId
      if (ObjectId.isValid(_id)) {
        query._id = new ObjectId(_id);
      } else {
        return res.status(400).json({ message: "Invalid _id format" });
      }
    }

    if (userId) {
      if (ObjectId.isValid(userId)) {
        query.userId = userId; // assuming userId stored as string
      } else {
        return res.status(400).json({ message: "Invalid userId format" });
      }
    }

    if (userEmail) {
      query.userEmail = userEmail;
    }

    if (status) {
      query.status = status;
    }

    if (employerType) {
      query.employerType = employerType;
    }

    const requests = await EmployerRequestCollection.find(query).toArray();

    res.status(200).json(requests);
  } catch (error) {
    console.error("Error fetching employer requests:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// POST - Submit a new employer request
router.post("/", async (req, res) => {
  try {
    const requestData = req.body;

    if (!requestData || !requestData.contactEmail || !requestData.contactName) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    requestData.status = "pending";
    requestData.createdAt = new Date();

    const result = await EmployerRequestCollection.insertOne(requestData);

    res.status(200).json({
      message: "Employer request submitted successfully",
      insertedId: result.insertedId,
    });
  } catch (error) {
    console.error("Error submitting employer request:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
