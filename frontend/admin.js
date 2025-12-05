const ordersContainer = document.getElementById("orders-container");
const passwordInput = document.getElementById("admin-password");
const loginBtn = document.getElementById("login-btn");

let ADMIN_PASSWORD = null;

const BACKEND_URL = "https://naijamarket-gtv0.onrender.com";

// ---------------------- LOGIN -------------------------
loginBtn.addEventListener("click", () => {
    const password = passwordInput.value.trim();
    if (!password) return alert("Enter password");

    ADMIN_PASSWORD = password;
    passwordInput.value = "";

    document.getElementById("login-section").style.display = "none";
    document.getElementById("orders-section").style.display = "block";

    fetchOrders();
    setInterval(fetchOrders, 5000);
});

// ---------------------- FETCH ORDERS -------------------------
async function fetchOrders() {
    if (!ADMIN_PASSWORD) return;

    try {
        const res = await fetch(`${BACKEND_URL}/api/orders`, {
            headers: { "x-admin-password": ADMIN_PASSWORD }
        });

        if (!res.ok) throw new Error("Unauthorized or server error");

        const orders = await res.json();

        // Display orders in table format
        if (!orders.length) {
            ordersContainer.innerHTML = "<p>No orders yet.</p>";
            return;
        }

        const tableHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Email</th>
                        <th>Items</th>
                        <th>Total</th>
                        <th>Reference</th>
                        <th>Status</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody>
                    ${orders.map(order => `
                        <tr>
                            <td>${order.email}</td>
                            <td>${order.cart.map(i => `${i.name} x ${i.quantity}`).join(", ")}</td>
                            <td>₦${order.totalAmount.toLocaleString()}</td>
                            <td>${order.reference}</td>

                            <td class="${order.paid ? "status-paid" : "status-unpaid"}">
                                ${order.paid ? "PAID" : "UNPAID"}
                            </td>

                            <td>${new Date(order.date).toLocaleString()}</td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        `;

        ordersContainer.innerHTML = tableHTML;

    } catch (error) {
        ordersContainer.innerHTML = `<p style="color:red;">Error: ${error.message}</p>`;
    }
}
