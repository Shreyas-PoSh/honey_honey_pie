// Global variables
let currentUser = null;
let currentToken = null;

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Profile page loaded');

    // Initialize the profile page
    initializeProfile();
});

function initializeProfile() {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token || !user.username) {
        // Redirect to login if not logged in
        window.location.href = '/';
        return;
    }

    currentToken = token;
    currentUser = user;

    // Set up event listeners
    setupEventListeners();

    // Load user profile data
    loadUserProfile();

    // Load user orders
    loadUserOrders();

    // Update auth UI
    updateAuthUI();
}

function setupEventListeners() {
    console.log('Setting up profile event listeners');

    // Profile menu navigation
    const menuItems = document.querySelectorAll('.profile-menu-item');
    menuItems.forEach(item => {
        if (!item.id) { // Skip logout button
            item.addEventListener('click', function(e) {
                e.preventDefault();
                const tab = this.getAttribute('data-tab');
                showTab(tab);
            });
        }
    });

    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            handleLogout();
        });
    }

    // Profile form submission
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileUpdate);
    }

    // Change password button
    const changePasswordBtn = document.getElementById('change-password-btn');
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', handleChangePassword);
    }

    // Login button in header
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('Do you want to logout?')) {
                handleLogout();
            }
        });
    }
}

function updateAuthUI() {
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn && currentUser) {
        loginBtn.innerHTML = `<i class="fas fa-user"></i> ${currentUser.username}`;
    }
}

function showTab(tabName) {
    // Hide all tabs
    const tabs = document.querySelectorAll('.profile-tab');
    tabs.forEach(tab => {
        tab.classList.remove('active');
    });

    // Show selected tab
    const activeTab = document.getElementById(`${tabName}-tab`);
    if (activeTab) {
        activeTab.classList.add('active');
    }

    // Update menu active state
    const menuItems = document.querySelectorAll('.profile-menu-item');
    menuItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-tab') === tabName) {
            item.classList.add('active');
        }
    });
}

async function loadUserProfile() {
    console.log('Loading user profile');

    try {
        const response = await fetch('/api/users/profile', {
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            currentUser = data;
            displayUserProfile(data);
        } else {
            console.error('Failed to load profile:', data.message);
            if (data.message === 'Not authorized, token failed') {
                handleLogout();
            }
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

function displayUserProfile(user) {
    console.log('Displaying user profile:', user);

    // Update header info
    const profileName = document.getElementById('profile-name');
    const profileEmail = document.getElementById('profile-email');

    if (profileName) profileName.textContent = `${user.firstName} ${user.lastName}`;
    if (profileEmail) profileEmail.textContent = user.email;

    // Update form fields
    document.getElementById('first-name').value = user.firstName || '';
    document.getElementById('last-name').value = user.lastName || '';
    document.getElementById('username').value = user.username || '';
    document.getElementById('email').value = user.email || '';
    document.getElementById('phone').value = user.phone || '';
    document.getElementById('street').value = user.address?.street || '';
    document.getElementById('city').value = user.address?.city || '';
    document.getElementById('state').value = user.address?.state || '';
    document.getElementById('zipCode').value = user.address?.zipCode || '';
    document.getElementById('country').value = user.address?.country || '';
}

async function handleProfileUpdate(e) {
    e.preventDefault();
    console.log('Updating profile');

    const formData = new FormData(e.target);
    const userData = {};

    // Collect form data
    for (let [key, value] of formData.entries()) {
        if (key.includes('.')) {
            // Handle nested properties like address.street
            const parts = key.split('.');
            if (!userData[parts[0]]) userData[parts[0]] = {};
            userData[parts[0]][parts[1]] = value;
        } else {
            userData[key] = value;
        }
    }

    try {
        const response = await fetch('/api/users/profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}`
            },
            body: JSON.stringify(userData)
        });

        const data = await response.json();

        if (response.ok) {
            // Update local storage
            localStorage.setItem('user', JSON.stringify(data));
            currentUser = data;

            // Update UI
            displayUserProfile(data);
            updateAuthUI();

            alert('Profile updated successfully!');
        } else {
            alert(data.message || 'Failed to update profile');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        alert('An error occurred while updating profile');
    }
}

async function loadUserOrders() {
    console.log('Loading user orders');

    const container = document.getElementById('orders-container');
    if (!container) return;

    try {
        container.innerHTML = '<div class="loading">Loading your orders...</div>';

        const response = await fetch('/api/orders/myorders', {
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            displayUserOrders(data);
        } else {
            container.innerHTML = '<div class="loading">Failed to load orders</div>';
            if (data.message === 'Not authorized, token failed') {
                handleLogout();
            }
        }
    } catch (error) {
        console.error('Error loading orders:', error);
        container.innerHTML = '<div class="loading">Error loading orders</div>';
    }
}

function displayUserOrders(orders) {
    console.log('Displaying user orders:', orders);

    const container = document.getElementById('orders-container');
    if (!container) return;

    if (!orders || orders.length === 0) {
        container.innerHTML = `
        <div class="empty-orders">
        <i class="fas fa-shopping-bag fa-3x"></i>
        <h3>No Orders Yet</h3>
        <p>You haven't placed any orders yet.</p>
        <a href="/" class="btn btn-primary" style="margin-top: 20px;">Start Shopping</a>
        </div>
        `;
        return;
    }

    container.innerHTML = orders.map(order => `
    <div class="order-card">
    <div class="order-header">
    <div>
    <div class="order-id">Order #${order.id}</div>
    <div class="order-date">${new Date(order.createdAt).toLocaleDateString()}</div>
    </div>
    <div class="order-status ${order.isPaid ? 'paid' : 'pending'}">
    ${order.isPaid ? 'Paid' : 'Pending'}
    </div>
    </div>
    <div class="order-items">
    ${Array.isArray(order.items) ? order.items.map(item => `
        <div class="order-item">
        <span>${item.name || 'Product'} × ${item.quantity}</span>
        <span>$${(item.price * item.quantity).toFixed(2)}</span>
        </div>
        `).join('') : ''}
        </div>
        <div class="order-total">
        Total: $${parseFloat(order.totalPrice || 0).toFixed(2)}
        </div>
        </div>
        `).join('');
}

async function handleChangePassword() {
    console.log('Changing password');

    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (!currentPassword || !newPassword || !confirmPassword) {
        alert('Please fill in all password fields');
        return;
    }

    if (newPassword !== confirmPassword) {
        alert('New passwords do not match');
        return;
    }

    if (newPassword.length < 6) {
        alert('Password must be at least 6 characters');
        return;
    }

    try {
        const response = await fetch('/api/users/profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}`
            },
            body: JSON.stringify({
                password: newPassword,
                currentPassword: currentPassword
            })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Password changed successfully!');
            // Clear password fields
            document.getElementById('current-password').value = '';
            document.getElementById('new-password').value = '';
            document.getElementById('confirm-password').value = '';
        } else {
            alert(data.message || 'Failed to change password');
        }
    } catch (error) {
        console.error('Error changing password:', error);
        alert('An error occurred while changing password');
    }
}

function handleLogout() {
    console.log('Handling logout');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    currentUser = null;
    currentToken = null;
    window.location.href = '/';
}
