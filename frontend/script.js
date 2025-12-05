// script.js — Clean, optimized, production-ready
document.addEventListener('DOMContentLoaded', () => {
  // ---------- CONFIG ----------
  const BACKEND_URL = 'https://naijamarket-gtv0.onrender.com'; // update if needed
  const CURRENCY = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 });

  // Fallback image for broken links
  const FALLBACK_IMAGE = 'data:image/svg+xml;utf8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="250">' +
      '<rect width="100%" height="100%" fill="#f3f3f3"/>' +
      '<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#888" font-size="18">Image unavailable</text>' +
    '</svg>'
  );

  // ---------- APP STATE (persisted) ----------
  let cart = loadFromStorage('naija_cart') || [];
  let lastPaymentReference = loadFromStorage('naija_last_ref') || null;
  let pendingCheckout = false;

  // ---------- DATA ----------
  const products = [
    { id: 1, name: "Adire Fabric", description: "Traditional Yoruba tie-dye fabric.", price: 4500, image: "https://img001.prntscr.com/file/img001/M9zSmJz-RQKMODRAYvke-g.jpg" },
    { id: 2, name: "Ofada Rice", description: "Locally grown aromatic rice.", price: 3500, image: "https://img001.prntscr.com/file/img001/ZLlbltDlRBGFdG7wKFp-GA.jpg" },
    { id: 3, name: "Shea Butter", description: "Pure, unrefined shea butter.", price: 2500, image: "https://img001.prntscr.com/file/img001/mrHQLIqrQnOQn6cjE1edbw.jpg" },
    { id: 4, name: "Akara Beans", description: "Premium brown beans.", price: 1800, image: "https://img001.prntscr.com/file/img001/zIx5LPstTIWgRpTvXLeW2A.jpg" },
    { id: 5, name: "Palm Oil", description: "100% pure red palm oil.", price: 2000, image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTI4TRpyEhD0JtnIwE1AGDPu0Jfx-L2iKayjQ&s" },
    { id: 6, name: "Kente Cloth", description: "Handwoven kente cloth.", price: 7500, image: "https://img001.prntscr.com/file/img001/H6CdDsQITJCgWWyxd27UJQ.jpg" },
    { id: 7, name: "Suya Spice Mix", description: "Authentic suya spice blend.", price: 1500, image: "https://www.chefspencil.com/wp-content/uploads/Suya-1.jpg" },
    { id: 8, name: "Bitter Leaf", description: "Dried bitter leaf.", price: 1200, image: "https://img001.prntscr.com/file/img001/XJlAs3_GQG69recaRCGnqQ.jpg" }
  ];

  // ---------- DOM REFS ----------
  const productsContainer = document.getElementById('products-container');
  const cartIcon = document.getElementById('cart-icon');
  const cartCountEl = document.getElementById('cart-count');
  const cartOverlay = document.getElementById('cart-overlay');
  const closeCartBtn = document.getElementById('close-cart');
  const cartItemsContainer = document.getElementById('cart-items');
  const cartTotalEl = document.getElementById('cart-total');
  const checkoutBtn = document.getElementById('checkout-btn');
  const verifyPaymentBtn = document.getElementById('check-status-btn');

  if (!productsContainer || !cartIcon || !cartCountEl || !cartOverlay || !closeCartBtn || !cartItemsContainer || !cartTotalEl || !checkoutBtn || !verifyPaymentBtn) {
    console.error('One or more required DOM elements are missing. Check your HTML IDs.');
    return;
  }

  // ---------- HELPERS ----------
  function saveToStorage(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* ignore */ }
  }
  function loadFromStorage(key) {
    try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; }
  }
  function formatCurrency(amount) {
    // amount is integer (no kobo)
    return CURRENCY.format(amount);
  }
  function notify(msg) {
    // Simple toast replacement: alert fallback for simplicity
    // You can replace this with a nicer UI later
    try { window.alert(msg); } catch (e) { console.log(msg); }
  }
  function safeFetch(url, options = {}, timeout = 10000) {
    // fetch with timeout using AbortController
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    return fetch(url, { ...options, signal: controller.signal })
      .finally(() => clearTimeout(id));
  }

  // ---------- RENDERING ----------
  function renderProducts() {
    productsContainer.innerHTML = '';
    products.forEach(p => {
      const card = document.createElement('div');
      card.className = 'product-card';
      card.innerHTML = `
        <img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" class="product-image" loading="lazy">
        <div class="product-info">
          <h3 class="product-title">${escapeHtml(p.name)}</h3>
          <p class="product-description">${escapeHtml(p.description)}</p>
          <div class="product-footer">
            <span class="product-price">${formatCurrency(p.price)}</span>
            <button class="add-to-cart" data-id="${p.id}" aria-label="Add ${escapeHtml(p.name)} to cart">Add to Cart</button>
          </div>
        </div>
      `;
      // ensure fallback for broken images
      const img = card.querySelector('img');
      img.addEventListener('error', () => { img.src = FALLBACK_IMAGE; });
      productsContainer.appendChild(card);
    });
  }

  function renderCart() {
    // Update count
    const totalCount = cart.reduce((t, i) => t + i.quantity, 0);
    cartCountEl.textContent = totalCount;

    if (!cart.length) {
      cartItemsContainer.innerHTML = '<div class="empty-cart">Your cart is empty</div>';
      cartTotalEl.textContent = `Total: ${formatCurrency(0)}`;
      return;
    }

    cartItemsContainer.innerHTML = '';
    cart.forEach(item => {
      const div = document.createElement('div');
      div.className = 'cart-item';
      div.dataset.id = item.id;
      div.innerHTML = `
        <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" class="cart-item-image" />
        <div class="cart-item-details">
          <h4 class="cart-item-title">${escapeHtml(item.name)}</h4>
          <p class="cart-item-price">${formatCurrency(item.price)}</p>
          <div class="quantity-control">
            <button class="quantity-btn decrease" data-id="${item.id}" aria-label="Decrease quantity">-</button>
            <span class="quantity">${item.quantity}</span>
            <button class="quantity-btn increase" data-id="${item.id}" aria-label="Increase quantity">+</button>
          </div>
        </div>
        <button class="cart-item-remove" data-id="${item.id}" aria-label="Remove item"><i class="fas fa-trash"></i></button>
      `;
      const img = div.querySelector('img');
      img.addEventListener('error', () => { img.src = FALLBACK_IMAGE; });
      cartItemsContainer.appendChild(div);
    });

    const total = cart.reduce((t, i) => t + i.price * i.quantity, 0);
    cartTotalEl.textContent = `Total: ${formatCurrency(total)}`;

    // persist cart
    saveToStorage('naija_cart', cart);
  }

  // ---------- CART OPERATIONS ----------
  function addToCartById(id, qty = 1) {
    const product = products.find(p => p.id === Number(id));
    if (!product) return;
    const existing = cart.find(i => i.id === product.id);
    if (existing) existing.quantity += qty;
    else cart.push({ ...product, quantity: qty });
    renderCart();
  }

  function setQuantity(id, qty) {
    cart = cart.map(i => i.id === Number(id) ? { ...i, quantity: qty } : i).filter(i => i.quantity > 0);
    renderCart();
  }

  function removeFromCartById(id) {
    cart = cart.filter(i => i.id !== Number(id));
    renderCart();
  }

  function clearCart() {
    cart = [];
    renderCart();
  }

  // ---------- PAYMENT ----------
  async function checkout() {
    if (pendingCheckout) return;
    if (!cart.length) return notify('Cart is empty.');

    // Simple email prompt — replace with proper form/modal if needed
    const email = prompt('Enter your email for order confirmation:');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return notify('Valid email required.');

    const totalAmount = cart.reduce((t, i) => t + i.price * i.quantity, 0);
    pendingCheckout = true;
    checkoutBtn.disabled = true;

    try {
      const res = await safeFetch(`${BACKEND_URL}/api/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cart, totalAmount, email })
      }, 15000);

      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(`Server responded ${res.status} ${txt}`);
      }

      const data = await res.json();

      if (data.status !== 'success' || !data.publicKey || !data.reference) {
        throw new Error(data.message || 'Invalid response from payment initialization.');
      }

      // Save reference
      lastPaymentReference = data.reference;
      saveToStorage('naija_last_ref', lastPaymentReference);

      if (typeof PaystackPop === 'undefined') {
        notify('Payment library not available. Please contact support.');
        return;
      }

      const handler = PaystackPop.setup({
        key: data.publicKey,
        email,
        amount: totalAmount * 100, // kobo
        ref: data.reference,
        onClose: function () {
          notify('Payment popup closed.');
        },
        callback: function (response) {
          // response.reference
          lastPaymentReference = response.reference || lastPaymentReference;
          saveToStorage('naija_last_ref', lastPaymentReference);
          notify('Payment completed! Click "Check Payment Status" to verify.');
          clearCart();
        }
      });

      handler.openIframe();
    } catch (err) {
      console.error('Checkout error:', err);
      notify('Checkout failed. Try again later.');
    } finally {
      pendingCheckout = false;
      checkoutBtn.disabled = false;
    }
  }

  async function verifyPayment() {
    if (!lastPaymentReference) return notify('No payment reference found. Make a payment first.');

    try {
      const res = await safeFetch(`${BACKEND_URL}/api/verify-payment/${encodeURIComponent(lastPaymentReference)}`, {}, 10000);
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(`Server ${res.status} ${txt}`);
      }
      const data = await res.json();
      // Backend should return something like { status: 'success', verified: true } — adapt to your API
      if (data.status === 'success' && (data.verified === true || data.payment_status === 'success')) {
        notify('Payment verified successfully!');
        // optionally clear lastPaymentReference
        lastPaymentReference = null;
        saveToStorage('naija_last_ref', null);
      } else {
        notify('Payment not verified yet. Please try again later.');
      }
    } catch (err) {
      console.error('Verify error:', err);
      notify('Unable to verify payment at this time.');
    }
  }

  // ---------- EVENTS (delegated) ----------
  // Product "Add to Cart" (delegated)
  productsContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('.add-to-cart');
    if (!btn) return;
    const id = btn.dataset.id;
    btn.disabled = true;
    addToCartById(id, 1);
    setTimeout(() => { btn.disabled = false; }, 600);
  });

  // Cart item controls (delegated)
  cartItemsContainer.addEventListener('click', (e) => {
    const decrease = e.target.closest('.decrease');
    const increase = e.target.closest('.increase');
    const remove = e.target.closest('.cart-item-remove');

    if (decrease) {
      const id = decrease.dataset.id;
      const item = cart.find(i => i.id === Number(id));
      if (!item) return;
      if (item.quantity > 1) setQuantity(id, item.quantity - 1);
      else removeFromCartById(id);
    } else if (increase) {
      const id = increase.dataset.id;
      const item = cart.find(i => i.id === Number(id));
      if (!item) return;
      setQuantity(id, item.quantity + 1);
    } else if (remove) {
      const id = remove.dataset.id;
      removeFromCartById(id);
    }
  });

  // Cart open / close
  cartIcon.addEventListener('click', () => cartOverlay.classList.add('active'));
  closeCartBtn.addEventListener('click', () => cartOverlay.classList.remove('active'));
  cartOverlay.addEventListener('click', (e) => { if (e.target === cartOverlay) cartOverlay.classList.remove('active'); });

  // Checkout & Verify
  checkoutBtn.addEventListener('click', checkout);
  verifyPaymentBtn.addEventListener('click', verifyPayment);

  // ---------- UTIL ----------
  function escapeHtml(str = '') {
    return String(str)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  // ---------- INIT ----------
  renderProducts();
  renderCart();
});
