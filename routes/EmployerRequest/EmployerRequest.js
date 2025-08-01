const express = require("express");
const router = express.Router();
const { client } = require("../../config/db");
const { ObjectId } = require("mongodb");

const EmployerRequestCollection = client
  .db("Master-Job-Shop")
  .collection("EmployerRequest");

// GET - Fetch all employer requests
router.get("/", async (req, res) => {
  try {
    const requests = await EmployerRequestCollection.find().toArray();
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
