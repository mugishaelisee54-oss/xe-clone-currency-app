// Exchange rates (mock data - in production, you would use an API)
const exchangeRates = {
    USD: 1, EUR: 0.85, GBP: 0.73, JPY: 110.5, CAD: 1.25,
    AUD: 1.35, CHF: 0.92, CNY: 6.45, INR: 74.5, BRL: 5.25,
    MXN: 20.1, SGD: 1.35
};

// Currency symbols and names
const currencyInfo = {
    USD: { symbol: "$", name: "US Dollar", flag: "🇺🇸" },
    EUR: { symbol: "€", name: "Euro", flag: "🇪🇺" },
    GBP: { symbol: "£", name: "British Pound", flag: "🇬🇧" },
    JPY: { symbol: "¥", name: "Japanese Yen", flag: "🇯🇵" },
    CAD: { symbol: "C$", name: "Canadian Dollar", flag: "🇨🇦" },
    AUD: { symbol: "A$", name: "Australian Dollar", flag: "🇦🇺" },
    CHF: { symbol: "CHF", name: "Swiss Franc", flag: "🇨🇭" },
    CNY: { symbol: "¥", name: "Chinese Yuan", flag: "🇨🇳" },
    INR: { symbol: "₹", name: "Indian Rupee", flag: "🇮🇳" },
    BRL: { symbol: "R$", name: "Brazilian Real", flag: "🇧🇷" },
    MXN: { symbol: "$", name: "Mexican Peso", flag: "🇲🇽" },
    SGD: { symbol: "S$", name: "Singapore Dollar", flag: "🇸🇬" }
};

// Global variables
let conversionHistory = [];
let currentChart = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    loadHistory();
    
    // Setup event listeners based on current page
    if (document.getElementById('convert-btn')) {
        setupConverterPage();
    }
    
    if (document.getElementById('history-list')) {
        displayHistory();
    }
    
    if (document.getElementById('detail-currency')) {
        setupDetailsPage();
    }
    
    if (document.querySelector('.settings-container')) {
        setupSettingsPage();
    }
    
    setupNavigation();
    setupThemeToggle();
});

// Setup converter page functionality
function setupConverterPage() {
    const convertBtn = document.getElementById('convert-btn');
    const swapBtn = document.getElementById('swap-btn');
    const amountInput = document.getElementById('amount');
    
    if (convertBtn) {
        convertBtn.addEventListener('click', performConversion);
    }
    
    if (swapBtn) {
        swapBtn.addEventListener('click', swapCurrencies);
    }
    
    if (amountInput) {
        amountInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') performConversion();
        });
    }
    
    // Load default currency from settings
    const defaultCurrency = localStorage.getItem('defaultCurrency') || 'USD';
    const fromSelect = document.getElementById('from-currency');
    const toSelect = document.getElementById('to-currency');
    
    if (fromSelect && toSelect) {
        toSelect.value = defaultCurrency;
    }
}

// Perform currency conversion
async function performConversion() {
    showLoading();
    
    // Simulate API call delay
    setTimeout(() => {
        try {
            const amount = parseFloat(document.getElementById('amount').value);
            const fromCurrency = document.getElementById('from-currency').value;
            const toCurrency = document.getElementById('to-currency').value;
            
            // Validate input
            if (isNaN(amount) || amount <= 0) {
                showError('Please enter a valid amount greater than 0');
                hideLoading();
                return;
            }
            
            // Calculate conversion
            const rate = getExchangeRate(fromCurrency, toCurrency);
            const convertedAmount = amount * rate;
            const formattedAmount = formatCurrency(convertedAmount, toCurrency);
            const formattedRate = rate.toFixed(4);
            
            // Display results
            document.getElementById('converted-amount').innerHTML = formattedAmount;
            document.getElementById('from-code').innerText = fromCurrency;
            document.getElementById('to-code').innerText = toCurrency;
            document.getElementById('exchange-rate').innerText = formattedRate;
            document.getElementById('timestamp').innerText = new Date().toLocaleString();
            document.getElementById('result-section').style.display = 'block';
            
            // Save to temporary conversion (will be saved when user clicks save)
            window.lastConversion = {
                amount: amount,
                from: fromCurrency,
                to: toCurrency,
                convertedAmount: convertedAmount,
                rate: rate,
                timestamp: new Date().toISOString()
            };
            
            hideLoading();
        } catch (error) {
            console.error('Conversion error:', error);
            showError('An error occurred during conversion');
            hideLoading();
        }
    }, 1000);
}

// Get exchange rate between two currencies
function getExchangeRate(from, to) {
    // Convert to USD base then to target
    const rateInUSD = 1 / exchangeRates[from];
    const rate = rateInUSD * exchangeRates[to];
    return rate;
}

// Swap currencies
function swapCurrencies() {
    const fromSelect = document.getElementById('from-currency');
    const toSelect = document.getElementById('to-currency');
    const tempValue = fromSelect.value;
    
    fromSelect.value = toSelect.value;
    toSelect.value = tempValue;
    
    // Re-convert if there's already a result
    performConversion();
}

// Save current conversion to history
function saveCurrentConversion() {
    if (window.lastConversion) {
        const conversion = {
            id: Date.now(),
            ...window.lastConversion
        };
        
        conversionHistory.unshift(conversion);
        saveHistoryToLocalStorage();
        showNotification('Conversion saved to history!', 'success');
        
        // Update history display if on history page
        if (document.getElementById('history-list')) {
            displayHistory();
        }
    } else {
        showNotification('No conversion to save. Please convert first!', 'warning');
    }
}

// Save history to localStorage
function saveHistoryToLocalStorage() {
    localStorage.setItem('conversionHistory', JSON.stringify(conversionHistory));
}

// Load history from localStorage
function loadHistory() {
    const storedHistory = localStorage.getItem('conversionHistory');
    if (storedHistory) {
        conversionHistory = JSON.parse(storedHistory);
    }
}

// Display conversion history
function displayHistory() {
    const historyList = document.getElementById('history-list');
    const emptyState = document.getElementById('empty-history');
    const totalConversions = document.getElementById('total-conversions');
    const last30Days = document.getElementById('last-30-days');
    
    if (!historyList) return;
    
    const filter = document.getElementById('history-filter')?.value || 'all';
    let filteredHistory = conversionHistory;
    
    if (filter !== 'all') {
        filteredHistory = conversionHistory.filter(item => 
            item.from === filter || item.to === filter
        );
    }
    
    // Update stats
    if (totalConversions) {
        totalConversions.innerText = conversionHistory.length;
    }
    
    if (last30Days) {
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        const last30Count = conversionHistory.filter(item => 
            new Date(item.timestamp).getTime() > thirtyDaysAgo
        ).length;
        last30Days.innerText = last30Count;
    }
    
    if (filteredHistory.length === 0) {
        historyList.style.display = 'none';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }
    
    historyList.style.display = 'flex';
    if (emptyState) emptyState.style.display = 'none';
    
    historyList.innerHTML = filteredHistory.map(item => `
        <div class="history-item">
            <div class="history-details">
                <div class="history-amount">
                    ${item.amount} ${item.from} = ${formatCurrency(item.convertedAmount, item.to)}
                </div>
                <div class="history-date">
                    ${new Date(item.timestamp).toLocaleString()}
                </div>
                <div style="font-size: 0.85rem; color: var(--text-secondary);">
                    Rate: 1 ${item.from} = ${item.rate.toFixed(4)} ${item.to}
                </div>
            </div>
            <button class="delete-item" onclick="deleteHistoryItem(${item.id})">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
}

// Delete single history item
function deleteHistoryItem(id) {
    conversionHistory = conversionHistory.filter(item => item.id !== id);
    saveHistoryToLocalStorage();
    displayHistory();
    showNotification('Conversion deleted!', 'info');
}

// Clear all history
function clearHistory() {
    if (confirm('Are you sure you want to clear all conversion history?')) {
        conversionHistory = [];
        saveHistoryToLocalStorage();
        displayHistory();
        showNotification('All history cleared!', 'info');
    }
}

// Setup details page
function setupDetailsPage() {
    const currencySelect = document.getElementById('detail-currency');
    if (currencySelect) {
        currencySelect.addEventListener('change', updateCurrencyDetails);
        updateCurrencyDetails();
    }
}

// Update currency details
function updateCurrencyDetails() {
    const currency = document.getElementById('detail-currency').value;
    const info = currencyInfo[currency];
    const rate = exchangeRates[currency];
    
    // Update header
    document.getElementById('currency-symbol').innerText = info.symbol;
    document.getElementById('currency-name').innerHTML = `${info.flag} ${info.name}`;
    document.getElementById('currency-code').innerText = currency;
    document.getElementById('current-rate').innerText = rate.toFixed(4);
    
    // Generate random changes for demo
    const dailyChange = (Math.random() * 2 - 1).toFixed(2);
    const weeklyChange = (Math.random() * 5 - 2.5).toFixed(2);
    
    const dailyChangeElem = document.getElementById('daily-change');
    const weeklyChangeElem = document.getElementById('weekly-change');
    
    dailyChangeElem.innerText = `${dailyChange >= 0 ? '+' : ''}${dailyChange}%`;
    weeklyChangeElem.innerText = `${weeklyChange >= 0 ? '+' : ''}${weeklyChange}%`;
    
    dailyChangeElem.className = `stat-value ${dailyChange >= 0 ? 'positive' : 'negative'}`;
    weeklyChangeElem.className = `stat-value ${weeklyChange >= 0 ? 'positive' : 'negative'}`;
    
    // Update chart
    updateChart(currency);
    
    // Update comparison
    updateComparison(currency);
    
    // Update historical data
    updateHistoricalData(currency);
}

// Update chart with mock data
function updateChart(currency) {
    const ctx = document.getElementById('rateChart').getContext('2d');
    const mockData = generateMockHistoricalData(currency);
    
    if (currentChart) {
        currentChart.destroy();
    }
    
    currentChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: mockData.labels,
            datasets: [{
                label: `${currency} Exchange Rate Trend`,
                data: mockData.values,
                borderColor: 'var(--primary-color)',
                backgroundColor: 'rgba(15, 76, 129, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: 'var(--text-primary)'
                    }
                }
            },
            scales: {
                y: {
                    ticks: {
                        color: 'var(--text-secondary)'
                    }
                },
                x: {
                    ticks: {
                        color: 'var(--text-secondary)'
                    }
                }
            }
        }
    });
}

// Generate mock historical data
function generateMockHistoricalData(currency) {
    const labels = [];
    const values = [];
    const baseRate = exchangeRates[currency];
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        labels.push(date.toLocaleDateString());
        
        const variation = (Math.random() - 0.5) * 0.1;
        values.push(baseRate + variation);
    }
    
    return { labels, values };
}

// Update comparison cards
function updateComparison(selectedCurrency) {
    const comparisonGrid = document.getElementById('comparison-grid');
    if (!comparisonGrid) return;
    
    const otherCurrencies = Object.keys(currencyInfo).filter(c => c !== selectedCurrency);
    const comparisons = otherCurrencies.slice(0, 6).map(currency => {
        const rate = getExchangeRate(selectedCurrency, currency);
        return `
            <div class="comparison-card">
                <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">${currencyInfo[currency].flag}</div>
                <div><strong>${currency}</strong></div>
                <div>${currencyInfo[currency].name}</div>
                <div style="margin-top: 0.5rem; color: var(--primary-color);">
                    1 ${selectedCurrency} = ${rate.toFixed(4)} ${currency}
                </div>
            </div>
        `;
    }).join('');
    
    comparisonGrid.innerHTML = comparisons;
}

// Update historical data table
function updateHistoricalData(currency) {
    const historicalBody = document.getElementById('historical-body');
    if (!historicalBody) return;
    
    const historicalData = [];
    for (let i = 0; i < 10; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const rate = exchangeRates[currency] + (Math.random() - 0.5) * 0.05;
        const change = ((rate - exchangeRates[currency]) / exchangeRates[currency] * 100).toFixed(2);
        
        historicalData.push(`
            <tr>
                <td>${date.toLocaleDateString()}</td>
                <td>${rate.toFixed(4)}</td>
                <td class="${change >= 0 ? 'positive' : 'negative'}">
                    ${change >= 0 ? '+' : ''}${change}%
                </td>
            </tr>
        `);
    }
    
    historicalBody.innerHTML = historicalData.join('');
}

// Setup settings page
function setupSettingsPage() {
    // Load saved settings
    const savedTheme = localStorage.getItem('theme');
    const savedCurrency = localStorage.getItem('defaultCurrency');
    const savedLanguage = localStorage.getItem('language');
    
    if (savedTheme === 'dark') {
        document.getElementById('theme-toggle-settings').checked = true;
    }
    
    if (savedCurrency) {
        document.getElementById('default-currency').value = savedCurrency;
    }
    
    if (savedLanguage) {
        document.getElementById('language-select').value = savedLanguage;
    }
    
    // Setup event listeners
    document.getElementById('theme-toggle-settings').addEventListener('change', (e) => {
        if (e.target.checked) {
            document.body.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
        updateThemeIcon();
    });
    
    document.getElementById('default-currency').addEventListener('change', (e) => {
        localStorage.setItem('defaultCurrency', e.target.value);
        showNotification('Default currency updated!', 'success');
    });
    
    document.getElementById('language-select').addEventListener('change', (e) => {
        localStorage.setItem('language', e.target.value);
        showNotification('Language preference saved!', 'success');
    });
    
    document.getElementById('export-history').addEventListener('click', exportHistory);
    document.getElementById('clear-all-data').addEventListener('click', clearAllData);
}

// Export history as JSON
function exportHistory() {
    const data = {
        history: conversionHistory,
        settings: {
            theme: localStorage.getItem('theme'),
            defaultCurrency: localStorage.getItem('defaultCurrency'),
            language: localStorage.getItem('language')
        },
        exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `currency-exchange-export-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('History exported successfully!', 'success');
}

// Clear all data
function clearAllData() {
    if (confirm('WARNING: This will delete ALL your data including history and settings. Are you sure?')) {
        localStorage.clear();
        conversionHistory = [];
        
        // Reset to defaults
        document.body.classList.remove('dark');
        if (document.getElementById('theme-toggle-settings')) {
            document.getElementById('theme-toggle-settings').checked = false;
        }
        
        showNotification('All data has been cleared!', 'info');
        
        // Reload page after 1 second
        setTimeout(() => {
            location.reload();
        }, 1000);
    }
}

// Setup navigation
function setupNavigation() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            hamburger.classList.toggle('active');
        });
    }
    
    // Close mobile menu when clicking a link
    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.addEventListener('click', () => {
            if (navMenu) navMenu.classList.remove('active');
        });
    });
    
    // Highlight current page in navigation
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-menu a').forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
        }
    });
}

// Setup theme toggle
function setupThemeToggle() {
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    // Load saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark');
        updateThemeIcon();
    }
}

// Toggle theme
function toggleTheme() {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    updateThemeIcon();
    
    // Update chart colors if chart exists
    if (currentChart) {
        currentChart.update();
    }
}

// Update theme icon
function updateThemeIcon() {
    const themeIcon = document.querySelector('.theme-toggle i');
    if (themeIcon) {
        if (document.body.classList.contains('dark')) {
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
        } else {
            themeIcon.classList.remove('fa-sun');
            themeIcon.classList.add('fa-moon');
        }
    }
}

// Load settings
function loadSettings() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark');
        updateThemeIcon();
    }
}

// Helper function for quick converter on homepage
function quickConvert() {
    const amount = parseFloat(document.getElementById('quick-amount').value);
    const fromCurrency = document.getElementById('quick-from').value;
    const toCurrency = document.getElementById('quick-to').value;
    
    if (isNaN(amount) || amount <= 0) {
        document.getElementById('quick-result').innerHTML = 'Please enter a valid amount';
        return;
    }
    
    const rate = getExchangeRate(fromCurrency, toCurrency);
    const convertedAmount = amount * rate;
    const formattedAmount = formatCurrency(convertedAmount, toCurrency);
    
    document.getElementById('quick-result').innerHTML = `
        ${amount} ${fromCurrency} = ${formattedAmount}
        <div style="font-size: 0.9rem; margin-top: 0.5rem;">Rate: 1 ${fromCurrency} = ${rate.toFixed(4)} ${toCurrency}</div>
    `;
}

// Format currency with proper symbol
function formatCurrency(amount, currency) {
    const symbol = currencyInfo[currency]?.symbol || currency;
    const formattedAmount = amount.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    return `${symbol} ${formattedAmount}`;
}

// Show loading spinner
function showLoading() {
    const spinner = document.getElementById('loading-spinner');
    if (spinner) {
        spinner.style.display = 'flex';
    }
}

// Hide loading spinner
function hideLoading() {
    const spinner = document.getElementById('loading-spinner');
    if (spinner) {
        spinner.style.display = 'none';
    }
}

// Show error message
function showError(message) {
    showNotification(message, 'error');
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Style the notification
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: var(--card-background);
        color: var(--text-primary);
        border-left: 4px solid ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3'};
        border-radius: 10px;
        box-shadow: var(--shadow-hover);
        z-index: 10000;
        animation: slideInRight 0.3s ease;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Make functions globally available
window.performConversion = performConversion;
window.swapCurrencies = swapCurrencies;
window.saveCurrentConversion = saveCurrentConversion;
window.quickConvert = quickConvert;
window.deleteHistoryItem = deleteHistoryItem;
window.clearHistory = clearHistory;