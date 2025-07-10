 document.addEventListener('DOMContentLoaded', function() {
            // Sample Nigerian products data
            const products = [
                {
                    id: 1,
                    name: "Adire Fabric",
                    description: "Traditional Yoruba tie-dye fabric, perfect for making unique clothing.",
                    price: 4500,
                    image: "https://img001.prntscr.com/file/img001/M9zSmJz-RQKMODRAYvke-g.jpg"
                },
                {
                    id: 2,
                    name: "Ofada Rice",
                    description: "Locally grown aromatic rice, known for its unique taste and texture.",
                    price: 3500,
                    image: "https://togajkitchen.com/wp-content/uploads/2021/11/ofada-rice-togaj-kitchen.jpg"
                },
                {
                    id: 3,
                    name: "Shea Butter",
                    description: "Pure, unrefined shea butter from Northern Nigeria, great for skin and hair.",
                    price: 2500,
                    image: "https://img001.prntscr.com/file/img001/mrHQLIqrQnOQn6cjE1edbw.jpg"
                },
                {
                    id: 4,
                    name: "Akara Beans",
                    description: "Premium brown beans perfect for making akara (bean cakes).",
                    price: 1800,
                    image: "https://img001.prntscr.com/file/img001/zIx5LPstTIWgRpTvXLeW2A.jpg"
                },
                {
                    id: 5,
                    name: "Palm Oil",
                    description: "100% pure red palm oil, rich in vitamins and antioxidants.",
                    price: 2000,
                    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTI4TRpyEhD0JtnIwE1AGDPu0Jfx-L2iKayjQ&s"
                },
                {
                    id: 6,
                    name: "Kente Cloth",
                    description: "Handwoven kente cloth from Southwestern Nigeria.",
                    price: 7500,
                    image: "https://img001.prntscr.com/file/img001/H6CdDsQITJCgWWyxd27UJQ.jpg"
                },
                {
                    id: 7,
                    name: "Suya Spice Mix",
                    description: "Authentic suya spice blend for making Nigerian grilled meat.",
                    price: 1500,
                    image: "https://www.chefspencil.com/wp-content/uploads/Suya-1.jpg"
                },
                {
                    id: 8,
                    name: "Bitter Leaf",
                    description: "Dried bitter leaf for making traditional Nigerian soups.",
                    price: 1200,
                    image: "https://img001.prntscr.com/file/img001/XJlAs3_GQG69recaRCGnqQ.jpg"
                }
            ];

            // Cart state
            let cart = [];
            
            // DOM elements
            const productsContainer = document.getElementById('products-container');
            const cartIcon = document.getElementById('cart-icon');
            const cartCount = document.getElementById('cart-count');
            const cartOverlay = document.getElementById('cart-overlay');
            const closeCart = document.getElementById('close-cart');
            const cartItems = document.getElementById('cart-items');
            const cartTotal = document.getElementById('cart-total');
            const checkoutBtn = document.getElementById('checkout-btn');
            
            // Render products
            function renderProducts() {
                productsContainer.innerHTML = '';
                
                products.forEach(product => {
                    const productCard = document.createElement('div');
                    productCard.className = 'product-card';
                    productCard.innerHTML = `
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
                    
                    productsContainer.appendChild(productCard);
                });
                
                // Add event listeners to add to cart buttons
                document.querySelectorAll('.add-to-cart').forEach(button => {
                    button.addEventListener('click', addToCart);
                });
            }
            
            // Add to cart function
            function addToCart(e) {
                const productId = parseInt(e.target.getAttribute('data-id'));
                const product = products.find(p => p.id === productId);
                
                // Check if product already in cart
                const existingItem = cart.find(item => item.id === productId);
                
                if (existingItem) {
                    existingItem.quantity += 1;
                } else {
                    cart.push({
                        ...product,
                        quantity: 1
                    });
                }
                
                updateCart();
                
                // Show feedback
                e.target.textContent = 'Added!';
                e.target.style.backgroundColor = 'var(--secondary-color)';
                
                setTimeout(() => {
                    e.target.textContent = 'Add to Cart';
                    e.target.style.backgroundColor = 'var(--primary-color)';
                }, 1000);
            }
            
            // Update cart UI
            function updateCart() {
                // Update cart count
                const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
                cartCount.textContent = totalItems;
                
                // Update cart items
                if (cart.length === 0) {
                    cartItems.innerHTML = '<div class="empty-cart">Your cart is empty</div>';
                } else {
                    cartItems.innerHTML = '';
                    
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
                    
                    // Add event listeners to quantity buttons
                    document.querySelectorAll('.decrease').forEach(button => {
                        button.addEventListener('click', decreaseQuantity);
                    });
                    
                    document.querySelectorAll('.increase').forEach(button => {
                        button.addEventListener('click', increaseQuantity);
                    });
                    
                    document.querySelectorAll('.cart-item-remove').forEach(button => {
                        button.addEventListener('click', removeFromCart);
                    });
                }
                
                // Update cart total
                const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                cartTotal.textContent = `Total:  ₦${total.toLocaleString()}`;
            }
            
            // Decrease quantity
            function decreaseQuantity(e) {
                const productId = parseInt(e.target.getAttribute('data-id'));
                const item = cart.find(item => item.id === productId);
                
                if (item.quantity > 1) {
                    item.quantity -= 1;
                } else {
                    cart = cart.filter(item => item.id !== productId);
                }
                
                updateCart();
            }
            
            // Increase quantity
            function increaseQuantity(e) {
                const productId = parseInt(e.target.getAttribute('data-id'));
                const item = cart.find(item => item.id === productId);
                
                item.quantity += 1;
                updateCart();
            }
            
            // Remove from cart
            function removeFromCart(e) {
                const productId = parseInt(e.target.closest('button').getAttribute('data-id'));
                cart = cart.filter(item => item.id !== productId);
                updateCart();
            }
            
            // Checkout function
            function checkout() {
                if (cart.length === 0) {
                    alert('Your cart is empty!');
                    return;
                }
                
                alert(`Order placed! Total: ₦${cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString()}`);
                cart = [];
                updateCart();
                cartOverlay.classList.remove('active');
            }
            
            // Event listeners
            cartIcon.addEventListener('click', () => {
                cartOverlay.classList.add('active');
            });
            
            closeCart.addEventListener('click', () => {
                cartOverlay.classList.remove('active');
            });
            
            checkoutBtn.addEventListener('click', checkout);
            
            // Close cart when clicking outside
            cartOverlay.addEventListener('click', (e) => {
                if (e.target === cartOverlay) {
                    cartOverlay.classList.remove('active');
                }
            });
            
            // Initialize the app
            renderProducts();
            updateCart();
        });