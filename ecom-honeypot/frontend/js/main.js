// Global variables
let currentUser = null;
let currentToken = null;
let sessionId = localStorage.getItem('sessionId') || null;

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing app...');

    // Initialize the app
    initializeApp();
});

function initializeApp() {
    // Set up event listeners
    setupEventListeners();

    // Update UI based on auth state
    updateAuthUI();

    // Load products
    loadProducts();

    // Update cart count
    updateCartCount();
}

function setupEventListeners() {
    console.log('Setting up event listeners...');

    // Login button
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            openLoginModal();
        });
    }

    // Cart button
    const cartBtn = document.getElementById('cart-btn');
    if (cartBtn) {
        cartBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = '/cart.html';
        });
    }

    // Modal close buttons
    const closeButtons = document.querySelectorAll('.close');
    closeButtons.forEach(button => {
        button.addEventListener('click', closeAllModals);
    });

    // Close modals when clicking outside
    window.addEventListener('click', function(event) {
        const loginModal = document.getElementById('login-modal');
        const registerModal = document.getElementById('register-modal');

        if (event.target === loginModal) {
            closeAllModals();
        }
        if (event.target === registerModal) {
            closeAllModals();
        }
    });

    // Switch between login and register
    const showRegister = document.getElementById('show-register');
    const showLogin = document.getElementById('show-login');

    if (showRegister) {
        showRegister.addEventListener('click', function(e) {
            e.preventDefault();
            switchToRegister();
        });
    }

    if (showLogin) {
        showLogin.addEventListener('click', function(e) {
            e.preventDefault();
            switchToLogin();
        });
    }

    // Form submissions
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    // Search functionality
    const searchButton = document.getElementById('search-button');
    const searchInput = document.getElementById('search-input');

    if (searchButton) {
        searchButton.addEventListener('click', handleSearch);
    }

    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleSearch();
            }
        });
    }

    console.log('Event listeners set up successfully');
}

// Modal functions
function openLoginModal() {
    console.log('Opening login modal');
    const modal = document.getElementById('login-modal');
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeAllModals() {
    console.log('Closing all modals');
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.style.display = 'none';
    });
}

function switchToRegister() {
    console.log('Switching to register modal');
    const loginModal = document.getElementById('login-modal');
    const registerModal = document.getElementById('register-modal');

    if (loginModal) loginModal.style.display = 'none';
    if (registerModal) registerModal.style.display = 'block';
}

function switchToLogin() {
    console.log('Switching to login modal');
    const loginModal = document.getElementById('login-modal');
    const registerModal = document.getElementById('register-modal');

    if (registerModal) registerModal.style.display = 'none';
    if (loginModal) loginModal.style.display = 'block';
}

// Auth functions
async function handleLogin(e) {
    e.preventDefault();
    console.log('Handling login');

    const email = document.getElementById('email')?.value;
    const password = document.getElementById('password')?.value;

    if (!email || !password) {
        alert('Please fill in all fields');
        return;
    }

    try {
        const response = await fetch('/api/users/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        console.log('Login response:', data);

        if (response.ok) {
            // Store token and user data
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data));

            // If user was using guest cart, we might want to merge carts
            // For now, we'll just clear the guest session
            if (sessionId) {
                localStorage.removeItem('sessionId');
                sessionId = null;
            }

            // Update UI
            currentUser = data;
            currentToken = data.token;
            updateAuthUI();

            // Close modal and show success
            closeAllModals();
            showMessage('Login successful!', 'success');

            // Update cart count after login
            setTimeout(updateCartCount, 500);
        } else {
            showMessage(data.message || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showMessage('An error occurred during login', 'error');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    console.log('Handling registration');

    const firstName = document.getElementById('first-name')?.value;
    const lastName = document.getElementById('last-name')?.value;
    const username = document.getElementById('reg-username')?.value;
    const email = document.getElementById('reg-email')?.value;
    const password = document.getElementById('reg-password')?.value;

    if (!firstName || !lastName || !username || !email || !password) {
        alert('Please fill in all fields');
        return;
    }

    try {
        const response = await fetch('/api/users/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ firstName, lastName, username, email, password })
        });

        const data = await response.json();
        console.log('Register response:', data);

        if (response.ok) {
            showMessage('Registration successful! Please login.', 'success');
            switchToLogin();
        } else {
            showMessage(data.message || 'Registration failed', 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showMessage('An error occurred during registration', 'error');
    }
}

function updateAuthUI() {
    console.log('Updating auth UI');
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const loginBtn = document.getElementById('login-btn');

    if (token && user.username && loginBtn) {
        loginBtn.innerHTML = `<i class="fas fa-user"></i> ${user.username}`;
        loginBtn.onclick = function(e) {
            e.preventDefault();
            window.location.href = '/profile.html';
        };
    } else if (loginBtn) {
        loginBtn.innerHTML = '<i class="fas fa-user"></i> Login';
        loginBtn.onclick = function(e) {
            e.preventDefault();
            openLoginModal();
        };
    }
}

// Product functions
async function loadProducts(searchTerm = '') {
    console.log('Loading products');
    const container = document.getElementById('products-container');

    if (!container) {
        console.error('Products container not found');
        return;
    }

    try {
        container.innerHTML = '<div class="loading">Loading products...</div>';

        let url = '/api/products';
        if (searchTerm) {
            url += `?keyword=${encodeURIComponent(searchTerm)}`;
        }

        const response = await fetch(url);
        const data = await response.json();

        if (response.ok) {
            displayProducts(data.products || []);
        } else {
            container.innerHTML = '<div class="loading">Failed to load products</div>';
        }
    } catch (error) {
        console.error('Error loading products:', error);
        container.innerHTML = '<div class="loading">Error loading products</div>';
    }
}

function displayProducts(products) {
    console.log('Displaying products:', products);
    const container = document.getElementById('products-container');

    if (!container) {
        console.error('Products container not found');
        return;
    }

    if (!products || products.length === 0) {
        container.innerHTML = '<div class="loading">No products available</div>';
        return;
    }

    container.innerHTML = products.map(product => `
    <div class="product-card">
    <div class="product-image">
    <img src="${product.images && product.images[0] ? product.images[0] : 'https://via.placeholder.com/300x200?text=Product'}" alt="${product.name}">
    </div>
    <div class="product-info">
    <h3>${product.name}</h3>
    <p>${product.description}</p>
    <div class="product-price">$${parseFloat(product.price).toFixed(2)}</div>
    <div class="product-rating">
    <span class="rating">${'★'.repeat(Math.floor(product.ratingAverage || 0))}${'☆'.repeat(5 - Math.floor(product.ratingAverage || 0))}</span>
    <span class="rating-count">(${product.ratingCount || 0})</span>
    </div>
    <div class="product-actions">
    <button class="btn btn-outline" onclick="alert('View product details for: ${product.name}')">
    <i class="fas fa-eye"></i> View
    </button>
    <button class="btn btn-primary" onclick="handleAddToCart(${product.id})">
    <i class="fas fa-shopping-cart"></i> Add to Cart
    </button>
    </div>
    </div>
    </div>
    `).join('');
}

async function handleAddToCart(productId) {
    console.log('Adding to cart:', productId);
    const token = localStorage.getItem('token');

    // If not logged in and no session ID, create one
    if (!token && !sessionId) {
        sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('sessionId', sessionId);
        console.log('Created new session ID:', sessionId);
    }

    try {
        const headers = {
            'Content-Type': 'application/json',
        };

        // Add authorization or session ID
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
            console.log('Using token for cart operation');
        } else if (sessionId) {
            headers['x-session-id'] = sessionId;
            console.log('Using session ID for cart operation:', sessionId);
        }

        const response = await fetch('/api/cart', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                productId: productId,
                quantity: 1
            })
        });

        const data = await response.json();
        console.log('Add to cart response:', data);

        if (response.ok) {
            // Update session ID if provided
            if (data.sessionId) {
                sessionId = data.sessionId;
                localStorage.setItem('sessionId', sessionId);
                console.log('Updated session ID:', sessionId);
            }

            updateCartCount();
            showMessage('Item added to cart!', 'success');
        } else {
            showMessage(data.message || 'Failed to add item to cart', 'error');
        }
    } catch (error) {
        console.error('Add to cart error:', error);
        showMessage('An error occurred while adding to cart', 'error');
    }
}

async function updateCartCount() {
    console.log('Updating cart count');
    const token = localStorage.getItem('token');
    const cartCount = document.querySelector('.cart-count');

    if (!cartCount) {
        console.error('Cart count element not found');
        return;
    }

    try {
        const headers = {};

        // Add authorization or session ID
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
            console.log('Fetching cart count with token');
        } else if (sessionId) {
            headers['x-session-id'] = sessionId;
            console.log('Fetching cart count with session ID:', sessionId);
        } else {
            console.log('No auth or session, setting cart count to 0');
            cartCount.textContent = '0';
            cartCount.style.display = 'none';
            return;
        }

        const response = await fetch('/api/cart', {
            headers: headers
        });

        const data = await response.json();
        console.log('Cart count response:', data);

        if (response.ok) {
            const itemCount = data.cartItems ? data.cartItems.reduce((total, item) => total + (item.quantity || 0), 0) : 0;
            cartCount.textContent = itemCount;
            cartCount.style.display = itemCount > 0 ? 'inline' : 'none';
            console.log('Cart count updated to:', itemCount);
        } else {
            console.error('Failed to get cart count:', data.message);
            cartCount.textContent = '0';
            cartCount.style.display = 'none';
        }
    } catch (error) {
        console.error('Update cart count error:', error);
        cartCount.textContent = '0';
        cartCount.style.display = 'none';
    }
}

function handleSearch() {
    const searchInput = document.getElementById('search-input');
    const searchTerm = searchInput ? searchInput.value.trim() : '';
    loadProducts(searchTerm);
}

// Show Message Function
function showMessage(message, type = 'info') {
    // Remove any existing messages
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());

    // Create message element
    const messageEl = document.createElement('div');
    messageEl.className = `message message-${type}`;
    messageEl.textContent = message;

    // Add styles
    messageEl.style.position = 'fixed';
    messageEl.style.top = '20px';
    messageEl.style.right = '20px';
    messageEl.style.padding = '15px 20px';
    messageEl.style.borderRadius = '8px';
    messageEl.style.color = 'white';
    messageEl.style.fontWeight = '600';
    messageEl.style.zIndex = '9999';
    messageEl.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    messageEl.style.animation = 'slideInRight 0.3s ease';

    // Set colors based on type
    switch(type) {
        case 'success':
            messageEl.style.backgroundColor = '#10b981';
            break;
        case 'error':
            messageEl.style.backgroundColor = '#ef4444';
            break;
        case 'warning':
            messageEl.style.backgroundColor = '#f59e0b';
            break;
        default:
            messageEl.style.backgroundColor = '#3b82f6';
    }

    // Add to document
    document.body.appendChild(messageEl);

    // Remove after 3 seconds
    setTimeout(() => {
        if (messageEl.parentNode) {
            messageEl.parentNode.removeChild(messageEl);
        }
    }, 3000);
}

// Make functions globally available for inline onclick handlers
window.handleAddToCart = handleAddToCart;
