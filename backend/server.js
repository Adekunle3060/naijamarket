import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import nodemailer from "nodemailer";
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const app = express();

// ---------------------------------------
// CONFIGURATION
// ---------------------------------------
const FRONTEND_URLS = [
  process.env.FRONTEND_URL || "https://naijamarket-three.vercel.app"
];

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_PUBLIC_KEY = process.env.PAYSTACK_PUBLIC_KEY;

// ---------------------------------------
// MONGODB CONNECTION
// ---------------------------------------
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));

// ---------------------------------------
// ORDER SCHEMA
// ---------------------------------------
const orderSchema = new mongoose.Schema({
  email: String,
  customer: Object, // full customer details
  cart: Array,
  totalAmount: Number,
  reference: String,
  paid: Boolean,
  date: { type: Date, default: Date.now }
});

const Order = mongoose.model("Order", orderSchema);

// ---------------------------------------
// MIDDLEWARE
// ---------------------------------------
app.use(cors({ origin: FRONTEND_URLS, methods: ["GET", "POST", "PUT"] }));
app.use(bodyParser.json());

// ---------------------------------------
// ROOT ROUTE
// ---------------------------------------
app.get("/", (req, res) => {
  res.send("Backend is running...");
});

// ---------------------------------------
// INITIATE PAYMENT
// ---------------------------------------
app.post("/api/checkout", async (req, res) => {
  const { cart, totalAmount, customer, email } = req.body;
  const userEmail = email || customer?.email;

  if (!cart || !totalAmount || !userEmail) {
    return res.status(400).json({
      status: "error",
      message: "Missing required fields (cart, totalAmount, email/customer)"
    });
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
        amount: totalAmount * 100,
        currency: "NGN",
        metadata: { cart, customer }
      })
    });

    const data = await response.json();

    if (data.status) {
      return res.json({
        status: "success",
        publicKey: PAYSTACK_PUBLIC_KEY,
        reference: data.data.reference
      });
    } else {
      console.error("Paystack Init Error:", data);
      return res.json({ status: "error", message: "Failed to initialize payment" });
    }
  } catch (err) {
    console.error("Server error during checkout:", err);
    return res.status(500).json({ status: "error", message: "Server error" });
  }
});

// ---------------------------------------
// VERIFY PAYMENT
// ---------------------------------------
app.get("/api/verify-payment", async (req, res) => {
  const reference = req.query.reference;
  if (!reference) return res.status(400).json({ status: "error", message: "Payment reference missing" });

  try {
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json"
      }
    });

    const data = await response.json();

    if (data.status && data.data.status === "success") {
      const email = data.data.customer.email;
      const amount = data.data.amount / 100;
      const items = data.data.metadata.cart;
      const customer = data.data.metadata.customer;

      // Save order to MongoDB
      await Order.create({
        email,
        customer,
        cart: items,
        totalAmount: amount,
        reference,
        paid: true
      });

      console.log(`Order saved: ${reference}`);

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

      return res.json({ status: "success", message: "Payment verified and order saved" });
    } else {
      console.error("Payment verification failed:", data);
      return res.status(400).json({ status: "error", message: "Payment verification failed" });
    }
  } catch (err) {
    console.error("Error verifying payment:", err);
    return res.status(500).json({ status: "error", message: "Error verifying payment" });
  }
});

// ---------------------------------------
// START SERVER
// ---------------------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
