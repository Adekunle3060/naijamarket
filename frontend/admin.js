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

    // Try loading orders with this password
    try {
        const response = await fetch(`${BACKEND_URL}/api/orders`, {
            headers: { "x-admin-password": ADMIN_PASSWORD }
        });

        if (response.status === 401) {
            alert("Invalid admin password!");
            return;
        }

        // Success — show dashboard
        loginSection.style.display = "none";
        ordersSection.style.display = "block";

        const orders = await response.json();
        displayOrders(orders);

    } catch (err) {
        console.error("Login Error:", err);
        alert("Server error! Check your backend.");
    }
});


// ---------------------- LOAD ORDERS -------------------------
async function loadOrders() {
    ordersContainer.innerHTML = `<p style="padding:10px;">Loading orders...</p>`;

    try {
        const response = await fetch(`${BACKEND_URL}/api/orders`, {
            headers: { "x-admin-password": ADMIN_PASSWORD }
        });

        if (response.status === 401) {
            alert("Session expired. Login again!");
            location.reload();
            return;
        }

        const orders = await response.json();
        displayOrders(orders);

    } catch (err) {
        console.error("Load Orders Error:", err);
        ordersContainer.innerHTML = `<p>Failed to load orders.</p>`;
    }
}



// ---------------------- DISPLAY ORDERS -------------------------
function displayOrders(orders) {
    let html = `
        <table class="order-table">
            <thead>
                <tr>
                    <th>Email</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Reference</th>
                    <th>Date</th>
                    <th>Payment</th>
                </tr>
            </thead>
            <tbody>
    `;

    orders.forEach(order => {
        html += `
            <tr>
                <td>${order.email}</td>
                <td>
                    ${order.cart.map(i => `
                        <div>${i.name} x ${i.quantity}</div>
                    `).join("")}
                </td>
                <td>₦${order.totalAmount.toLocaleString()}</td>
                <td>${order.reference}</td>
                <td>${new Date(order.date).toLocaleString()}</td>

                <td>
                    <span class="${order.paid ? 'status-paid' : 'status-unpaid'}">
                        ${order.paid ? 'Paid' : 'Unpaid'}
                    </span>
                </td>
            </tr>
        `;
    });

    html += `</tbody></table>`;

    ordersContainer.innerHTML = html;
}



// ---------------------- REFRESH BUTTON -------------------------
const refreshBtn = document.createElement("button");
refreshBtn.textContent = "Refresh Orders";
refreshBtn.style.cssText = `
    margin-bottom: 15px;
    padding: 10px 18px;
    background: #2f4fe0;
    color: white;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    font-weight: 600;
`;
refreshBtn.onclick = loadOrders;

ordersSection.prepend(refreshBtn);
