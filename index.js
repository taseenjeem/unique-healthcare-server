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

    // Database of doctors
    const doctorsDatabase = client
      .db("pathology-database")
      .collection("doctors");

    // Database of appointments
    const appointmentDatabase = client
      .db("pathology-database")
      .collection("appointments");

    // Database of testimonials
    const testimonialDatabase = client
      .db("pathology-database")
      .collection("testimonials");

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

    // Getting all doctors info
    app.get("/all-doctors-info", async (req, res) => {
      const result = await doctorsDatabase.find({}).toArray();
      res.send(result);
    });

    // Getting all doctors info by query
    app.get("/all-doctors-info-by-query", async (req, res) => {
      const result = await doctorsDatabase.find(req.query).toArray();
      res.send(result);
    });

    // Add new appointments
    app.post("/add-new-appointment", async (req, res) => {
      const data = req.body;

      try {
        const incompleteAppointment = await appointmentDatabase.findOne({
          patient_email: data.patient_email,
          appointment_status: "pending",
        });

        if (!incompleteAppointment) {
          const newAppointment = await appointmentDatabase.insertOne(data);

          res.status(201).json({
            message: "Appointment booked successfully!",
            appointment_details: newAppointment,
          });
        } else {
          return res
            .status(409)
            .json({ message: "You still have an appointment in progress!" });
        }
      } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ message: "Something went wrong." });
      }
    });

    // Getting all testimonials
    app.get("/all-testimonials", async (req, res) => {
      const result = await testimonialDatabase.find({}).toArray();
      res.send(result);
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
