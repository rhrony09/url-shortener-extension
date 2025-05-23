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

    // API URLs
    const BASE_URL = 'https://imbdurl.com';
    const API_URL = `${BASE_URL}/api/urls`;
    const LOGIN_API = `${BASE_URL}/api/login`;
    const REGISTER_API = `${BASE_URL}/api/register`;
    const LOGOUT_API = `${BASE_URL}/api/logout`;
    const MAGIC_TOKEN_API = `${BASE_URL}/api/get-magic-token`;
    const MAGIC_LOGIN_URL = `${BASE_URL}/magic-login`;

    // Auth state
    let authToken = null;
    let currentUser = null;

    // Initialize the extension
    init();

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

    copyBtn.addEventListener('click', function () {
        shortUrlInput.select();
        document.execCommand('copy');

        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>
        </svg>
      `;

        setTimeout(() => {
            copyBtn.innerHTML = originalText;
        }, 2000);
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

    // URL Shortener Functions
    function shortenUrl(apiUrl, originalUrl, customSlug) {
        showLoading(true);

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

        fetch(apiUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(data)
        })
            .then(response => response.json())
            .then(data => {
                showLoading(false);

                if (data.success) {
                    showResult(data.url.short_url);
                } else {
                    showError(data.error || 'An error occurred');
                }
            })
            .catch(error => {
                showLoading(false);
                showError('Failed to connect to the server. Please try again.');
                console.error('Error:', error);
            });
    }

    function showError(message) {
        errorText.textContent = message;
        errorDiv.classList.remove('hidden');
        urlInputDiv.classList.add('hidden');
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
    }
});