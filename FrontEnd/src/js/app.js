// --- Base API Configuration ---
const API_URL = 'http://localhost:5055/api/wallet';

// --- State Variables ---
let currentBalance = 0.00;
let transactions = [];

// --- DOM Elements ---
const balanceText = document.getElementById('balanceText');
const transactionsList = document.getElementById('transactionsList');

// Views
const dashboardView = document.getElementById('dashboardView');
const topupView = document.getElementById('topupView');

// Tabs/Buttons
const toDashboardBtn = document.getElementById('toDashboardBtn');
const toTopUpBtn = document.getElementById('toTopUpBtn');
const quickAddBtn = document.getElementById('quickAddBtn');
const finishBtn = document.getElementById('finishBtn');

// Top-Up Form Elements
const topupForm = document.getElementById('topupForm');
const amountInput = document.getElementById('amountInput');
const methodSelect = document.getElementById('methodSelect');
const presetButtons = document.querySelectorAll('.preset-btn');

// Form States
const topupFormContainer = document.getElementById('topupFormContainer');
const loadingState = document.getElementById('loadingState');
const successState = document.getElementById('successState');

// Receipt Elements
const receiptTxId = document.getElementById('receiptTxId');
const receiptAmount = document.getElementById('receiptAmount');
const receiptMethod = document.getElementById('receiptMethod');
const receiptDate = document.getElementById('receiptDate');

// --- API Functions ---
async function fetchWalletState() {
    try {
        // Fetch or create user
        await fetch(`${API_URL}/user`);
        
        // Fetch balance
        const balanceRes = await fetch(`${API_URL}/balance`);
        const balanceData = await balanceRes.json();
        currentBalance = balanceData.balance;

        // Fetch transaction history
        const summaryRes = await fetch(`${API_URL}/summary`);
        transactions = await summaryRes.json();

        renderUI();
    } catch (error) {
        console.error('Error fetching wallet state:', error);
    }
}

// --- Helper Functions ---
function showDashboard() {
    dashboardView.classList.add('active');
    topupView.classList.remove('active');
    fetchWalletState();
}

function showTopUp() {
    dashboardView.classList.remove('active');
    topupView.classList.add('active');
    
    // Reset Top-up form status
    topupFormContainer.classList.add('active');
    loadingState.classList.remove('active');
    successState.classList.remove('active');
    amountInput.value = '1000';
}

function renderUI() {
    // 1. Display updated balance
    balanceText.innerText = '₹' + currentBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    // 2. Display transactions list
    transactionsList.innerHTML = '';
    
    if (transactions.length === 0) {
        transactionsList.innerHTML = '<div class="no-transactions">No recent transactions found.</div>';
        return;
    }

    for (let i = 0; i < transactions.length; i++) {
        let tx = transactions[i];
        let itemClass = tx.amount > 0 ? 'tx-positive' : 'tx-negative';
        let prefix = tx.amount > 0 ? '+' : '';
        
        transactionsList.innerHTML += `
            <div class="list-item">
                <div>
                    <strong>${tx.title}</strong>
                    <br><small style="color: #888;">${tx.date}</small>
                </div>
                <div class="${itemClass}">
                    ${prefix}₹${Math.abs(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
            </div>
        `;
    }
}

// --- Event Handlers ---

// Switch view events
toDashboardBtn.addEventListener('click', showDashboard);
toTopUpBtn.addEventListener('click', showTopUp);
quickAddBtn.addEventListener('click', showTopUp);
finishBtn.addEventListener('click', showDashboard);

// Preset amount helper buttons
presetButtons.forEach(button => {
    button.addEventListener('click', () => {
        amountInput.value = button.getAttribute('data-val');
    });
});

// Process Top-Up Form submission
topupForm.addEventListener('submit', async (event) => {
    event.preventDefault(); // Stop page reload
    
    let amount = parseFloat(amountInput.value);
    let method = methodSelect.value;
    
    if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid amount.');
        return;
    }
    
    // Step 1: Show loading screen
    topupFormContainer.classList.remove('active');
    loadingState.classList.add('active');
    
    try {
        const response = await fetch(`${API_URL}/topup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ amount, method })
        });

        if (!response.ok) {
            throw new Error('Top-up failed');
        }

        const data = await response.json();
        const newTx = data.transaction;
        currentBalance = data.newBalance;

        // Populate receipt
        receiptTxId.innerText = newTx.transactionId;
        receiptAmount.innerText = '₹' + amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        receiptMethod.innerText = method;
        receiptDate.innerText = newTx.date;

        // Switch to success screen state
        loadingState.classList.remove('active');
        successState.classList.add('active');
    } catch (error) {
        alert('Transaction failed. Please try again.');
        console.error(error);
        showTopUp();
    }
});

// Boot the application
fetchWalletState();
showDashboard();
