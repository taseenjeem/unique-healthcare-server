// Import required modules
const { MongoClient, ServerApiVersion } = require("mongodb");
const express = require("express");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
const cors = require("cors");

// Load environment variables from .env file
dotenv.config();

// Create an Express application
const app = express();

// Middleware to enable CORS
app.use(cors());

// Middleware to parse JSON requests
app.use(express.json());

// MongoDB DataBase URI
const uri = process.env.DB_URI;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect to MongoDB
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Successfully connected to MongoDB!");

    // Database of users
    const usersDatabase = client
      .db("pathology-database")
      .collection("user-credentials");

    // Add new customer info with manually
    app.post("/add-new-customer-info", async (req, res) => {
      const { name, email, country, phone, password, account_creation_time } =
        req.body;

      try {
        // Check if the user already exists
        const isOldUser = await usersDatabase.findOne({ user_email: email });

        if (!isOldUser) {
          // Hash the password before storing it
          const hashedPassword = await bcrypt.hash(password, 10);

          // Create a new user entry
          const newUser = await usersDatabase.insertOne({
            full_name: name,
            user_email: email,
            password: hashedPassword,
            country: country,
            phone_number: phone,
            registration_type: "Manually",
            account_creation_time: account_creation_time,
          });

          res
            .status(201)
            .json({ message: "User created successfully.", user: newUser });
        } else {
          // If user already exists, return a conflict status
          return res.status(409).json({ message: "User already exists." });
        }
      } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ message: "Something went wrong." });
      }
    });

    // Add new customer info with pop-up
    app.post("/add-new-customer-info-with-pop-up", async (req, res) => {
      const { name, email, country, phone, password, account_creation_time } =
        req.body;

      try {
        // Check if the user already exists
        const isOldUser = await usersDatabase.findOne({ user_email: email });

        if (!isOldUser) {
          // Create a new user entry
          const newUser = await usersDatabase.insertOne({
            full_name: name,
            user_email: email,
            password: password,
            country: country,
            phone_number: phone,
            registration_type: "Google",
            account_creation_time: account_creation_time,
          });

          res
            .status(201)
            .json({ message: "User created successfully.", user: newUser });
        } else {
          // If user already exists, return a conflict status
          return res.status(409).json({ message: "User already exists." });
        }
      } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ message: "Something went wrong." });
      }
    });
  } catch (error) {
    console.error("Database connection error:", error);
  }
}

run().catch(console.error);

// Define a route for the homepage
app.get("/", (req, res) => {
  res.send("Welcome to the Pathology Database!");
});

// Start the Express server
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
