const express = require("express");
const router = express.Router();
const { client } = require("../../config/db");
const { ObjectId } = require("mongodb");

// Collection for Employers
const EmployersCollection = client
  .db("Master-Job-Shop")
  .collection("Employers");

// GET - Fetch all employers or a single one by _id or email
router.get("/", async (req, res) => {
  try {
    const { _id, email } = req.query;

    // If a unique identifier is provided, fetch one document
    if (_id) {
      const employer = await EmployersCollection.findOne({
        _id: new ObjectId(_id),
      });
      if (!employer) {
        return res.status(404).json({ message: "Employer not found" });
      }
      return res.status(200).json(employer);
    }

    if (email) {
      const employer = await EmployersCollection.findOne({ email });
      if (!employer) {
        return res.status(404).json({ message: "Employer not found" });
      }
      return res.status(200).json(employer);
    }

    // If no unique identifier, return all documents
    const employers = await EmployersCollection.find({}).toArray();
    res.status(200).json(employers);
  } catch (error) {
    console.error("Error fetching employers:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// POST - Add a new employer
router.post("/", async (req, res) => {
  try {
    const employerData = req.body;

    if (!employerData?.contactEmail) {
      return res.status(400).json({ message: "Email is required" });
    }

    employerData.createdAt = new Date();

    const result = await EmployersCollection.insertOne(employerData);
    res.status(201).json(result);
  } catch (error) {
    console.error("Error adding employer:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// DELETE - Remove an employer by ID
router.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    const result = await EmployersCollection.deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Employer not found" });
    }

    res.status(200).json({ message: "Employer deleted successfully" });
  } catch (error) {
    console.error("Error deleting employer:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
