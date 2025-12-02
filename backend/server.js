import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';
import nodemailer from 'nodemailer';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const app = express();

// ---------- CONFIGURATION ----------
const FRONTEND_URLS = [
    process.env.FRONTEND_URL || 'https://naijamarket-three.vercel.app'
];

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_PUBLIC_KEY = process.env.PAYSTACK_PUBLIC_KEY;

// ---------- MONGODB CONNECTION ----------
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// ---------- MIDDLEWARE ----------
app.use(cors({
    origin: FRONTEND_URLS,
    methods: ['GET', 'POST']
}));
app.use(bodyParser.json());

// ---------- SCHEMA ----------
const orderSchema = new mongoose.Schema({
    email: String,
    cart: Array,
    totalAmount: Number,
    reference: String,
    paid: Boolean,
    date: { type: Date, default: Date.now }
});

const Order = mongoose.model('Order', orderSchema);

// ---------- ROUTES ----------
app.get("/", (req, res) => res.send("Backend is running..."));

// Initialize payment
// Initialize payment
app.post('/api/checkout', async (req, res) => {
    const { cart, totalAmount, email } = req.body;
    if (!cart || !totalAmount || !email) return res.status(400).json({ status: 'error', message: 'Missing data' });

    try {
        const response = await fetch('https://api.paystack.co/transaction/initialize', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                amount: totalAmount * 100,
                currency: 'NGN',
                metadata: { cart: JSON.stringify(cart) },
                // Redirect to frontend payment status page after payment
                callback_url: `${process.env.FRONTEND_URL}/payment-status.html`
            })
        });

        const data = await response.json();

        if (data.status) {
            res.json({
                status: 'success',
                paymentUrl: data.data.authorization_url,
                publicKey: PAYSTACK_PUBLIC_KEY,
                reference: data.data.reference
            });
        } else {
            res.json({ status: 'error', message: 'Failed to initialize payment' });
        }

    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
});


// Verify payment
app.get('/api/verify-payment', async (req, res) => {
    const reference = req.query.reference;
    if (!reference) return res.send('Payment reference missing');

    try {
        const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (data.status && data.data.status === 'success') {
            const orderId = data.data.metadata.orderId;
            const order = await Order.findById(orderId);

            if (order) {
                order.paid = true;
                await order.save();

                const email = data.data.customer.email;
                const amount = data.data.amount / 100;
                const items = JSON.parse(data.data.metadata.cart);

                // Send confirmation email
                const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASS
                    }
                });

                await transporter.sendMail({
                    from: process.env.EMAIL_USER,
                    to: email,
                    subject: 'Order Confirmed - Naija Market',
                    html: `<h3>Thank you for your order!</h3>
                           <p>Items: ${items.map(i => `${i.name} x ${i.quantity}`).join(', ')}</p>
                           <p>Total Paid: ₦${amount.toLocaleString()}</p>`
                });

                res.send('Payment verified, order updated, and email sent.');
            } else {
                res.send('Order not found.');
            }
        } else {
            res.send('Payment verification failed.');
        }

    } catch (err) {
        console.error(err);
        res.send('Error verifying payment.');
    }
});

// Get order by reference (for frontend payment status page)
app.get('/api/orders-by-reference', async (req, res) => {
    const reference = req.query.reference;
    if (!reference) return res.status(400).json({ message: 'Reference missing' });

    try {
        const order = await Order.findOne({ reference });
        if (!order) return res.status(404).json({ message: 'Order not found' });
        res.json(order);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Admin route (password protected)
app.get('/api/orders', async (req, res) => {
    const adminPassword = req.headers['x-admin-password'];
    if (adminPassword !== process.env.ADMIN_PASSWORD) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const orders = await Order.find().sort({ date: -1 });
        res.json(orders);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching orders' });
    }
});

// ---------- SERVER ----------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
