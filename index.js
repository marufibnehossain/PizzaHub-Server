import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import "dotenv/config";
import cors from "cors";
import { verifyToken } from "./middlewares/verifyToken.js";
import { verifyRole } from "./middlewares/verifyRole.js";
import { MENU_STATUS } from "./constants/menu.js";
import { validateMenuItem } from "./utils/validateMenuItem.js";
import { SUBSCRIPTION_PLANS, FREE_MENU_ITEM_LIMIT } from "./constants/subscription.js";
import { getEffectiveSubscription } from "./utils/getEffectiveSubscription.js";

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

const menuItemsCollection = db.collection("menuItems");

const verifyAdmin = verifyRole(userCollection, "admin");

const verifyVendor = verifyRole(userCollection, "vendor");

const verifyCustomer = verifyRole(userCollection, "customer");

app.get("/test-admin", verifyToken, verifyAdmin, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Admin access granted.",
    role: req.userRole,
  });
});

app.get("/test-vendor", verifyToken, verifyVendor, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Vendor access granted.",
    role: req.userRole,
  });
});

app.get("/test-customer", verifyToken, verifyCustomer, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Customer access granted.",
    role: req.userRole,
  });
});

app.post("/menu-items", verifyToken, verifyVendor, async (req, res) => {
  try {
    const validation = validateMenuItem(req.body);

    if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: validation.message,
        });
    }

    const vendorId = req.user.sub;

    const vendor = await userCollection.findOne({
      _id: ObjectId.isValid(vendorId) ? new ObjectId(vendorId) : vendorId,
    });

    if (!vendor || vendor.role !== "vendor" || vendor.isBlocked === true) {
      return res.status(403).json({
        success: false,
        message: "Vendor access denied.",
      });
    }

    const effectivePlan = getEffectiveSubscription(vendor);

    if (effectivePlan === SUBSCRIPTION_PLANS.FREE) {

      const itemCount = await menuItemsCollection.countDocuments({
        vendorId: vendorId,
        status: {
          $in: [
              MENU_STATUS.PENDING,
              MENU_STATUS.APPROVED,
          ],
        },
      });
      
        if (itemCount >= FREE_MENU_ITEM_LIMIT) {
          return res.status(403).json({
            success: false,
            message: "Free plan limit reached. Upgrade to Premium to add more menu items.",
          });
        }
    }

    const menuItem = {
      ...validation.data,
      vendorId: vendorId,
      status: MENU_STATUS.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
      
    const result = await menuItemsCollection.insertOne(menuItem);

    return res.status(201).json({
      success: true,
      message: "Menu item submitted for approval.",
      data: {
          ...menuItem,
          _id: result.insertedId,
      },
    });

  } catch (error) {
        console.error("Create menu item error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to create menu item.",
      });
    }
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