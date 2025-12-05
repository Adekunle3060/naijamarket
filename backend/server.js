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
    cart: Array,
    totalAmount: Number,
    reference: String,
    paid: Boolean, // <--- IMPORTANT (used by admin panel)
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
// INITIATE PAYMENT
// ---------------------------------------
app.post("/api/checkout", async (req, res) => {
    const { cart, totalAmount, email } = req.body;

    if (!cart || !totalAmount || !email)
        return res
            .status(400)
            .json({ status: "error", message: "Missing data" });

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
                    email,
                    amount: totalAmount * 100,
                    currency: "NGN",
                    metadata: { cart }
                })
            }
        );

        const data = await response.json();

        if (data.status) {
            res.json({
                status: "success",
                paymentUrl: data.data.authorization_url,
                publicKey: PAYSTACK_PUBLIC_KEY,
                reference: data.data.reference
            });
        } else {
            res.json({
                status: "error",
                message: "Failed to initialize payment"
            });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: "error", message: "Server error" });
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

            // Save order
            await Order.create({
                email,
                cart: items,
                totalAmount: amount,
                reference,
                paid: true
            });

            // Send confirmation email
            const transporter = nodemailer.createTransport({
                service: "gmail",
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });

            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: email,
                subject: "Order Confirmed - Naija Market",
                html: `
                    <h3>Thank you for your order!</h3>
                    <p>Items:</p>
                    <ul>
                        ${items
                            .map(i => `<li>${i.name} x ${i.quantity}</li>`)
                            .join("")}
                    </ul>
                    <p>Total Paid: ₦${amount.toLocaleString()}</p>
                `
            });

            res.send("Payment verified, order saved, and email sent.");
        } else {
            res.send("Payment verification failed.");
        }
    } catch (err) {
        console.error(err);
        res.send("Error verifying payment.");
    }
});

// ---------------------------------------
// ADMIN LOGIN
// ---------------------------------------
app.post("/admin/login", (req, res) => {
    const { password } = req.body;

    if (password === process.env.ADMIN_PASSWORD) {
        return res.json({ success: true });
    }

    return res.json({ success: false });
});

// ---------------------------------------
// ADMIN - GET ALL ORDERS
// ---------------------------------------
app.get("/admin/orders", async (req, res) => {
    try {
        const orders = await Order.find().sort({ date: -1 });
        res.json(orders);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error fetching orders." });
    }
});

// ---------------------------------------
// ADMIN - UPDATE PAYMENT STATUS
// ---------------------------------------
app.put("/admin/update-payment", async (req, res) => {
    try {
        const { id, paymentStatus } = req.body;

        await Order.findByIdAndUpdate(id, {
            paid: paymentStatus === "paid"
        });

        res.json({ success: true });
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false });
    }
});

// ---------------------------------------
// START SERVER
// ---------------------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
    console.log(`Server running on port ${PORT}`)
);
