document.addEventListener('DOMContentLoaded', function() {
    // ---------- CONFIG ----------
    const BACKEND_URL = 'https://your-backend-service.onrender.com'; // Replace with your Render backend URL

    const products = [
        { id: 1, name: "Adire Fabric", description: "Traditional Yoruba tie-dye fabric, perfect for making unique clothing.", price: 4500, image: "https://img001.prntscr.com/file/img001/M9zSmJz-RQKMODRAYvke-g.jpg" },
        { id: 2, name: "Ofada Rice", description: "Locally grown aromatic rice, known for its unique taste and texture.", price: 3500, image: "https://img001.prntscr.com/file/img001/ZLlbltDlRBGFdG7wKFp-GA.jpg" },
        { id: 3, name: "Shea Butter", description: "Pure, unrefined shea butter from Northern Nigeria, great for skin and hair.", price: 2500, image: "https://img001.prntscr.com/file/img001/mrHQLIqrQnOQn6cjE1edbw.jpg" },
        { id: 4, name: "Akara Beans", description: "Premium brown beans perfect for making akara (bean cakes).", price: 1800, image: "https://img001.prntscr.com/file/img001/zIx5LPstTIWgRpTvXLeW2A.jpg" },
        { id: 5, name: "Palm Oil", description: "100% pure red palm oil, rich in vitamins and antioxidants.", price: 2000, image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTI4TRpyEhD0JtnIwE1AGDPu0Jfx-L2iKayjQ&s" },
        { id: 6, name: "Kente Cloth", description: "Handwoven kente cloth from Southwestern Nigeria.", price: 7500, image: "https://img001.prntscr.com/file/img001/H6CdDsQITJCgWWyxd27UJQ.jpg" },
        { id: 7, name: "Suya Spice Mix", description: "Authentic suya spice blend for making Nigerian grilled meat.", price: 1500, image: "https://www.chefspencil.com/wp-content/uploads/Suya-1.jpg" },
        { id: 8, name: "Bitter Leaf", description: "Dried bitter leaf for making traditional Nigerian soups.", price: 1200, image: "https://img001.prntscr.com/file/img001/XJlAs3_GQG69recaRCGnqQ.jpg" }
    ];

    let cart = [];

    // ---------- DOM ELEMENTS ----------
    const productsContainer = document.getElementById('products-container');
    const cartIcon = document.getElementById('cart-icon');
    const cartCount = document.getElementById('cart-count');
    const cartOverlay = document.getElementById('cart-overlay');
    const closeCart = document.getElementById('close-cart');
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    const checkoutBtn = document.getElementById('checkout-btn');
    const paymentSuccessOverlay = document.getElementById('payment-success-overlay');
    const closeSuccessBtn = document.getElementById('close-success-btn');

    // ---------- RENDER PRODUCTS ----------
    function renderProducts() {
        productsContainer.innerHTML = '';

        products.forEach(product => {
            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
                <img src="${product.image}" alt="${product.name}" class="product-image">
                <div class="product-info">
                    <h3 class="product-title">${product.name}</h3>
                    <p class="product-description">${product.description}</p>
                    <div class="product-footer">
                        <span class="product-price">₦${product.price.toLocaleString()}</span>
                        <button class="add-to-cart" data-id="${product.id}">Add to Cart</button>
                    </div>
                </div>
            `;
            productsContainer.appendChild(card);
        });

        document.querySelectorAll('.add-to-cart').forEach(button => {
            button.addEventListener('click', addToCart);
        });
    }

    function addToCart(e) {
        const productId = parseInt(e.target.dataset.id);
        const product = products.find(p => p.id === productId);
        const existing = cart.find(item => item.id === productId);

        if (existing) existing.quantity += 1;
        else cart.push({ ...product, quantity: 1 });

        updateCart();

        e.target.textContent = 'Added!';
        e.target.style.backgroundColor = 'var(--secondary-color)';
        setTimeout(() => {
            e.target.textContent = 'Add to Cart';
            e.target.style.backgroundColor = 'var(--primary-color)';
        }, 1000);
    }

    function updateCart() {
        cartCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartItems.innerHTML = cart.length === 0 ? '<div class="empty-cart">Your cart is empty</div>' : '';

        cart.forEach(item => {
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                <div class="cart-item-details">
                    <h4 class="cart-item-title">${item.name}</h4>
                    <p class="cart-item-price">₦${item.price.toLocaleString()}</p>
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
            cartItems.appendChild(cartItem);
        });

        document.querySelectorAll('.decrease').forEach(btn => btn.addEventListener('click', decreaseQuantity));
        document.querySelectorAll('.increase').forEach(btn => btn.addEventListener('click', increaseQuantity));
        document.querySelectorAll('.cart-item-remove').forEach(btn => btn.addEventListener('click', removeFromCart));

        const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        cartTotal.textContent = `Total: ₦${total.toLocaleString()}`;
    }

    function decreaseQuantity(e) {
        const id = parseInt(e.target.dataset.id);
        const item = cart.find(i => i.id === id);
        if (item.quantity > 1) item.quantity -= 1;
        else cart = cart.filter(i => i.id !== id);
        updateCart();
    }

    function increaseQuantity(e) {
        const id = parseInt(e.target.dataset.id);
        const item = cart.find(i => i.id === id);
        item.quantity += 1;
        updateCart();
    }

    function removeFromCart(e) {
        const id = parseInt(e.target.dataset.id);
        cart = cart.filter(i => i.id !== id);
        updateCart();
    }

    // ---------- CHECKOUT ----------
    async function checkout() {
        if (cart.length === 0) return alert('Your cart is empty!');

        const email = prompt('Enter your email for payment confirmation:');
        if (!email) return alert('Email is required!');

        const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

        try {
            const res = await fetch(`${BACKEND_URL}/api/checkout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cart, totalAmount, email })
            });
            const data = await res.json();

            if (data.status === 'success') {
                window.open(data.paymentUrl, '_blank');
                cart = []; 
                updateCart();

                paymentSuccessOverlay.style.display = 'flex';
            } else {
                alert('Payment initialization failed.');
            }
        } catch (err) {
            console.error(err);
            alert('Checkout failed. Try again.');
        }
    }

    // ---------- EVENT LISTENERS ----------
    cartIcon.addEventListener('click', () => cartOverlay.classList.add('active'));
    closeCart.addEventListener('click', () => cartOverlay.classList.remove('active'));
    checkoutBtn.addEventListener('click', checkout);
    closeSuccessBtn.addEventListener('click', () => paymentSuccessOverlay.style.display = 'none');
    cartOverlay.addEventListener('click', (e) => { if (e.target === cartOverlay) cartOverlay.classList.remove('active'); });

    renderProducts();
    updateCart();
});
