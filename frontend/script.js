document.addEventListener('DOMContentLoaded', function() {
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
    const BACKEND_URL = 'https://your-render-backend.onrender.com'; // replace with your backend

    const productsContainer = document.getElementById('products-container');
    const cartIcon = document.getElementById('cart-icon');
    const cartCount = document.getElementById('cart-count');
    const cartOverlay = document.getElementById('cart-overlay');
    const closeCart = document.getElementById('close-cart');
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    const checkoutBtn = document.getElementById('checkout-btn');

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
        document.querySelectorAll('.add-to-cart').forEach(btn => btn.addEventListener('click', addToCart));
    }

    function addToCart(e) {
        const id = parseInt(e.target.getAttribute('data-id'));
        const product = products.find(p => p.id === id);
        const existing = cart.find(i => i.id === id);
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
        cartCount.textContent = cart.reduce((t,i)=>t+i.quantity,0);
        if (!cart.length) cartItems.innerHTML = '<div class="empty-cart">Your cart is empty</div>';
        else {
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
                    <button class="cart-item-remove" data-id="${item.id}"><i class="fas fa-trash"></i></button>
                `;
                cartItems.appendChild(div);
            });
            document.querySelectorAll('.decrease').forEach(b => b.addEventListener('click', decreaseQuantity));
            document.querySelectorAll('.increase').forEach(b => b.addEventListener('click', increaseQuantity));
            document.querySelectorAll('.cart-item-remove').forEach(b => b.addEventListener('click', removeFromCart));
        }
        const total = cart.reduce((t,i)=>t+i.price*i.quantity,0);
        cartTotal.textContent = `Total: ₦${total.toLocaleString()}`;
    }

    function decreaseQuantity(e) {
        const id = parseInt(e.target.getAttribute('data-id'));
        const item = cart.find(i=>i.id===id);
        if(item.quantity>1) item.quantity-=1;
        else cart=cart.filter(i=>i.id!==id);
        updateCart();
    }
    function increaseQuantity(e) { const id=parseInt(e.target.getAttribute('data-id')); cart.find(i=>i.id===id).quantity+=1; updateCart(); }
    function removeFromCart(e) { const id=parseInt(e.target.closest('button').getAttribute('data-id')); cart=cart.filter(i=>i.id!==id); updateCart(); }

    async function checkout() {
        if(!cart.length) return alert('Cart is empty!');
        const email = prompt('Enter your email for order confirmation:');
        if(!email) return alert('Email required');
        const totalAmount = cart.reduce((t,i)=>t+i.price*i.quantity,0);

        try {
            const res = await fetch(`${BACKEND_URL}/api/checkout`, {
                method:'POST', headers:{'Content-Type':'application/json'}, 
                body: JSON.stringify({cart,totalAmount,email})
            });
            const data = await res.json();
            if(data.status==='success') {
                cart = []; updateCart();
                // Redirect to Paystack
                window.location.href = data.paymentUrl;
            } else alert('Error: '+data.message);
        } catch(err) { console.error(err); alert('Server error'); }
    }

    cartIcon.addEventListener('click',()=>cartOverlay.classList.add('active'));
    closeCart.addEventListener('click',()=>cartOverlay.classList.remove('active'));
    cartOverlay.addEventListener('click',(e)=>{if(e.target===cartOverlay) cartOverlay.classList.remove('active')});
    checkoutBtn.addEventListener('click',checkout);

    renderProducts();
    updateCart();
});
