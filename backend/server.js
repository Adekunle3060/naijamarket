import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import nodemailer from "nodemailer";
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const app = express();

// ---------------- CONFIG ----------------
const FRONTEND_URLS = [process.env.FRONTEND_URL]; // Set in Render.com or .env
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_PUBLIC_KEY = process.env.PAYSTACK_PUBLIC_KEY;

// ---------------- MONGODB ----------------
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));

// ---------------- ORDER SCHEMA ----------------
const orderSchema = new mongoose.Schema({
  email: String,
  customer: Object,
  cart: Array,
  totalAmount: Number,
  reference: String,
  paid: Boolean,
  date: { type: Date, default: Date.now }
});
const Order = mongoose.model("Order", orderSchema);

// ---------------- MIDDLEWARE ----------------
app.use(bodyParser.json());

// ✅ CORS middleware
app.use(cors({
  origin: function(origin, callback) {
    // allow requests with no origin (like Postman)
    if (!origin) return callback(null, true);

    if (FRONTEND_URLS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin} is not allowed`));
    }
  },
  methods: ["GET", "POST", "PUT"],
  credentials: true
}));

// ---------------- ROOT ----------------
app.get("/", (req, res) => res.send("Backend running..."));

// ---------------- INITIATE PAYMENT ----------------
app.post("/api/checkout", async (req, res) => {
  const { cart, totalAmount, customer, email } = req.body;
  const userEmail = email || customer?.email;

  if (!cart || !totalAmount || !userEmail) {
    return res.status(400).json({ status: false, message: "Missing required fields" });
  }

  try {
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: userEmail,
        amount: totalAmount * 100, // Paystack expects kobo
        currency: "NGN",
        metadata: { cart, customer }
      })
    });

    const data = await response.json();
    console.log("Paystack init response:", data);

    if (data.status && data.data?.reference) {
      return res.json({
        status: true,
        data: {
          reference: data.data.reference,
          authorization_url: data.data.authorization_url,
          publicKey: PAYSTACK_PUBLIC_KEY
        }
      });
    } else {
      console.error("Paystack Init Error:", data);
      return res.json({ status: false, message: "Failed to initialize payment" });
    }
  } catch (err) {
    console.error("Server checkout error:", err);
    return res.status(500).json({ status: false, message: "Server error" });
  }
});

// ---------------- VERIFY PAYMENT ----------------
app.get("/api/verify-payment", async (req, res) => {
  const reference = req.query.reference;
  if (!reference) return res.status(400).json({ status: false, message: "Payment reference missing" });

  try {
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json"
      }
    });

    const data = await response.json();
    console.log("Paystack verify response:", data);

    if (data.status && data.data.status === "success") {
      const email = data.data.customer.email;
      const amount = data.data.amount / 100;
      const items = data.data.metadata.cart;
      const customer = data.data.metadata.customer;

      // Save order
      await Order.create({ email, customer, cart: items, totalAmount: amount, reference, paid: true });

      // Send confirmation email
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
      });

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Order Confirmed - Naija Market",
        html: `
          <h3>Thank you for your order!</h3>
          <p>Customer: ${customer.firstName} ${customer.lastName}</p>
          <p>Items:</p>
          <ul>${items.map(i => `<li>${i.name} x ${i.quantity}</li>`).join("")}</ul>
          <p>Total Paid: ₦${amount.toLocaleString()}</p>
          <p>Delivery Address: ${customer.address}</p>
        `
      });

      return res.json({ status: true, message: "Payment verified and order saved" });
    } else {
      return res.status(400).json({ status: false, message: "Payment verification failed" });
    }
  } catch (err) {
    console.error("Verification error:", err);
    return res.status(500).json({ status: false, message: "Error verifying payment" });
  }
});

// ---------------- START SERVER ----------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
