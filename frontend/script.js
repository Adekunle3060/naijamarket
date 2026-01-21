document.addEventListener("DOMContentLoaded", function () {
  const products = [
    { id: 1, name: "Adire Fabric", description: "Traditional Yoruba tie-dye fabric.", price: 4500, image: "https://img001.prntscr.com/file/img001/M9zSmJz-RQKMODRAYvke-g.jpg" },
    { id: 2, name: "Ofada Rice", description: "Locally grown aromatic rice.", price: 3500, image: "https://img001.prntscr.com/file/img001/ZLlbltDlRBGFdG7wKFp-GA.jpg" },
    { id: 3, name: "Shea Butter", description: "Pure, unrefined shea butter.", price: 2500, image: "https://img001.prntscr.com/file/img001/mrHQLIqrQnOQn6cjE1edbw.jpg" }
    { id: 4, name: "Akara Beans", description: "Premium brown beans.", price: 1800, image: "https://img001.prntscr.com/file/img001/zIx5LPstTIWgRpTvXLeW2A.jpg" },
    { id: 5, name: "Palm Oil", description: "100% pure red palm oil.", price: 2000, image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTI4TRpyEhD0JtnIwE1AGDPu0Jfx-L2iKayjQ&s" },
    { id: 6, name: "Kente Cloth", description: "Handwoven kente cloth.", price: 7500, image: "https://img001.prntscr.com/file/img001/H6CdDsQITJCgWWyxd27UJQ.jpg" },
    { id: 7, name: "Suya Spice Mix", description: "Authentic suya spice blend.", price: 1500, image: "https://www.chefspencil.com/wp-content/uploads/Suya-1.jpg" },
    { id: 8, name: "Bitter Leaf", description: "Dried bitter leaf.", price: 1200, image: "https://img001.prntscr.com/file/img001/XJlAs3_GQG69recaRCGnqQ.jpg" }
  ];

  let cart = [];
  const BACKEND_URL = "https://naijamarket-gtv0.onrender.com";
  const PAYSTACK_PUBLIC_KEY = "pk_test_9c0c8023c9d5cc025e12c161c8d7a405b281aa8c";

  // ---------------- DOM ELEMENTS ----------------
  const productsContainer = document.getElementById("products-container");
  const cartCount = document.getElementById("cart-count");
  const cartItems = document.getElementById("cart-items");
  const cartTotal = document.getElementById("cart-total");
  const checkoutBtn = document.getElementById("checkout-btn");
  const checkoutModal = document.getElementById("checkout-modal");
  const checkoutForm = document.getElementById("checkout-form");
  const cartOverlay = document.getElementById("cart-overlay");
  const cartIcon = document.getElementById("cart-icon");
  const closeCartBtn = document.getElementById("close-cart");
  const closeCheckoutBtn = document.getElementById("close-checkout");

  const firstName = document.getElementById("firstName");
  const lastName = document.getElementById("lastName");
  const email = document.getElementById("email");
  const phone = document.getElementById("phone");
  const address = document.getElementById("address");

  const notify = msg => alert(msg);

  // ---------------- SAFE FETCH ----------------
  async function safeFetch(url, options = {}, timeout = 30000) {
    return Promise.race([
      fetch(url, options),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Request timeout")), timeout))
    ]);
  }

  // ---------------- RENDER PRODUCTS ----------------
  function renderProducts() {
    productsContainer.innerHTML = "";
    products.forEach(p => {
      const card = document.createElement("div");
      card.className = "product-card";
      card.innerHTML = `
        <img src="${p.image}" class="product-image">
        <div class="product-info">
          <h3 class="product-title">${p.name}</h3>
          <p class="product-description">${p.description}</p>
          <div class="product-footer">
            <span class="product-price">₦${p.price.toLocaleString()}</span>
            <button class="add-to-cart" data-id="${p.id}">Add to Cart</button>
          </div>
        </div>
      `;
      productsContainer.appendChild(card);
    });

    document.querySelectorAll(".add-to-cart").forEach(btn => btn.addEventListener("click", addToCart));
  }

  // ---------------- CART LOGIC ----------------
  function addToCart(e) {
    const id = Number(e.target.dataset.id);
    const product = products.find(p => p.id === id);
    const existing = cart.find(i => i.id === id);
    existing ? existing.quantity++ : cart.push({ ...product, quantity: 1 });
    updateCart();
  }

  function updateCart() {
    cartCount.textContent = cart.reduce((t, i) => t + i.quantity, 0);

    if (!cart.length) {
      cartItems.innerHTML = `<div class="empty-cart">Your cart is empty</div>`;
    } else {
      cartItems.innerHTML = "";
      cart.forEach(item => {
        const div = document.createElement("div");
        div.className = "cart-item";
        div.innerHTML = `
          <img src="${item.image}" class="cart-item-image">
          <div class="cart-item-details">
            <strong>${item.name}</strong>
            <div>₦${item.price.toLocaleString()}</div>
            <div class="quantity-control">
              <button class="quantity-btn decrease" data-id="${item.id}">-</button>
              <span class="quantity">${item.quantity}</span>
              <button class="quantity-btn increase" data-id="${item.id}">+</button>
            </div>
            <button class="cart-item-remove remove" data-id="${item.id}">Remove</button>
          </div>
        `;
        cartItems.appendChild(div);
      });

      document.querySelectorAll(".increase").forEach(btn => btn.onclick = () => {
        cart.find(i => i.id === +btn.dataset.id).quantity++;
        updateCart();
      });
      document.querySelectorAll(".decrease").forEach(btn => btn.onclick = () => {
        const item = cart.find(i => i.id === +btn.dataset.id);
        item.quantity > 1 ? item.quantity-- : cart = cart.filter(i => i.id !== item.id);
        updateCart();
      });
      document.querySelectorAll(".remove").forEach(btn => btn.onclick = () => {
        cart = cart.filter(i => i.id !== +btn.dataset.id);
        updateCart();
      });
    }

    cartTotal.textContent = `Total: ₦${cart.reduce((t, i) => t + i.price * i.quantity, 0).toLocaleString()}`;
  }

  // ---------------- UI CONTROLS ----------------
  cartIcon.onclick = () => cartOverlay.classList.add("active");
  closeCartBtn.onclick = () => cartOverlay.classList.remove("active");
  closeCheckoutBtn.onclick = () => checkoutModal.classList.remove("active");
  checkoutBtn.onclick = () => { if (!cart.length) return notify("Cart is empty."); checkoutModal.classList.add("active"); };

  // ---------------- CHECKOUT + PAYSTACK ----------------
  checkoutForm.addEventListener("submit", async e => {
    e.preventDefault();

    const customer = {
      firstName: firstName.value.trim(),
      lastName: lastName.value.trim(),
      email: email.value.trim(),
      phone: phone.value.trim(),
      address: address.value.trim()
    };

    const totalAmount = cart.reduce((t, i) => t + i.price * i.quantity, 0);

    try {
      const initRes = await safeFetch(`${BACKEND_URL}/api/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart, amount: totalAmount, customer, email: customer.email })
      });

      const initData = await initRes.json();
      console.log("Checkout init data:", initData);

      if (!initData.status || !initData.data?.reference) {
        return notify(initData.message || "Payment initialization failed.");
      }

      const handler = PaystackPop.setup({
        key: PAYSTACK_PUBLIC_KEY,
        email: customer.email,
        amount: totalAmount * 100,
        ref: initData.data.reference,
        onClose: () => notify("Payment cancelled."),
        callback: async function(response) {
          try {
            const verifyRes = await fetch(`${BACKEND_URL}/api/verify-payment?reference=${response.reference}`);
            const verifyData = await verifyRes.json();

            if (verifyData.status === true) {
              notify("Payment verified and order saved!");
              cart = [];
              updateCart();
              cartOverlay.classList.remove("active");
              window.location.href = `/payment-status.html?reference=${response.reference}`;
            } else {
              notify(verifyData.message || "Payment verification failed.");
            }
          } catch {
            notify("Verification failed.");
          }
        }
      });

      handler.openIframe();

    } catch (err) {
      console.error(err);
      notify("Checkout failed. Try again.");
    }
  });

  // ---------------- INIT ----------------
  renderProducts();
  updateCart();
});
