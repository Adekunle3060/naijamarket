const ordersContainer = document.getElementById("orders-container");
const passwordInput = document.getElementById("admin-password");
const loginBtn = document.getElementById("login-btn");

const loginSection = document.getElementById("login-section");
const ordersSection = document.getElementById("orders-section");

let ADMIN_PASSWORD = null;

// Your backend URL
const BACKEND_URL = "https://naijamarket-gtv0.onrender.com";


// ---------------------- LOGIN -------------------------
loginBtn.addEventListener("click", async () => {
    const password = passwordInput.value.trim();
    if (!password) return alert("Enter admin password");

    ADMIN_PASSWORD = password;

    try {
        const response = await fetch(`${BACKEND_URL}/admin/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password })
        });

        const data = await response.json();

        if (!data.success) {
            alert("Invalid admin password!");
            return;
        }

        // Success
        loginSection.style.display = "none";
        ordersSection.style.display = "block";
        loadOrders();

    } catch (err) {
        console.error("Login Error:", err);
        alert("Server error! Check your backend.");
    }
});


// ---------------------- LOAD ORDERS -------------------------
async function loadOrders() {
    ordersContainer.innerHTML = `<p style="padding:10px;">Loading orders...</p>`;

    try {
        const response = await fetch(`${BACKEND_URL}/admin/orders`);
        const orders = await response.json();

        if (!orders.length) {
            ordersContainer.innerHTML = `<p>No orders found.</p>`;
            return;
        }

        displayOrders(orders);

    } catch (err) {
        console.error("Load Orders Error:", err);
        ordersContainer.innerHTML = `<p>Failed to load orders.</p>`;
    }
}



// ---------------------- DISPLAY ORDERS -------------------------
function displayOrders(orders) {
    let html = `
        <table>
            <thead>
                <tr>
                    <th>Customer</th>
                    <th>Phone</th>
                    <th>Address</th>
                    <th>Item</th>
                    <th>Amount</th>
                    <th>Payment</th>
                    <th>Update</th>
                </tr>
            </thead>
            <tbody>
    `;

    orders.forEach(order => {
        html += `
            <tr>
                <td>${order.name}</td>
                <td>${order.phone}</td>
                <td>${order.address}</td>
                <td>${order.productName}</td>
                <td>₦${order.amount.toLocaleString()}</td>

                <td>
                    <span class="${order.paymentStatus === 'paid' ? 'status-paid' : 'status-unpaid'}">
                        ${order.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                    </span>
                </td>

                <td>
                    <button 
                        onclick="updatePayment('${order._id}', '${order.paymentStatus}')"
                        style="
                            padding:8px 12px;
                            border:none; 
                            background:#4a6bff;
                            color:white; 
                            border-radius:8px;
                            cursor:pointer;
                        ">
                        Mark ${order.paymentStatus === "paid" ? "Unpaid" : "Paid"}
                    </button>
                </td>
            </tr>
        `;
    });

    html += `</tbody></table>`;

    ordersContainer.innerHTML = html;
}



// ---------------------- UPDATE PAYMENT STATUS -------------------------
async function updatePayment(orderId, currentStatus) {
    const newStatus = currentStatus === "paid" ? "unpaid" : "paid";

    if (!confirm(`Are you sure you want to mark this order as ${newStatus}?`)) return;

    try {
        const response = await fetch(`${BACKEND_URL}/admin/update-payment`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: orderId, paymentStatus: newStatus })
        });

        const data = await response.json();

        if (data.success) {
            alert("Payment status updated!");
            loadOrders(); // Refresh table
        } else {
            alert("Failed to update.");
        }

    } catch (err) {
        console.error("Update Error:", err);
        alert("Server error while updating payment.");
    }
}



// ---------------------- OPTIONAL: AUTO-REFRESH BUTTON -------------------------
const refreshBtn = document.createElement("button");
refreshBtn.textContent = "Refresh Orders";
refreshBtn.style.cssText = `
    margin-top: 15px;
    padding: 10px 15px;
    background: #2f4fe0;
    color: white;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    font-weight: 600;
`;
refreshBtn.onclick = loadOrders;

ordersSection.prepend(refreshBtn);
