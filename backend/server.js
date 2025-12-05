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

// Order Schema
const orderSchema = new mongoose.Schema({
    email: String,
    customer: Object, // Store all customer details
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
app.use(
    cors({
        origin: FRONTEND_URLS,
        methods: ["GET", "POST", "PUT"]
    })
);

app.use(bodyParser.json());

// ---------------------------------------
// ROOT ROUTE
// ---------------------------------------
app.get("/", (req, res) => {
    res.send("Backend is running...");
});

// ---------------------------------------
// INITIATE PAYMENT (UPDATED)
// ---------------------------------------
app.post("/api/checkout", async (req, res) => {
    const { cart, totalAmount, customer, email } = req.body;

    // Allow email from either field
    const userEmail = email || customer?.email;

    if (!cart || !totalAmount || !userEmail) {
        return res
            .status(400)
            .json({ status: "error", message: "Missing required fields" });
    }

    try {
        const response = await fetch(
            "https://api.paystack.co/transaction/initialize",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: userEmail,
                    amount: totalAmount * 100,
                    currency: "NGN",
                    metadata: {
                        cart,
                        customer
                    }
                })
            }
        );

        const data = await response.json();

        if (data.status) {
            return res.json({
                status: "success",
                publicKey: PAYSTACK_PUBLIC_KEY,
                reference: data.data.reference
            });
        } else {
            return res.json({
                status: "error",
                message: "Failed to initialize payment"
            });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ status: "error", message: "Server error" });
    }
});

// ---------------------------------------
// VERIFY PAYMENT
// ---------------------------------------
app.get("/api/verify-payment", async (req, res) => {
    const reference = req.query.reference;
    if (!reference) return res.send("Payment reference missing");

    try {
        const response = await fetch(
            `https://api.paystack.co/transaction/verify/${reference}`, 
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        const data = await response.json();

        if (data.status && data.data.status === "success") {
            const email = data.data.customer.email;
            const amount = data.data.amount / 100;
            const items = data.data.metadata.cart;
            const customer = data.data.metadata.customer;

            await Order.create({
                email,
                customer,
                cart: items,
                totalAmount: amount,
                reference,
                paid: true
            });

            res.send("Payment verified and order saved.");
        } else {
            res.send("Payment verification failed.");
        }
    } catch (err) {
        console.error(err);
        res.send("Error verifying payment.");
    }
});

// ---------------------------------------
// START SERVER
// ---------------------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
    console.log(`Server running on port ${PORT}`)
);
