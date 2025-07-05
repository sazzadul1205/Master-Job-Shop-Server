const express = require("express");
const router = express.Router();
const { client } = require("../../config/db");
const { ObjectId } = require("mongodb");

// Collection for Users
const UsersCollection = client.db("Master-Job-Shop").collection("Users");

// Get All Users or a Specific User by Email
router.get("/", async (req, res) => {
  try {
    const { email } = req.query;

    if (email) {
      const user = await UsersCollection.findOne({ email });

      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }

      return res.status(200).json(user);
    }

    const users = await UsersCollection.find().toArray();
    res.status(200).json(users);
  } catch (error) {
    console.error("GET /users error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

// Get Total Users Count
router.get("/UserCount", async (req, res) => {
  try {
    const count = await UsersCollection.countDocuments();
    res.status(200).json({ count });
  } catch (error) {
    console.error("GET /Users/count error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

// Check if email exists (GET API)
router.get("/CheckEmail", async (req, res) => {
  try {
    const email = req.query.email;

    if (!email) {
      return res.status(400).json({ message: "Email parameter is required." });
    }

    const existingUser = await UsersCollection.findOne({ email });
    res.status(200).json({
      message: existingUser
        ? "Email is already in use."
        : "Email is available.",
      exists: !!existingUser,
    });
  } catch (error) {
    console.error("Error checking email:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

// Update User by ID (PUT)
router.put("/:id", async (req, res) => {
  const id = req.params.id; // Get the user ID from the URL params
  const updatedUser = req.body; // Get the updated user data from the request body

  try {
    // Create a filter to find the user by ID
    const filter = { _id: new ObjectId(id) };

    // Define the update operation (e.g., update the role and company code)
    const updateDoc = {
      $set: {
        role: updatedUser.role,
        companyCode: updatedUser.companyCode,
      },
    };

    // Update the user in the database
    const result = await UsersCollection.updateOne(filter, updateDoc);

    // If no documents were matched, the user doesn't exist
    if (result.matchedCount === 0) {
      return res.status(404).send({ message: "User not found" });
    }

    // Send success response
    res.send({ message: "User updated successfully", result });
  } catch (error) {
    // Send error response in case of failure
    res.status(500).send({ message: "Failed to update user", error });
  }
});

// Create a New User
router.post("/", async (req, res) => {
  try {
    const newUser = req.body;

    if (!newUser?.email || !newUser?.name) {
      return res.status(400).json({ message: "Name and email are required." });
    }

    const existingUser = await UsersCollection.findOne({
      email: newUser.email,
    });

    if (existingUser) {
      return res
        .status(409)
        .json({ message: "User with this email already exists." });
    }

    const result = await UsersCollection.insertOne(newUser);
    res.status(201).json({
      message: "User created successfully.",
      userId: result.insertedId,
    });
  } catch (error) {
    console.error("POST /Users error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

module.exports = router;
