document.addEventListener('DOMContentLoaded', function () {

    /* =====================================================
       PRODUCT LIST
    ===================================================== */
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

    /* =====================================================
          VARIABLES & ELEMENTS
    ===================================================== */
    let cart = [];
    const BACKEND_URL = "https://naijamarket-gtv0.onrender.com";

    const productsContainer = document.getElementById('products-container');
    const cartIcon = document.getElementById('cart-icon');
    const cartCount = document.getElementById('cart-count');
    const cartOverlay = document.getElementById('cart-overlay');
    const closeCart = document.getElementById('close-cart');
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    const checkoutBtn = document.getElementById('checkout-btn');

    /* =====================================================
          SAFE FETCH WRAPPER
    ===================================================== */
    async function safeFetch(url, options = {}, timeout = 10000) {
        return Promise.race([
            fetch(url, options),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Request timeout')), timeout)
            )
        ]);
    }

    /* =====================================================
          SMALL UI HELPER
    ===================================================== */
    function notify(msg) {
        alert(msg);
    }

    /* =====================================================
          RENDER PRODUCTS
    ===================================================== */
    function renderProducts() {
        productsContainer.innerHTML = '';

        products.forEach(p => {
            const card = document.createElement('div');
            card.className = 'product-card';

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

        document.querySelectorAll('.add-to-cart')
            .forEach(btn => btn.addEventListener('click', addToCart));
    }

    /* =====================================================
          CART FUNCTIONS
    ===================================================== */
    function addToCart(e) {
        const id = parseInt(e.target.dataset.id);
        const product = products.find(p => p.id === id);
        const exists = cart.find(i => i.id === id);

        exists ? exists.quantity++ : cart.push({ ...product, quantity: 1 });

        updateCart();

        e.target.textContent = "Added!";
        e.target.style.backgroundColor = "#333";
        setTimeout(() => {
            e.target.textContent = "Add to Cart";
            e.target.style.backgroundColor = "var(--primary-color)";
        }, 800);
    }

    function updateCart() {
        cartCount.textContent = cart.reduce((t, i) => t + i.quantity, 0);

        if (cart.length === 0) {
            cartItems.innerHTML = `<div class="empty-cart">Your cart is empty</div>`;
        } else {
            cartItems.innerHTML = '';

            cart.forEach(item => {
                const div = document.createElement('div');
                div.className = 'cart-item';

                div.innerHTML = `
                    <img src="${item.image}" class="cart-item-image">
                    <div class="cart-item-details">
                        <h4>${item.name}</h4>
                        <p>₦${item.price.toLocaleString()}</p>

                        <div class="quantity-control">
                            <button class="quantity-btn decrease" data-id="${item.id}">-</button>
                            <span class="quantity">${item.quantity}</span>
                            <button class="quantity-btn increase" data-id="${item.id}">+</button>
                        </div>
                    </div>

                    <button class="cart-item-remove" data-id="${item.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                `;

                cartItems.appendChild(div);
            });

            document.querySelectorAll('.increase').forEach(b => {
                b.addEventListener('click', () => {
                    const id = parseInt(b.dataset.id);
                    cart.find(i => i.id === id).quantity++;
                    updateCart();
                });
            });

            document.querySelectorAll('.decrease').forEach(b => {
                b.addEventListener('click', () => {
                    const id = parseInt(b.dataset.id);
                    const item = cart.find(i => i.id === id);

                    item.quantity > 1
                        ? item.quantity--
                        : cart = cart.filter(i => i.id !== id);

                    updateCart();
                });
            });

            document.querySelectorAll('.cart-item-remove').forEach(b => {
                b.addEventListener('click', () => {
                    const id = parseInt(b.dataset.id);
                    cart = cart.filter(i => i.id !== id);
                    updateCart();
                });
            });
        }

        const total = cart.reduce((t, i) => t + i.price * i.quantity, 0);
        cartTotal.textContent = `Total: ₦${total.toLocaleString()}`;
    }

    /* =====================================================
          CHECKOUT → SERVER → PAYSTACK POPUP
    ===================================================== */
    async function checkout() {
        if (!cart.length) return notify("Your cart is empty.");

        const email = prompt("Enter your email:");
        if (!email) return notify("Email is required.");

        const totalAmount = cart.reduce((t, i) => t + i.price * i.quantity, 0);

        try {
            const res = await safeFetch(`${BACKEND_URL}/api/checkout`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ cart, totalAmount, email })
            });

            const data = await res.json();
            if (data.status !== "success") {
                return notify("Failed to initialize payment.");
            }

            const handler = PaystackPop.setup({
                key: data.publicKey,
                email: email,
                amount: totalAmount * 100,
                ref: data.reference,

                onClose: () => notify("Payment popup closed."),

                callback: () => {
                    notify("Payment completed! Thank you.");
                    cart = [];
                    updateCart();
                }
            });

            handler.openIframe();

        } catch (err) {
            console.error(err);
            notify("Something went wrong.");
        }
    }

    /* =====================================================
          EVENT LISTENERS
    ===================================================== */
    cartIcon.addEventListener('click', () => cartOverlay.classList.add('active'));
    closeCart.addEventListener('click', () => cartOverlay.classList.remove('active'));
    cartOverlay.addEventListener('click', (e) => { if (e.target === cartOverlay) cartOverlay.classList.remove('active'); });

    checkoutBtn.addEventListener('click', checkout);

    /* =====================================================
          INITIALIZE PAGE
    ===================================================== */
    renderProducts();
    updateCart();
});
