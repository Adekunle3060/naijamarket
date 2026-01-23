const ordersContainer = document.getElementById("orders-container");
const passwordInput = document.getElementById("admin-password");
const loginBtn = document.getElementById("login-btn");

const loginSection = document.getElementById("login-section");
const ordersSection = document.getElementById("orders-section");

let ADMIN_PASSWORD = sessionStorage.getItem("admin_password") || null;
const BACKEND_URL = "https://naijamarket-gtv0.onrender.com";

// ---------------------- LOGIN -------------------------
loginBtn.addEventListener("click", async () => {
  const password = passwordInput.value.trim();
  if (!password) return alert("Enter admin password");
  ADMIN_PASSWORD = password;
  sessionStorage.setItem("admin_password", ADMIN_PASSWORD);
  await initDashboard();
});

// ---------------------- INIT DASHBOARD -------------------------
async function initDashboard() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/orders`, {
      headers: { "x-admin-password": ADMIN_PASSWORD }
    });

    if (response.status === 401) {
      alert("Invalid admin password!");
      sessionStorage.removeItem("admin_password");
      return location.reload();
    }

    loginSection.style.display = "none";
    ordersSection.style.display = "block";

    const orders = await response.json();
    displayOrders(orders);

    // Auto-refresh every 60s
    setInterval(loadOrders, 60000);

  } catch (err) {
    console.error("Login Error:", err);
    alert("Server error! Check your backend.");
  }
}

// ---------------------- LOAD ORDERS -------------------------
async function loadOrders() {
  ordersContainer.innerHTML = `<p style="padding:10px;">Loading orders...</p>`;

  try {
    const response = await fetch(`${BACKEND_URL}/api/orders`, {
      headers: { "x-admin-password": ADMIN_PASSWORD }
    });

    if (response.status === 401) {
      alert("Session expired. Login again!");
      sessionStorage.removeItem("admin_password");
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
  if (!orders.length) {
    ordersContainer.innerHTML = "<p>No orders yet.</p>";
    return;
  }

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
          <th>Fulfill</th>
        </tr>
      </thead>
      <tbody>
  `;

  orders.forEach(order => {
    html += `
      <tr>
        <td>${order.email}</td>
        <td>${order.cart.map(i => `<div>${i.name} x ${i.quantity}</div>`).join("")}</td>
        <td>₦${order.totalAmount.toLocaleString()}</td>
        <td>${order.reference}</td>
        <td>${new Date(order.date).toLocaleString()}</td>
        <td><span class="${order.paid ? 'status-paid' : 'status-unpaid'}">${order.paid ? 'Paid' : 'Unpaid'}</span></td>
        <td>
          <button ${order.fulfilled ? "disabled" : ""} data-id="${order._id}" class="fulfill-btn">
            ${order.fulfilled ? "Fulfilled" : "Mark Fulfilled"}
          </button>
        </td>
      </tr>
    `;
  });

  html += `</tbody></table>`;
  ordersContainer.innerHTML = html;

  document.querySelectorAll(".fulfill-btn").forEach(btn => {
    btn.onclick = async () => {
      const id = btn.dataset.id;
      try {
        const res = await fetch(`${BACKEND_URL}/api/orders/${id}/fulfill`, {
          method: "PUT",
          headers: { "x-admin-password": ADMIN_PASSWORD }
        });
        if (res.ok) loadOrders();
      } catch (err) {
        console.error(err);
        alert("Failed to mark order as fulfilled.");
      }
    };
  });
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

// ---------------------- AUTO LOGIN IF SESSION -------------------------
if (ADMIN_PASSWORD) initDashboard();
