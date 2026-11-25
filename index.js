import express from "express";
import { MongoClient } from "mongodb";
import "dotenv/config";
import cors from "cors";
import { verifyToken } from "./middlewares/verifyToken.js";
import { verifyRole } from "./middlewares/verifyRole.js";

const app = express();

const client = new MongoClient(process.env.MONGODB_URI);

app.use(
    cors({
        origin: process.env.CLIENT_URL,
        credentials: true
    })
);
app.use(express.json());

export async function connectToMongoDB() {
  await client.connect();
  console.log("You successfully connected to MongoDB!");
  return client;
}

const mongoClient = await connectToMongoDB();

const db = mongoClient.db("pizzahub");

const userCollection = db.collection("user");

const verifyAdmin = verifyRole(userCollection, "admin");

const verifyVendor = verifyRole(userCollection, "vendor");

const verifyCustomer = verifyRole(userCollection, "customer");

app.get(
  "/test-admin",
  verifyToken,
  verifyAdmin,
  (req, res) => {
    res.status(200).json({
      success: true,
      message: "Admin access granted.",
      role: req.userRole,
    });
  }
);

app.get(
  "/test-vendor",
  verifyToken,
  verifyVendor,
  (req, res) => {
    res.status(200).json({
      success: true,
      message: "Vendor access granted.",
      role: req.userRole,
    });
  }
);

app.get(
  "/test-customer",
  verifyToken,
  verifyCustomer,
  (req, res) => {
    res.status(200).json({
      success: true,
      message: "Customer access granted.",
      role: req.userRole,
    });
  }
);

app.get("/", (req, res) => {
  res.send("PizzaHub Server is running!");
});

app.get("/test-protected", verifyToken, (req, res) => {
  res.status(200).json({
    success: true,
    message: "JWT verification successful!",
    userId: req.user.sub,
  });
});

const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});