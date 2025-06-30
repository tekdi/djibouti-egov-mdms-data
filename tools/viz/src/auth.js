/**
 * Shared Authentication Module for DIGIT Visualization Tools
 * Provides OAuth login, token management, and authenticated API calls
 */

// OAuth Configuration
const AUTH_CONFIG = {
    API_BASE: '/api',
    LOGIN_URL: '/api/user/oauth/token',
    TENANT_ID: 'dj',
    USER_TYPE: 'EMPLOYEE',
    CLIENT_AUTH: 'Basic ZWdvdi11c2VyLWNsaWVudDo='
};

// Auth state management
class AuthManager {
    constructor() {
        this.accessToken = localStorage.getItem('egov_token');
        this.userInfo = JSON.parse(localStorage.getItem('egov_userInfo') || 'null');
        this.onAuthChange = null; // Callback for auth state changes
    }

    // Check if user is authenticated
    isAuthenticated() {
        return !!(this.accessToken && this.userInfo);
    }

    // Get current user info
    getUserInfo() {
        return this.userInfo;
    }

    // Get access token
    getAccessToken() {
        return this.accessToken;
    }

    // Set auth change callback
    setAuthChangeCallback(callback) {
        this.onAuthChange = callback;
    }

    // Login with username/OTP
    async login(username, otp) {
        const loginPayload = {
            username: username,
            password: otp,
            grant_type: 'password',
            scope: 'read',
            tenantId: AUTH_CONFIG.TENANT_ID,
            userType: AUTH_CONFIG.USER_TYPE
        };

        const response = await fetch(AUTH_CONFIG.LOGIN_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': AUTH_CONFIG.CLIENT_AUTH
            },
            body: new URLSearchParams(loginPayload)
        });

        if (!response.ok) {
            throw new Error('Login failed. Please check your credentials.');
        }

        const data = await response.json();
        this.accessToken = data.access_token;
        this.userInfo = data.UserRequest;

        // Store in localStorage for persistence
        localStorage.setItem('egov_token', this.accessToken);
        localStorage.setItem('egov_userInfo', JSON.stringify(this.userInfo));

        // Notify auth change
        if (this.onAuthChange) {
            this.onAuthChange(true, this.userInfo);
        }

        return { token: this.accessToken, user: this.userInfo };
    }

    // Logout and clear stored data
    logout() {
        // Clear stored data
        localStorage.removeItem('egov_token');
        localStorage.removeItem('egov_userInfo');
        this.accessToken = null;
        this.userInfo = null;

        // Notify auth change
        if (this.onAuthChange) {
            this.onAuthChange(false, null);
        }
    }

    // Make authenticated API call
    async makeApiCall(endpoint, data) {
        if (!this.accessToken) {
            throw new Error('Not authenticated. Please login.');
        }

        const response = await fetch(AUTH_CONFIG.API_BASE + endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json, text/plain, */*'
            },
            body: JSON.stringify({
                ...data,
                RequestInfo: {
                    apiId: "Rainmaker",
                    authToken: this.accessToken,
                    userInfo: this.userInfo
                }
            })
        });

        if (response.status === 401 || response.status === 403) {
            // Token expired or invalid - logout
            this.logout();
            throw new Error('Session expired. Please login again.');
        }

        if (!response.ok) {
            throw new Error(`API call failed: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    }
}

// UI Components for Login
class AuthUI {
    constructor(authManager) {
        this.authManager = authManager;
        this.loginOverlay = null;
        this.userInfoBar = null;
        this.onLoginSuccess = null;
        this.onLogout = null;
    }

    // Create login overlay HTML
    createLoginOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'authLoginOverlay';
        overlay.className = 'auth-login-overlay';
        overlay.innerHTML = `
            <div class="auth-login-card">
                <h2>Login to DIGIT</h2>
                <form class="auth-login-form" id="authLoginForm">
                    <input type="text" id="authUsername" placeholder="Username" required>
                    <input type="password" id="authOtp" placeholder="OTP" required>
                    <button type="submit">Login</button>
                </form>
                <div id="authLoginError" class="auth-login-error"></div>
            </div>
        `;

        // Add event listeners
        const form = overlay.querySelector('#authLoginForm');
        form.addEventListener('submit', (e) => this.handleLogin(e));

        return overlay;
    }

    // Create user info bar HTML
    createUserInfoBar() {
        const userBar = document.createElement('div');
        userBar.id = 'authUserInfo';
        userBar.className = 'auth-user-info';
        userBar.style.display = 'none';
        userBar.innerHTML = `
            <div class="auth-user-details" id="authUserDetails"></div>
            <button class="auth-logout-btn" id="authLogoutBtn">Logout</button>
        `;

        // Add logout listener
        const logoutBtn = userBar.querySelector('#authLogoutBtn');
        logoutBtn.addEventListener('click', () => this.handleLogout());

        return userBar;
    }

    // Initialize UI components
    init() {
        // Create and inject CSS
        this.injectCSS();

        // Create UI elements
        this.loginOverlay = this.createLoginOverlay();
        this.userInfoBar = this.createUserInfoBar();

        // Add to document
        document.body.appendChild(this.loginOverlay);
        document.body.insertBefore(this.userInfoBar, document.body.firstChild);

        // Set up auth change callback
        this.authManager.setAuthChangeCallback((isAuthenticated, userInfo) => {
            if (isAuthenticated) {
                this.showUserInfo(userInfo);
                this.hideLogin();
                if (this.onLoginSuccess) this.onLoginSuccess(userInfo);
            } else {
                this.hideUserInfo();
                this.showLogin();
                if (this.onLogout) this.onLogout();
            }
        });

        // Check initial auth state
        if (this.authManager.isAuthenticated()) {
            this.showUserInfo(this.authManager.getUserInfo());
        } else {
            this.showLogin();
        }
    }

    // Handle login form submission
    async handleLogin(event) {
        event.preventDefault();
        const username = document.getElementById('authUsername').value;
        const otp = document.getElementById('authOtp').value;
        const errorElement = document.getElementById('authLoginError');

        errorElement.textContent = '';

        try {
            await this.authManager.login(username, otp);
            // Success handled by auth change callback
        } catch (error) {
            errorElement.textContent = error.message;
        }
    }

    // Handle logout
    handleLogout() {
        this.authManager.logout();
        // UI changes handled by auth change callback
    }

    // Show login overlay
    showLogin() {
        if (this.loginOverlay) {
            this.loginOverlay.style.display = 'flex';
        }
    }

    // Hide login overlay
    hideLogin() {
        if (this.loginOverlay) {
            this.loginOverlay.style.display = 'none';
        }
    }

    // Show user info bar
    showUserInfo(userInfo) {
        if (this.userInfoBar && userInfo) {
            const userDetails = document.getElementById('authUserDetails');
            userDetails.textContent = `Welcome, ${userInfo.name || userInfo.userName} (${userInfo.tenantId})`;
            this.userInfoBar.style.display = 'flex';
        }
    }

    // Hide user info bar
    hideUserInfo() {
        if (this.userInfoBar) {
            this.userInfoBar.style.display = 'none';
        }
    }

    // Set callback for successful login
    setLoginSuccessCallback(callback) {
        this.onLoginSuccess = callback;
    }

    // Set callback for logout
    setLogoutCallback(callback) {
        this.onLogout = callback;
    }

    // Inject CSS styles
    injectCSS() {
        const style = document.createElement('style');
        style.textContent = `
            /* Auth Login Overlay Styles */
            .auth-login-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 9999;
            }

            .auth-login-card {
                background: white;
                padding: 30px;
                border-radius: 8px;
                width: 100%;
                max-width: 400px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }

            .auth-login-card h2 {
                margin: 0 0 20px;
                color: #2c3e50;
                text-align: center;
            }

            .auth-login-form {
                display: flex;
                flex-direction: column;
                gap: 15px;
            }

            .auth-login-form input {
                padding: 10px;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 14px;
            }

            .auth-login-form button {
                background: #3498db;
                color: white;
                border: none;
                padding: 12px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
            }

            .auth-login-form button:hover {
                background: #2980b9;
            }

            .auth-login-error {
                color: #e74c3c;
                text-align: center;
                margin-top: 10px;
                font-size: 14px;
            }

            /* Auth User Info Bar Styles */
            .auth-user-info {
                background: #34495e;
                color: white;
                padding: 10px 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .auth-user-details {
                font-size: 14px;
            }

            .auth-logout-btn {
                background: #e74c3c;
                color: white;
                border: none;
                padding: 6px 12px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
            }

            .auth-logout-btn:hover {
                background: #c0392b;
            }
        `;
        document.head.appendChild(style);
    }
}

// Factory function to create auth system
function createAuthSystem() {
    const authManager = new AuthManager();
    const authUI = new AuthUI(authManager);

    return {
        authManager,
        authUI,
        // Convenience methods
        isAuthenticated: () => authManager.isAuthenticated(),
        getUserInfo: () => authManager.getUserInfo(),
        getAccessToken: () => authManager.getAccessToken(),
        makeApiCall: (endpoint, data) => authManager.makeApiCall(endpoint, data),
        logout: () => authManager.logout(),
        // Initialize the auth system
        init: (onLoginSuccess, onLogout) => {
            authUI.setLoginSuccessCallback(onLoginSuccess);
            authUI.setLogoutCallback(onLogout);
            authUI.init();
            return authManager.isAuthenticated();
        }
    };
}

// Export for use in other modules
window.DigitAuth = {
    createAuthSystem,
    AuthManager,
    AuthUI,
    AUTH_CONFIG
}; 