// ========================================
// API UTILITIES
// ========================================
// Functions for fetching exchange rates and crypto prices

// Fetch current exchange rates
async function fetchExchangeRates() {
    try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/EUR');
        const data = await response.json();
        return {
            EUR: 1,
            USD: data.rates.USD || 1.09,
            PKR: data.rates.PKR || 305
        };
    } catch (error) {
        console.error('Error fetching exchange rates:', error);
        // Fallback rates
        return { EUR: 1, USD: 1.09, PKR: 305 };
    }
}

// Fetch current cryptocurrency prices
async function fetchCryptoPrices() {
    try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=eur');
        const data = await response.json();
        return {
            gold: 60, // Gold price per gram in EUR (update manually or use API)
            ethereum: data.ethereum?.eur || 3300
        };
    } catch (error) {
        console.error('Error fetching crypto prices:', error);
        // Fallback prices
        return { gold: 60, ethereum: 3300 };
    }
}

// Show toast notification
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}