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

// Add Document to User's documents array
router.put("/AddDocument/:id", async (req, res) => {
  const id = req.params.id;
  const newDoc = req.body;

  if (!newDoc.name) {
    return res.status(400).send({ message: "Document name is required" });
  }

  try {
    const filter = { _id: new ObjectId(id) };

    // First, check if a document with the same name already exists in the user's documents array
    const user = await UsersCollection.findOne(filter);

    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    if (user.documents && Array.isArray(user.documents)) {
      const nameExists = user.documents.some((doc) => doc.name === newDoc.name);
      if (nameExists) {
        return res
          .status(400)
          .send({ message: "Document name already exists" });
      }
    }

    // Add the new document to the documents array (create array if it doesn't exist)
    const updateResult = await UsersCollection.updateOne(
      filter,
      { $push: { documents: newDoc } },
      { upsert: false } // don't create new user if not found
    );

    if (updateResult.matchedCount === 0) {
      return res.status(404).send({ message: "User not found" });
    }

    res.send({ message: "Document added successfully", updateResult });
  } catch (error) {
    res.status(500).send({ message: "Failed to add document", error });
  }
});

// Update User by ID (PUT)
router.put("/:id", async (req, res) => {
  const id = req.params.id;
  const updatedUser = req.body;

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

// PUT /Users/ToggleStar/:id
router.put("/ToggleStar/:id", async (req, res) => {
  const userId = req.params.id;
  const { name } = req.body;

  if (!name) {
    return res.status(400).send({ message: "Document name is required" });
  }

  try {
    const user = await UsersCollection.findOne({ _id: new ObjectId(userId) });
    if (!user) return res.status(404).send({ message: "User not found" });

    // Count how many are currently starred
    const starredDocs = user.documents?.filter((doc) => doc.starred) || [];

    // Find target document
    const targetDoc = user.documents?.find((doc) => doc.name === name);
    if (!targetDoc)
      return res.status(404).send({ message: "Document not found" });

    // Toggle logic
    let newStarredValue = !targetDoc.starred;

    // Enforce max 3 starred documents
    if (newStarredValue && starredDocs.length >= 3) {
      return res
        .status(400)
        .send({ message: "Cannot star more than 3 documents" });
    }

    // Update only the matched document's starred field
    const updateResult = await UsersCollection.updateOne(
      { _id: new ObjectId(userId), "documents.name": name },
      { $set: { "documents.$.starred": newStarredValue } }
    );

    if (updateResult.matchedCount === 0) {
      return res
        .status(404)
        .send({ message: "Document not found or user not found" });
    }

    res.status(200).send({
      message: `Document '${name}' starred status updated to ${newStarredValue}`,
      starred: newStarredValue,
    });
  } catch (error) {
    console.error("Error toggling starred:", error);
    res.status(500).send({ message: "Internal server error", error });
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

// DELETE /DeleteDocument/:id
router.delete("/DeleteDocument/:id", async (req, res) => {
  const id = req.params.id;
  const { name } = req.body;

  if (!name) {
    return res.status(400).send({ message: "Document name is required" });
  }

  try {
    const filter = { _id: new ObjectId(id) };
    const update = { $pull: { documents: { name } } };

    const result = await UsersCollection.updateOne(filter, update);

    if (result.modifiedCount === 0) {
      return res
        .status(404)
        .send({ message: "Document not found or already deleted" });
    }

    res.send({ message: "Document deleted successfully", result });
  } catch (error) {
    res.status(500).send({ message: "Failed to delete document", error });
  }
});

module.exports = router;
