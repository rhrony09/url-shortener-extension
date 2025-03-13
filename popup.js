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

    // Default API URL - hardcoded since we removed settings
    const API_URL = 'http://url-shortener.test/api/urls';

    // Use current page URL
    useCurrentBtn.addEventListener('click', function () {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            if (tabs && tabs.length > 0) {
                originalUrlInput.value = tabs[0].url;
            }
        });
    });

    // Shorten URL
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

        // Use hardcoded API URL
        shortenUrl(API_URL, originalUrl, customSlug);
    });

    // Create shortened URL
    function shortenUrl(apiUrl, originalUrl, customSlug) {
        showLoading(true);

        const data = {
            original_url: originalUrl,
        };

        if (customSlug) {
            data.custom_slug = customSlug;
        }

        fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
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
                showError('Failed to connect to the server. Please check your settings.');
                console.error('Error:', error);
            });
    }

    // Copy short URL to clipboard
    copyBtn.addEventListener('click', function () {
        shortUrlInput.select();
        document.execCommand('copy');

        // Show feedback
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

    // Create a new shortened URL
    newBtn.addEventListener('click', function () {
        resultDiv.classList.add('hidden');
        urlInputDiv.classList.remove('hidden');
        originalUrlInput.value = '';
        customSlugInput.value = '';
    });

    // Show error message
    function showError(message) {
        errorText.textContent = message;
        errorDiv.classList.remove('hidden');
        urlInputDiv.classList.add('hidden');
    }

    // Dismiss error message
    dismissErrorBtn.addEventListener('click', function () {
        errorDiv.classList.add('hidden');
        urlInputDiv.classList.remove('hidden');
    });

    // Show loading spinner
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

    // Show result
    function showResult(shortUrl) {
        shortUrlInput.value = shortUrl;
        urlInputDiv.classList.add('hidden');
        resultDiv.classList.remove('hidden');
    }

    // Validate URL
    function isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    // Initialize the popup
    function init() {
        // Check if URL is already in the input field
        if (!originalUrlInput.value) {
            // Get the current tab URL
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                if (tabs && tabs.length > 0) {
                    originalUrlInput.value = tabs[0].url;
                }
            });
        }
    }

    init();
});