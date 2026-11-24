import express from "express";
import { MongoClient } from "mongodb";
import "dotenv/config";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./auth.js";

const app = express();

const client = new MongoClient(process.env.MONGODB_URI);

app.use(
    cors({
        origin: process.env.CLIENT_URL,
        credentials: true
    })
);
app.all("/api/auth/*splat", toNodeHandler(auth));
app.use(express.json());

export async function connectToMongoDB() {
  await client.connect();
  console.log("You successfully connected to MongoDB!");
  return client;
}

const mongoClient = await connectToMongoDB();

const db = mongoClient.db("pizzahub");

app.get("/", (req, res) => {
  res.send("PizzaHub Server is running!");
});

const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});