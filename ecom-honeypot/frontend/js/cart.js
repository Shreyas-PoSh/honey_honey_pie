// Global variables
let currentUser = null;
let currentToken = null;
let cartItems = [];
let sessionId = localStorage.getItem('sessionId') || null;

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Cart page loaded');
    console.log('Session ID from localStorage:', sessionId);

    // Initialize the cart page
    initializeCart();
});

function initializeCart() {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (token && user.username) {
        currentToken = token;
        currentUser = user;
        console.log('User logged in:', user.username);
        updateAuthUI();
    } else {
        console.log('No user logged in, using session ID:', sessionId);
    }

    // Set up event listeners
    setupEventListeners();

    // Load cart items
    loadCartItems();
}

function setupEventListeners() {
    console.log('Setting up cart event listeners');

    // Login button in header
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        if (currentToken && currentUser) {
            loginBtn.innerHTML = `<i class="fas fa-user"></i> ${currentUser.username}`;
            loginBtn.onclick = function(e) {
                e.preventDefault();
                window.location.href = '/profile.html';
            };
        } else {
            loginBtn.innerHTML = '<i class="fas fa-user"></i> Login';
            loginBtn.onclick = function(e) {
                e.preventDefault();
                window.location.href = '/';
            };
        }
    }

    // Checkout button
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', handleCheckout);
    }
}

function updateAuthUI() {
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn && currentUser) {
        loginBtn.innerHTML = `<i class="fas fa-user"></i> ${currentUser.username}`;
    }
}

async function loadCartItems() {
    console.log('Loading cart items');
    console.log('Current token:', currentToken);
    console.log('Current session ID:', sessionId);

    const container = document.getElementById('cart-items-container');
    if (!container) {
        console.error('Cart items container not found');
        return;
    }

    try {
        container.innerHTML = '<div class="loading">Loading cart items...</div>';

        const headers = {};
        let authMethod = 'none';

        // Add authorization or session ID
        if (currentToken) {
            headers['Authorization'] = `Bearer ${currentToken}`;
            authMethod = 'token';
        } else if (sessionId) {
            headers['x-session-id'] = sessionId;
            authMethod = 'session';
        } else {
            console.log('No authentication method available');
            container.innerHTML = `
            <div class="empty-cart">
            <i class="fas fa-shopping-cart fa-3x"></i>
            <h3>Your Cart is Empty</h3>
            <p>Looks like you haven't added any items to your cart yet.</p>
            <a href="/" class="btn btn-primary" style="margin-top: 20px;">Continue Shopping</a>
            </div>
            `;
            updateHeaderCartCount();
            return;
        }

        console.log('Fetching cart with', authMethod, 'method');

        const response = await fetch('/api/cart', {
            headers: headers
        });

        const data = await response.json();
        console.log('Cart items response:', data);

        if (response.ok) {
            cartItems = data.cartItems || [];
            displayCartItems(cartItems);
            updateCartSummary(cartItems);
            updateHeaderCartCount();
        } else {
            console.error('Failed to load cart items:', data.message);
            container.innerHTML = '<div class="loading">Failed to load cart items: ' + (data.message || '') + '</div>';
        }
    } catch (error) {
        console.error('Error loading cart items:', error);
        container.innerHTML = '<div class="loading">Error loading cart items: ' + error.message + '</div>';
    }
}

function displayCartItems(items) {
    console.log('Displaying cart items:', items);

    const container = document.getElementById('cart-items-container');
    if (!container) {
        console.error('Cart items container not found');
        return;
    }

    if (!items || items.length === 0) {
        container.innerHTML = `
        <div class="empty-cart">
        <i class="fas fa-shopping-cart fa-3x"></i>
        <h3>Your Cart is Empty</h3>
        <p>Looks like you haven't added any items to your cart yet.</p>
        <a href="/" class="btn btn-primary" style="margin-top: 20px;">Continue Shopping</a>
        </div>
        `;
        updateHeaderCartCount();
        return;
    }

    container.innerHTML = items.map(item => `
    <div class="cart-item" data-product-id="${item.productId}">
    <div class="cart-item-image">
    <img src="${item.image || 'https://via.placeholder.com/100x100?text=Product'}" alt="${item.name}">
    </div>
    <div class="cart-item-details">
    <div class="cart-item-name">${item.name}</div>
    <div class="cart-item-price">$${parseFloat(item.price).toFixed(2)}</div>
    <div class="cart-item-quantity">
    <div class="quantity-control">
    <button class="quantity-btn minus-btn" onclick="updateQuantity(${item.productId}, -1)">-</button>
    <input type="number" class="quantity-input" value="${item.quantity}" min="1" onchange="updateQuantity(${item.productId}, 0, this.value)">
    <button class="quantity-btn plus-btn" onclick="updateQuantity(${item.productId}, 1)">+</button>
    </div>
    </div>
    </div>
    <div class="cart-item-actions">
    <button class="remove-btn" onclick="removeFromCart(${item.productId})">
    <i class="fas fa-trash"></i> Remove
    </button>
    </div>
    </div>
    `).join('');

    updateHeaderCartCount();
}

function updateCartSummary(items) {
    console.log('Updating cart summary:', items);

    const subtotal = items.reduce((total, item) => total + (item.price * item.quantity), 0);
    const shipping = 0; // Free shipping
    const tax = subtotal * 0.08; // 8% tax
    const total = subtotal + shipping + tax;

    // Update summary elements
    const subtotalEl = document.getElementById('subtotal');
    const shippingEl = document.getElementById('shipping');
    const taxEl = document.getElementById('tax');
    const totalEl = document.getElementById('total');

    if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
    if (shippingEl) shippingEl.textContent = shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`;
    if (taxEl) taxEl.textContent = `$${tax.toFixed(2)}`;
    if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
}

async function updateQuantity(productId, change, newValue = null) {
    console.log('Updating quantity:', productId, change, newValue);

    let newQuantity;
    if (newValue !== null) {
        newQuantity = parseInt(newValue);
    } else {
        const currentItem = cartItems.find(item => item.productId === productId);
        if (!currentItem) return;
        newQuantity = currentItem.quantity + change;
    }

    if (newQuantity < 1) newQuantity = 1;

    try {
        const headers = {
            'Content-Type': 'application/json'
        };

        if (currentToken) {
            headers['Authorization'] = `Bearer ${currentToken}`;
        } else if (sessionId) {
            headers['x-session-id'] = sessionId;
        }

        const response = await fetch(`/api/cart/${productId}`, {
            method: 'PUT',
            headers: headers,
            body: JSON.stringify({ quantity: newQuantity })
        });

        const data = await response.json();

        if (response.ok) {
            cartItems = data.cartItems || [];
            displayCartItems(cartItems);
            updateCartSummary(cartItems);
        } else {
            alert(data.message || 'Failed to update quantity');
        }
    } catch (error) {
        console.error('Error updating quantity:', error);
        alert('An error occurred while updating quantity');
    }
}

async function removeFromCart(productId) {
    console.log('Removing from cart:', productId);

    if (!confirm('Are you sure you want to remove this item from your cart?')) {
        return;
    }

    try {
        const headers = {};
        if (currentToken) {
            headers['Authorization'] = `Bearer ${currentToken}`;
        } else if (sessionId) {
            headers['x-session-id'] = sessionId;
        }

        const response = await fetch(`/api/cart/${productId}`, {
            method: 'DELETE',
            headers: headers
        });

        const data = await response.json();

        if (response.ok) {
            cartItems = data.cartItems || [];
            displayCartItems(cartItems);
            updateCartSummary(cartItems);

            // Update cart count in header
            updateHeaderCartCount();
        } else {
            alert(data.message || 'Failed to remove item from cart');
        }
    } catch (error) {
        console.error('Error removing from cart:', error);
        alert('An error occurred while removing item from cart');
    }
}

async function updateHeaderCartCount() {
    console.log('Updating header cart count');

    const cartCount = document.querySelector('.cart-count');
    if (!cartCount) {
        console.error('Cart count element not found');
        return;
    }

    try {
        const headers = {};
        if (currentToken) {
            headers['Authorization'] = `Bearer ${currentToken}`;
        } else if (sessionId) {
            headers['x-session-id'] = sessionId;
        } else {
            cartCount.textContent = '0';
            cartCount.style.display = 'none';
            return;
        }

        const response = await fetch('/api/cart', {
            headers: headers
        });

        const data = await response.json();

        if (response.ok) {
            const itemCount = data.cartItems ? data.cartItems.reduce((total, item) => total + (item.quantity || 0), 0) : 0;
            cartCount.textContent = itemCount;
            cartCount.style.display = itemCount > 0 ? 'inline' : 'none';
            console.log('Header cart count updated to:', itemCount);
        } else {
            console.error('Failed to update header cart count:', data.message);
            cartCount.textContent = '0';
            cartCount.style.display = 'none';
        }
    } catch (error) {
        console.error('Update header cart count error:', error);
        cartCount.textContent = '0';
        cartCount.style.display = 'none';
    }
}

function handleCheckout() {
    console.log('Handling checkout');

    if (!currentToken) {
        if (confirm('You need to login to checkout. Would you like to login now?')) {
            window.location.href = '/';
        }
        return;
    }

    if (cartItems.length === 0) {
        alert('Your cart is empty!');
        return;
    }

    alert('Checkout functionality would go here.\nIn a real implementation, this would redirect to a payment page.');
}

// Make functions globally available
window.updateQuantity = updateQuantity;
window.removeFromCart = removeFromCart;
