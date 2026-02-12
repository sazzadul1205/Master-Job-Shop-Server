// /config/db.js
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();

// MongoDB connection URI using environment variables for user and password
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@master-job-shop.46woq.mongodb.net/?retryWrites=true&w=majority&appName=Master-Job-Shop`;

// Create a new MongoClient instance with the provided URI and server API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Function to create a delay
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// Function to connect to the MongoDB database with retry logic
const connectDB = async (retries = 100, delayTime = 5000) => {
  while (retries > 0) {
    try {
      // Attempt to connect to the MongoDB server
      await client.connect();
      await client.db("admin").command({ ping: 1 });

      // If the connection is successful, log a success message
      console.log("Successfully connected to MongoDB!");

      return;
    } catch (err) {
      // Log the error message and retry
      console.error("MongoDB connection failed:", err.message);
      retries--;

      // If retries are left, wait for the specified delay before retrying
      if (retries > 0) {
        console.log(
          `🔁 Retrying in ${
            delayTime / 1000
          } seconds... (${retries} retries left)`
        );

        // Wait for the specified delay before retrying
        await delay(delayTime);
      } else {
        // If no retries are left, log a final error message and exit the process
        console.error(
          "All retries exhausted. MongoDB connection failed permanently."
        );
        console.error("Please check your MongoDB connection settings.");
        console.error("Exiting the process...");
        process.exit(1);
      }
    }
  }
};

// Export the client and connectDB function for use in other modules
module.exports = { client, connectDB };
