document.addEventListener('DOMContentLoaded', function () {
    // Elements
    const originalUrlInput = document.getElementById('original-url');
    const customSlugInput = document.getElementById('custom-slug');
    const shortenBtn = document.getElementById('shorten-btn');
    const useCurrentBtn = document.getElementById('use-current-btn');
    const shortUrlInput = document.getElementById('short-url');
    const copyBtn = document.getElementById('copy-btn');
    const newBtn = document.getElementById('new-btn');
    const resultDiv = document.getElementById('result');
    const urlInputDiv = document.getElementById('url-input');
    const errorDiv = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');
    const dismissErrorBtn = document.getElementById('dismiss-error-btn');
    const loadingDiv = document.getElementById('loading');

    // Auth elements
    const authSection = document.getElementById('auth-section');
    const showAuthOptionsLink = document.getElementById('show-auth-options');
    const authButtons = document.getElementById('auth-buttons');
    const hideAuthBtn = document.getElementById('hide-auth-btn');
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const contentDiv = document.getElementById('content');
    const userInfo = document.getElementById('user-info');
    const userNameSpan = document.getElementById('user-name');
    const logoutBtn = document.getElementById('logout-btn');
    const viewDetailsBtn = document.getElementById('view-details-btn');

    // Login form elements
    const loginEmail = document.getElementById('login-email');
    const loginPassword = document.getElementById('login-password');
    const loginSubmitBtn = document.getElementById('login-submit-btn');
    const loginBackBtn = document.getElementById('login-back-btn');
    const loginErrors = document.getElementById('login-errors');

    // Register form elements
    const registerName = document.getElementById('register-name');
    const registerMobile = document.getElementById('register-mobile');
    const registerEmail = document.getElementById('register-email');
    const registerPassword = document.getElementById('register-password');
    const registerSubmitBtn = document.getElementById('register-submit-btn');
    const registerBackBtn = document.getElementById('register-back-btn');
    const registerErrors = document.getElementById('register-errors');

    // API URLs with HTTPS enforcement
    const BASE_URL = 'https://imbdurl.com';
    const API_URL = `${BASE_URL}/api/urls`;
    const LOGIN_API = `${BASE_URL}/api/login`;
    const REGISTER_API = `${BASE_URL}/api/register`;
    const LOGOUT_API = `${BASE_URL}/api/logout`;
    const MAGIC_TOKEN_API = `${BASE_URL}/api/get-magic-token`;
    const MAGIC_LOGIN_URL = `${BASE_URL}/magic-login`;

    // Ensure all URLs use HTTPS
    function enforceHTTPS(url) {
        if (!url.startsWith('https://')) {
            throw new Error('Only HTTPS URLs are allowed for security');
        }
        return url;
    }

    // Auth state
    let authToken = null;
    let currentUser = null;

    // Initialize the extension
    init();

    // Theme management
    initTheme();

    // Update checking
    initUpdateChecking();

    // Input sanitization function to prevent XSS
    function sanitizeInput(input) {
        if (typeof input !== 'string') return '';

        // Remove potentially dangerous characters and scripts
        return input
            .replace(/[<>]/g, '') // Remove < and >
            .replace(/javascript:/gi, '') // Remove javascript: protocol
            .replace(/on\w+=/gi, '') // Remove event handlers
            .trim();
    }

    // Sanitize all user inputs before processing
    function sanitizeFormInputs() {
        const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"]');
        inputs.forEach(input => {
            input.addEventListener('input', function () {
                this.value = sanitizeInput(this.value);
            });
        });
    }

    // Authentication Event Listeners
    showAuthOptionsLink.addEventListener('click', function (e) {
        e.preventDefault();
        showAuthButtons();
    });

    hideAuthBtn.addEventListener('click', hideAuthButtons);
    loginBtn.addEventListener('click', showLoginForm);
    registerBtn.addEventListener('click', showRegisterForm);
    loginBackBtn.addEventListener('click', hideAuthForms);
    registerBackBtn.addEventListener('click', hideAuthForms);
    loginSubmitBtn.addEventListener('click', handleLogin);
    registerSubmitBtn.addEventListener('click', handleRegister);
    logoutBtn.addEventListener('click', handleLogout);
    viewDetailsBtn.addEventListener('click', handleViewDetails);

    // Handle Enter key for forms
    loginEmail.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') handleLogin();
    });
    loginPassword.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') handleLogin();
    });
    registerPassword.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') handleRegister();
    });



    // Existing event listeners
    useCurrentBtn.addEventListener('click', function () {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            if (tabs && tabs.length > 0) {
                originalUrlInput.value = tabs[0].url;
            }
        });
    });

    shortenBtn.addEventListener('click', function () {
        const originalUrl = originalUrlInput.value.trim();
        const customSlug = customSlugInput.value.trim();

        if (!originalUrl) {
            showError('Please enter a URL');
            return;
        }

        if (!isValidUrl(originalUrl)) {
            showError('Please enter a valid URL');
            return;
        }

        shortenUrl(API_URL, originalUrl, customSlug);
    });

    copyBtn.addEventListener('click', async function () {
        try {
            await navigator.clipboard.writeText(shortUrlInput.value);

            // Show success feedback
            const originalText = copyBtn.innerHTML;
            copyBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>
            </svg>
          `;
            copyBtn.title = 'Copied!';

            setTimeout(() => {
                copyBtn.innerHTML = originalText;
                copyBtn.title = 'Copy to clipboard';
            }, 2000);
        } catch (err) {
            // Fallback for older browsers
            shortUrlInput.select();
            try {
                document.execCommand('copy');
                showSuccessMessage('URL copied to clipboard!');
            } catch (fallbackErr) {
                showError('Failed to copy URL. Please copy manually.');
            }
        }
    });

    newBtn.addEventListener('click', function () {
        resultDiv.classList.add('hidden');
        urlInputDiv.classList.remove('hidden');
        originalUrlInput.value = '';
        customSlugInput.value = '';
    });

    dismissErrorBtn.addEventListener('click', function () {
        errorDiv.classList.add('hidden');
        urlInputDiv.classList.remove('hidden');
    });

    // Auth Functions
    function showAuthButtons() {
        authButtons.classList.remove('hidden');
        showAuthOptionsLink.style.display = 'none';
    }

    function hideAuthButtons() {
        authButtons.classList.add('hidden');
        showAuthOptionsLink.style.display = 'inline';
    }

    function showLoginForm() {
        hideAllAuthSections();
        loginForm.classList.remove('hidden');
        clearForm(loginForm);
        hideErrors(loginErrors);
        // Focus on email field
        setTimeout(() => loginEmail.focus(), 100);
    }

    function showRegisterForm() {
        hideAllAuthSections();
        registerForm.classList.remove('hidden');
        clearForm(registerForm);
        hideErrors(registerErrors);
        // Focus on name field
        setTimeout(() => registerName.focus(), 100);
    }

    function hideAuthForms() {
        hideAllAuthSections();
        contentDiv.classList.remove('hidden');
        updateAuthDisplay();
    }

    function hideAllAuthSections() {
        loginForm.classList.add('hidden');
        registerForm.classList.add('hidden');
        contentDiv.classList.add('hidden');
        errorDiv.classList.add('hidden');
        resultDiv.classList.add('hidden');
    }

    function updateAuthDisplay() {
        if (currentUser) {
            authSection.classList.add('hidden');
            userInfo.classList.remove('hidden');
            userNameSpan.textContent = `Welcome, ${currentUser.name}`;
        } else {
            authSection.classList.remove('hidden');
            userInfo.classList.add('hidden');
            hideAuthButtons();
        }
    }

    function clearForm(form) {
        const inputs = form.querySelectorAll('input');
        inputs.forEach(input => input.value = '');
    }

    function hideErrors(errorElement) {
        errorElement.classList.add('hidden');
        errorElement.innerHTML = '';
    }

    function showValidationErrors(errorElement, errors) {
        errorElement.classList.remove('hidden');

        if (typeof errors === 'string') {
            errorElement.innerHTML = `<div class="single-error">${errors}</div>`;
        } else if (typeof errors === 'object') {
            let errorHtml = '<ul>';
            Object.keys(errors).forEach(field => {
                if (Array.isArray(errors[field])) {
                    errors[field].forEach(error => {
                        errorHtml += `<li>${error}</li>`;
                    });
                } else {
                    errorHtml += `<li>${errors[field]}</li>`;
                }
            });
            errorHtml += '</ul>';
            errorElement.innerHTML = errorHtml;
        }
    }

    async function handleLogin() {
        const email = loginEmail.value.trim();
        const password = loginPassword.value.trim();

        // Basic validation
        if (!email || !password) {
            showValidationErrors(loginErrors, 'Please fill in all fields');
            return;
        }

        setButtonLoading(loginSubmitBtn, true);
        hideErrors(loginErrors);

        try {
            const response = await fetch(LOGIN_API, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });

            const data = await response.json();

            if (response.ok && data.status === 'success') {
                authToken = data.data.token;
                currentUser = data.data.user;
                await saveAuthState();
                hideAuthForms();
                contentDiv.classList.remove('hidden');
                updateAuthDisplay();
                initUrlShortener();
            } else {
                showValidationErrors(loginErrors, data.errors || data.message || 'Login failed');
            }
        } catch (error) {
            showValidationErrors(loginErrors, 'Network error. Please try again.');
            console.error('Login error:', error);
        } finally {
            setButtonLoading(loginSubmitBtn, false);
        }
    }

    async function handleRegister() {
        const name = registerName.value.trim();
        const mobile = registerMobile.value.trim();
        const email = registerEmail.value.trim();
        const password = registerPassword.value.trim();

        // Basic validation
        if (!name || !mobile || !email || !password) {
            showValidationErrors(registerErrors, 'Please fill in all required fields');
            return;
        }

        setButtonLoading(registerSubmitBtn, true);
        hideErrors(registerErrors);

        try {
            const response = await fetch(REGISTER_API, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    name: name,
                    mobile: mobile,
                    email: email,
                    password: password
                })
            });

            const data = await response.json();

            if (response.ok && data.status === 'success') {
                authToken = data.data.token;
                currentUser = data.data.user;
                await saveAuthState();
                hideAuthForms();
                contentDiv.classList.remove('hidden');
                updateAuthDisplay();
                initUrlShortener();
            } else {
                showValidationErrors(registerErrors, data.errors || data.message || 'Registration failed');
            }
        } catch (error) {
            showValidationErrors(registerErrors, 'Network error. Please try again.');
            console.error('Register error:', error);
        } finally {
            setButtonLoading(registerSubmitBtn, false);
        }
    }

    async function handleLogout() {
        try {
            if (authToken) {
                await fetch(LOGOUT_API, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                        'Accept': 'application/json',
                    }
                });
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            authToken = null;
            currentUser = null;
            await clearAuthState();
            updateAuthDisplay();
        }
    }

    async function handleViewDetails() {
        if (authToken) {
            let magic_response = await fetch(MAGIC_TOKEN_API, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Accept': 'application/json',
                }
            });
            let magic_data = await magic_response.json();

            let url = MAGIC_LOGIN_URL + `?magic_token=${magic_data.data.magic_token}`;
            chrome.tabs.create({ url: url });
        }
    }

    function setButtonLoading(button, isLoading) {
        if (isLoading) {
            button.disabled = true;
            button.textContent = 'Processing...';
        } else {
            button.disabled = false;
            if (button.id.includes('login')) {
                button.textContent = 'Login';
            } else if (button.id.includes('register')) {
                button.textContent = 'Register';
            }
        }
    }

    // Storage functions
    async function saveAuthState() {
        const authState = {
            token: authToken,
            user: currentUser
        };
        await chrome.storage.local.set({ authState });
    }

    async function loadAuthState() {
        try {
            const result = await chrome.storage.local.get('authState');
            if (result.authState) {
                authToken = result.authState.token;
                currentUser = result.authState.user;
                return true;
            }
        } catch (error) {
            console.error('Error loading auth state:', error);
        }
        return false;
    }

    async function clearAuthState() {
        try {
            await chrome.storage.local.remove('authState');
        } catch (error) {
            console.error('Error clearing auth state:', error);
        }
    }

    // URL Shortener Functions with timeout handling
    function shortenUrl(apiUrl, originalUrl, customSlug) {
        showLoading(true);

        // Validate and sanitize inputs
        try {
            originalUrl = enforceHTTPS(originalUrl);
            if (customSlug) {
                customSlug = sanitizeInput(customSlug);
            }
        } catch (error) {
            showLoading(false);
            showError(error.message, error);
            return;
        }

        const data = {
            original_url: originalUrl,
        };

        if (customSlug) {
            data.custom_slug = customSlug;
        }

        // Add user_id if authenticated
        if (currentUser && currentUser.id) {
            data.user_id = currentUser.id;
        }

        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        };

        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }

        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        fetch(apiUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(data),
            signal: controller.signal
        })
            .then(response => {
                clearTimeout(timeoutId);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                showLoading(false);

                if (data.success) {
                    showResult(data.url.short_url);
                } else {
                    showError(data.error || 'An error occurred');
                }
            })
            .catch(error => {
                clearTimeout(timeoutId);
                showLoading(false);

                if (error.name === 'AbortError') {
                    showError('Request timed out. Please try again.');
                } else if (error.message.includes('HTTP')) {
                    showError(`Server error: ${error.message}`);
                } else {
                    showError('Failed to connect to the server. Please try again.', error);
                }
                console.error('Error:', error);
            });
    }

    // Enhanced error handling with error boundaries
    function showError(message, error = null) {
        // Log error for debugging
        if (error) {
            console.error('Extension Error:', error);
        }

        // Sanitize error message to prevent XSS
        const sanitizedMessage = sanitizeInput(message);
        errorText.textContent = sanitizedMessage;
        errorDiv.classList.remove('hidden');
        urlInputDiv.classList.add('hidden');

        // Auto-hide error after 10 seconds
        setTimeout(() => {
            if (!errorDiv.classList.contains('hidden')) {
                errorDiv.classList.add('hidden');
                urlInputDiv.classList.remove('hidden');
            }
        }, 10000);
    }

    // Success message function
    function showSuccessMessage(message) {
        // Create temporary success message
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4caf50;
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            animation: slideInRight 0.3s ease-out;
        `;

        document.body.appendChild(successDiv);

        setTimeout(() => {
            successDiv.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => {
                if (successDiv.parentNode) {
                    successDiv.parentNode.removeChild(successDiv);
                }
            }, 300);
        }, 3000);
    }

    function showLoading(isLoading) {
        if (isLoading) {
            loadingDiv.classList.remove('hidden');
            urlInputDiv.classList.add('hidden');
            resultDiv.classList.add('hidden');
            errorDiv.classList.add('hidden');
        } else {
            loadingDiv.classList.add('hidden');
        }
    }

    function showResult(shortUrl) {
        shortUrlInput.value = shortUrl;
        urlInputDiv.classList.add('hidden');
        resultDiv.classList.remove('hidden');
    }

    function isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    function initUrlShortener() {
        // Pre-fill with current tab URL if available
        if (!originalUrlInput.value) {
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                if (tabs && tabs.length > 0) {
                    originalUrlInput.value = tabs[0].url;
                }
            });
        }
    }

    // Initialize the popup
    async function init() {
        const isAuthenticated = await loadAuthState();

        // Always show main content
        contentDiv.classList.remove('hidden');
        updateAuthDisplay();
        initUrlShortener();

        // Initialize input sanitization and validation
        sanitizeFormInputs();
        setupRealTimeValidation();

        // Apply theme immediately after DOM is ready
        setTimeout(() => {
            const savedTheme = localStorage.getItem('theme');
            const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

            if (savedTheme) {
                setTheme(savedTheme);
            } else if (systemPrefersDark) {
                setTheme('dark');
            } else {
                setTheme('light');
            }
        }, 100);
    }

    // Theme management functions
    function initTheme() {
        const themeToggle = document.getElementById('theme-toggle');
        const sunIcon = document.getElementById('sun-icon');
        const moonIcon = document.getElementById('moon-icon');

        // Check if elements exist
        if (!themeToggle || !sunIcon || !moonIcon) {
            return;
        }

        // Load saved theme or detect system preference
        const savedTheme = localStorage.getItem('theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (savedTheme) {
            setTheme(savedTheme);
        } else if (systemPrefersDark) {
            setTheme('dark');
        } else {
            setTheme('light'); // Ensure light theme is set by default
        }

        // Theme toggle event listener
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            setTheme(newTheme);
            localStorage.setItem('theme', newTheme);
        });

        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) {
                setTheme(e.matches ? 'dark' : 'light');
            }
        });


    }



    function setTheme(theme) {
        const sunIcon = document.getElementById('sun-icon');
        const moonIcon = document.getElementById('moon-icon');

        // Set the theme attribute on document element
        document.documentElement.setAttribute('data-theme', theme);

        // Update icon visibility
        if (theme === 'dark') {
            sunIcon.classList.add('hidden');
            moonIcon.classList.remove('hidden');
        } else {
            sunIcon.classList.remove('hidden');
            moonIcon.classList.add('hidden');
        }


    }

    // Real-time input validation
    function setupRealTimeValidation() {
        const urlInput = document.getElementById('original-url');
        const slugInput = document.getElementById('custom-slug');

        // URL validation
        urlInput.addEventListener('input', function () {
            const url = this.value.trim();
            if (url && !isValidUrl(url)) {
                this.style.borderColor = '#f44336';
                this.title = 'Please enter a valid URL (e.g., https://example.com)';
            } else {
                this.style.borderColor = '#e1e5e9';
                this.title = '';
            }
        });

        // Slug validation
        slugInput.addEventListener('input', function () {
            const slug = this.value.trim();
            if (slug && !/^[a-zA-Z0-9-_]+$/.test(slug)) {
                this.style.borderColor = '#f44336';
                this.title = 'Slug can only contain letters, numbers, hyphens, and underscores';
            } else {
                this.style.borderColor = '#e1e5e9';
                this.title = '';
            }
        });
    }

    // Update checking functions
    function initUpdateChecking() {
        // Check for updates when popup opens
        checkForUpdates();

        // Add version info to the popup if you want to display it
        displayVersionInfo();
    }

    async function checkForUpdates() {
        try {
            // Send message to background script to check for updates
            const response = await chrome.runtime.sendMessage({ action: 'checkForUpdates' });

            if (response && response.success) {
                console.log('Update check completed');
            }
        } catch (error) {
            console.error('Error checking for updates:', error);
        }
    }

    async function displayVersionInfo() {
        try {
            const response = await chrome.runtime.sendMessage({ action: 'getVersion' });

            if (response && response.version) {
                // You can add this to your popup HTML if you want to show the version
                // For example, add a version element and update it here
                const versionElement = document.getElementById('version-info');
                if (versionElement) {
                    versionElement.textContent = `v${response.version}`;
                }
            }
        } catch (error) {
            console.error('Error getting version info:', error);
        }
    }


});