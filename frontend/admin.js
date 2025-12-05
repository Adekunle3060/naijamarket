const ordersContainer = document.getElementById('orders-container');
const passwordInput = document.getElementById('admin-password');
const loginBtn = document.getElementById('login-btn');

let ADMIN_PASSWORD = null;

// Login to admin dashboard
loginBtn.addEventListener('click', () => {
    const password = passwordInput.value.trim();
    if (!password) return alert('Enter password');
    ADMIN_PASSWORD = password;
    passwordInput.value = '';
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('orders-section').style.display = 'block';
    fetchOrders();
    // Start polling every 5 seconds
    setInterval(fetchOrders, 5000);
});

const BACKEND_URL = 'https://naijamarket-gtv0.onrender.com'; // Replace with your backend

// Fetch orders
async function fetchOrders() {
    if (!ADMIN_PASSWORD) return;
    try {
        const res = await fetch(`${BACKEND_URL}/api/orders`, {
            headers: { 'x-admin-password': ADMIN_PASSWORD }
        });
        if (!res.ok) throw new Error('Unauthorized or server error');
        const orders = await res.json();

        // Display orders
        if (!orders.length) {
            ordersContainer.innerHTML = '<p>No orders yet.</p>';
            return;
        }

        ordersContainer.innerHTML = orders.map(order => {
            const itemsList = order.cart.map(i => `${i.name} x ${i.quantity}`).join(', ');
            return `
                <div class="order-card" style="border:1px solid #ccc; padding:10px; margin-bottom:10px;">
                    <p><strong>Email:</strong> ${order.email}</p>
                    <p><strong>Items:</strong> ${itemsList}</p>
                    <p><strong>Total:</strong> ₦${order.totalAmount.toLocaleString()}</p>
                    <p><strong>Reference:</strong> ${order.reference}</p>
                    <p><strong>Status:</strong> ${order.paid ? 'Paid' : 'Pending'}</p>
                    <p><strong>Date:</strong> ${new Date(order.date).toLocaleString()}</p>
                </div>
            `;
        }).join('');
    } catch (err) {
        console.error(err);
        ordersContainer.innerHTML = `<p style="color:red;">Error fetching orders: ${err.message}</p>`;
    }
}
