document.addEventListener('DOMContentLoaded', function () {
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

    let cart = [];
    const BACKEND_URL = "https://naijamarket-gtv0.onrender.com";

    const productsContainer = document.getElementById('products-container');
    const cartCount = document.getElementById('cart-count');
    const cartOverlay = document.getElementById('cart-overlay');
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    const checkoutBtn = document.getElementById('checkout-btn');
    const checkoutModal = document.getElementById('checkout-modal');
    const checkoutForm = document.getElementById('checkout-form');

    function notify(msg) { alert(msg); }

    async function safeFetch(url, options = {}, timeout = 10000) {
        return Promise.race([fetch(url, options), new Promise((_, reject) => setTimeout(() => reject(new Error('Request timeout')), timeout))]);
    }

    function renderProducts() {
        productsContainer.innerHTML = '';
        products.forEach(p => {
            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
                <img src="${p.image}" class="product-image">
                <div class="product-info">
                    <h3>${p.name}</h3>
                    <p>${p.description}</p>
                    <div class="product-footer">
                        <span>₦${p.price.toLocaleString()}</span>
                        <button class="add-to-cart" data-id="${p.id}">Add to Cart</button>
                    </div>
                </div>
            `;
            productsContainer.appendChild(card);
        });
        document.querySelectorAll('.add-to-cart').forEach(btn => btn.addEventListener('click', addToCart));
    }

    function addToCart(e) {
        const id = parseInt(e.target.dataset.id);
        const product = products.find(p => p.id === id);
        const exists = cart.find(i => i.id === id);
        exists ? exists.quantity++ : cart.push({ ...product, quantity: 1 });
        updateCart();
    }

    function updateCart() {
        cartCount.textContent = cart.reduce((t, i) => t + i.quantity, 0);
        if (!cart.length) cartItems.innerHTML = `<div class="empty-cart">Your cart is empty</div>`;
        else {
            cartItems.innerHTML = '';
            cart.forEach(item => {
                const div = document.createElement('div');
                div.className = 'cart-item';
                div.innerHTML = `
                    <img src="${item.image}">
                    <div>
                        <h4>${item.name}</h4>
                        <p>₦${item.price.toLocaleString()}</p>
                        <div>
                            <button class="decrease" data-id="${item.id}">-</button>
                            <span>${item.quantity}</span>
                            <button class="increase" data-id="${item.id}">+</button>
                        </div>
                    </div>
                    <button class="remove" data-id="${item.id}">X</button>
                `;
                cartItems.appendChild(div);
            });
            document.querySelectorAll('.increase').forEach(b => b.addEventListener('click', () => {
                const id = parseInt(b.dataset.id); cart.find(i => i.id === id).quantity++; updateCart();
            }));
            document.querySelectorAll('.decrease').forEach(b => b.addEventListener('click', () => {
                const id = parseInt(b.dataset.id);
                const item = cart.find(i => i.id === id);
                item.quantity > 1 ? item.quantity-- : cart = cart.filter(i => i.id !== id);
                updateCart();
            }));
            document.querySelectorAll('.remove').forEach(b => b.addEventListener('click', () => {
                const id = parseInt(b.dataset.id); cart = cart.filter(i => i.id !== id); updateCart();
            }));
        }
        cartTotal.textContent = `Total: ₦${cart.reduce((t, i) => t + i.price * i.quantity, 0).toLocaleString()}`;
    }

    checkoutBtn.addEventListener("click", () => {
        if (!cart.length) return notify("Cart is empty."); checkoutModal.classList.add("active");
    });

    checkoutForm.addEventListener("submit", async e => {
        e.preventDefault();
        const customer = {
            firstName: document.getElementById("firstName").value.trim(),
            lastName: document.getElementById("lastName").value.trim(),
            email: document.getElementById("email").value.trim(),
            phone: document.getElementById("phone").value.trim(),
            address: document.getElementById("address").value.trim()
        };
        const totalAmount = cart.reduce((t, i) => t + i.price * i.quantity, 0);

        try {
            const initRes = await safeFetch(`${BACKEND_URL}/api/checkout`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ cart, totalAmount, email: customer.email, customer })
            });
            const initData = await initRes.json();
            console.log("Init payment data:", initData);
            if (initData.status !== "success") return notify("Failed to initialize payment.");
            checkoutModal.classList.remove("active");

            const handler = PaystackPop.setup({
                key: initData.publicKey,
                email: customer.email,
                amount: totalAmount * 100,
                ref: initData.reference,
                onClose: () => notify("Payment canceled."),
                callback: async function (response) {
                    console.log("Payment callback:", response);
                    try {
                        const verifyRes = await fetch(`${BACKEND_URL}/api/verify-payment?reference=${response.reference}`);
                        const verifyData = await verifyRes.json();
                        console.log("Verify data:", verifyData);
                        if (verifyData.status === "success") {
                            notify("Payment verified and order saved!");
                            cart = []; updateCart();
                        } else notify("Payment verification failed.");
                    } catch (err) { console.error(err); notify("Verification failed."); }
                }
            });
            handler.openIframe();
        } catch (err) { console.error(err); notify("Checkout failed."); }
    });

    renderProducts(); updateCart();
});
