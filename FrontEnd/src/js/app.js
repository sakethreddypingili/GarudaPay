// --- Base API Configuration ---
const API_URL = 'http://localhost:5055/api/wallet';
const AUTH_API_URL = 'http://localhost:5055/api/auth';
const TX_API_URL = 'http://localhost:5055/api/transaction';

// --- State Variables ---
let currentBalance = 0.00;
let transactions = [];
let currentUser = null;
let historyTransactions = [];
let historyPagination = { currentPage: 1, totalPages: 1 };
let historyFilters = { page: 1, limit: 10, type: '', status: '', from: '', to: '', search: '' };

// --- DOM Elements ---
const balanceText = document.getElementById('balanceText');
const transactionsList = document.getElementById('transactionsList');

// Navigation Bars
const navGuest = document.getElementById('navGuest');
const navUser = document.getElementById('navUser');

// Views
const dashboardView = document.getElementById('dashboardView');
const topupView = document.getElementById('topupView');
const loginView = document.getElementById('loginView');
const registerView = document.getElementById('registerView');
const forgotPasswordView = document.getElementById('forgotPasswordView');
const resetPasswordView = document.getElementById('resetPasswordView');
const transactionHistoryView = document.getElementById('transactionHistoryView');
const txDetailsModal = document.getElementById('txDetailsModal');

// Tabs/Buttons
const toDashboardBtn = document.getElementById('toDashboardBtn');
const toTopUpBtn = document.getElementById('toTopUpBtn');
const quickAddBtn = document.getElementById('quickAddBtn');
const finishBtn = document.getElementById('finishBtn');
const toLoginBtn = document.getElementById('toLoginBtn');
const toRegisterBtn = document.getElementById('toRegisterBtn');
const toHistoryBtn = document.getElementById('toHistoryBtn');
const logoutBtn = document.getElementById('logoutBtn');
const exportCsvBtn = document.getElementById('exportCsvBtn');
const clearFiltersBtn = document.getElementById('clearFiltersBtn');
const prevPageBtn = document.getElementById('prevPageBtn');
const nextPageBtn = document.getElementById('nextPageBtn');
const closeTxModalBtn = document.getElementById('closeTxModalBtn');

// Auth Forms & Inputs
const loginForm = document.getElementById('loginForm');
const loginEmail = document.getElementById('loginEmail');
const loginPassword = document.getElementById('loginPassword');
const registerForm = document.getElementById('registerForm');
const registerName = document.getElementById('registerName');
const registerEmail = document.getElementById('registerEmail');
const registerPassword = document.getElementById('registerPassword');
const forgotPasswordForm = document.getElementById('forgotPasswordForm');
const forgotEmail = document.getElementById('forgotEmail');
const resetPasswordForm = document.getElementById('resetPasswordForm');
const resetToken = document.getElementById('resetToken');
const resetPasswordInput = document.getElementById('resetPassword');
const linkForgotPassword = document.getElementById('linkForgotPassword');
const linkRegister = document.getElementById('linkRegister');
const linkLogin = document.getElementById('linkLogin');
const linkBackToLogin1 = document.getElementById('linkBackToLogin1');
const linkBackToLogin2 = document.getElementById('linkBackToLogin2');

// Forgot Password Debug elements
const forgotPasswordDebugContainer = document.getElementById('forgotPasswordDebugContainer');
const forgotPasswordDebugLink = document.getElementById('forgotPasswordDebugLink');

// Transaction History Filters
const searchDescInput = document.getElementById('searchDescInput');
const filterType = document.getElementById('filterType');
const filterStatus = document.getElementById('filterStatus');
const filterFromDate = document.getElementById('filterFromDate');
const filterToDate = document.getElementById('filterToDate');
const detailedTransactionsList = document.getElementById('detailedTransactionsList');
const pageIndicator = document.getElementById('pageIndicator');

// Transaction Details Modal Fields
const detRefId = document.getElementById('detRefId');
const detStatus = document.getElementById('detStatus');
const detDate = document.getElementById('detDate');
const detType = document.getElementById('detType');
const detAmount = document.getElementById('detAmount');
const detSender = document.getElementById('detSender');
const detReceiver = document.getElementById('detReceiver');
const detDescription = document.getElementById('detDescription');

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
function hideAllViews() {
    dashboardView.classList.remove('active');
    topupView.classList.remove('active');
    loginView.classList.remove('active');
    registerView.classList.remove('active');
    forgotPasswordView.classList.remove('active');
    resetPasswordView.classList.remove('active');
    transactionHistoryView.classList.remove('active');
}

function showDashboard() {
    hideAllViews();
    dashboardView.classList.add('active');
    fetchWalletState();
}

function showTopUp() {
    hideAllViews();
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
            <div class="list-item txn-row" onclick="openTxDetails('${tx.transactionId}')">
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

// --- Navigation Helpers ---
function showLogin() {
    hideAllViews();
    loginView.classList.add('active');
    loginEmail.value = '';
    loginPassword.value = '';
}

function showRegister() {
    hideAllViews();
    registerView.classList.add('active');
    registerName.value = '';
    registerEmail.value = '';
    registerPassword.value = '';
}

function showForgotPassword() {
    hideAllViews();
    forgotPasswordView.classList.add('active');
    forgotEmail.value = '';
    forgotPasswordDebugContainer.style.display = 'none';
}

function showResetPassword(tokenVal = '') {
    hideAllViews();
    resetPasswordView.classList.add('active');
    resetToken.value = tokenVal;
    resetPasswordInput.value = '';
}

async function showHistory() {
    hideAllViews();
    transactionHistoryView.classList.add('active');
    historyFilters.page = 1;
    await fetchTransactionHistory();
}

// --- Session & Navigation State Update ---
function updateNavbar() {
    if (currentUser) {
        navGuest.style.display = 'none';
        navUser.style.display = 'flex';
    } else {
        navGuest.style.display = 'flex';
        navUser.style.display = 'none';
    }
}

async function checkSession() {
    try {
        const res = await fetch(`${AUTH_API_URL}/me`, { credentials: 'include' });
        if (res.ok) {
            const data = await res.json();
            currentUser = data.user;
            updateNavbar();
            showDashboard();
        } else {
            currentUser = null;
            updateNavbar();
            if (!checkResetToken()) {
                showLogin();
            }
        }
    } catch (err) {
        console.error('Session check failed:', err);
        currentUser = null;
        updateNavbar();
        if (!checkResetToken()) {
            showLogin();
        }
    }
}

// --- Auth Action Handlers ---
async function handleLogin(e) {
    e.preventDefault();
    const email = loginEmail.value.trim();
    const password = loginPassword.value;
    
    try {
        const res = await fetch(`${AUTH_API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
            credentials: 'include'
        });
        
        const data = await res.json();
        if (res.ok && data.success) {
            currentUser = data.user;
            updateNavbar();
            showDashboard();
        } else {
            alert(data.message || 'Login failed.');
        }
    } catch (err) {
        console.error('Login error:', err);
        alert('An error occurred during login. Please try again.');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const name = registerName.value.trim();
    const email = registerEmail.value.trim();
    const password = registerPassword.value;
    
    try {
        const res = await fetch(`${AUTH_API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password }),
            credentials: 'include'
        });
        
        const data = await res.json();
        if (res.ok && data.success) {
            currentUser = data.user;
            updateNavbar();
            showDashboard();
        } else {
            alert(data.message || 'Registration failed.');
        }
    } catch (err) {
        console.error('Registration error:', err);
        alert('An error occurred during registration.');
    }
}

async function handleLogout() {
    try {
        await fetch(`${AUTH_API_URL}/logout`, { method: 'POST', credentials: 'include' });
    } catch (err) {
        console.error('Logout API call failed:', err);
    }
    currentUser = null;
    updateNavbar();
    showLogin();
}

async function handleForgotPassword(e) {
    e.preventDefault();
    const email = forgotEmail.value.trim();
    
    try {
        const res = await fetch(`${AUTH_API_URL}/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
            credentials: 'include'
        });
        
        const data = await res.json();
        if (res.ok && data.success) {
            alert(data.message || 'If an account exists, a reset link was generated.');
            forgotEmail.value = '';
        } else if (data.resetUrl) {
            alert('Note: Mail server failed, but the token was generated. See the details displayed on screen.');
            forgotPasswordDebugContainer.style.display = 'block';
            
            const parts = data.resetUrl.split('/reset-password/');
            const token = parts[parts.length - 1];
            
            const frontendResetUrl = `${window.location.origin}${window.location.pathname}?token=${token}`;
            forgotPasswordDebugLink.href = frontendResetUrl;
            forgotPasswordDebugLink.innerText = frontendResetUrl;
        } else {
            alert(data.message || 'Failed to submit request.');
        }
    } catch (err) {
        console.error('Forgot password error:', err);
        alert('An error occurred.');
    }
}

async function handleResetPassword(e) {
    e.preventDefault();
    const token = resetToken.value.trim();
    const password = resetPasswordInput.value;
    
    try {
        const res = await fetch(`${AUTH_API_URL}/reset-password`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'x-reset-token': token
            },
            body: JSON.stringify({ password }),
            credentials: 'include'
        });
        
        const data = await res.json();
        if (res.ok && data.success) {
            alert('Password reset successfully! You are now logged in.');
            window.history.replaceState({}, document.title, window.location.pathname);
            checkSession();
        } else {
            alert(data.message || 'Password reset failed.');
        }
    } catch (err) {
        console.error('Reset password error:', err);
        alert('An error occurred.');
    }
}

// --- Transaction History & Details Handlers ---
async function fetchTransactionHistory() {
    try {
        const params = new URLSearchParams();
        params.append('page', historyFilters.page);
        params.append('limit', historyFilters.limit);
        if (historyFilters.type) params.append('type', historyFilters.type);
        if (historyFilters.status) params.append('status', historyFilters.status);
        if (historyFilters.from) params.append('from', historyFilters.from);
        if (historyFilters.to) params.append('to', historyFilters.to);
        if (historyFilters.search) params.append('search', historyFilters.search);
        
        const res = await fetch(`${TX_API_URL}/history?${params.toString()}`, { credentials: 'include' });
        const data = await res.json();
        
        if (res.ok && data.success) {
            historyTransactions = data.data;
            historyPagination = data.pagination;
            renderHistoryUI();
        } else {
            detailedTransactionsList.innerHTML = `<div class="no-transactions">Error: ${data.message || 'Failed to load transactions.'}</div>`;
        }
    } catch (err) {
        console.error('Error fetching transaction history:', err);
        detailedTransactionsList.innerHTML = `<div class="no-transactions">Failed to connect to the server.</div>`;
    }
}

function renderHistoryUI() {
    detailedTransactionsList.innerHTML = '';
    
    if (historyTransactions.length === 0) {
        detailedTransactionsList.innerHTML = '<div class="no-transactions">No transactions match the filters.</div>';
        prevPageBtn.disabled = true;
        nextPageBtn.disabled = true;
        pageIndicator.innerText = 'Page 1 of 1';
        return;
    }
    
    for (let i = 0; i < historyTransactions.length; i++) {
        const tx = historyTransactions[i];
        const dateStr = new Date(tx.createdAt).toLocaleString('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'short'
        });
        
        let itemClass = 'tx-negative';
        let prefix = '-';
        if (tx.type === 'credit') {
            itemClass = 'tx-positive';
            prefix = '+';
        } else if (tx.type === 'debit' && tx.receiver && tx.receiver._id === currentUser.id) {
            itemClass = 'tx-positive';
            prefix = '+';
        }
        
        let badgeClass = 'status-pending';
        if (tx.status === 'completed') badgeClass = 'status-completed';
        else if (tx.status === 'failed' || tx.status === 'faied') badgeClass = 'status-failed';
        
        const desc = tx.description || 'Transfer';
        
        detailedTransactionsList.innerHTML += `
            <div class="list-item txn-row" onclick="openTxDetails('${tx._id}')">
                <div>
                    <strong>${desc}</strong>
                    <br><small style="color: #888;">Ref: ${tx.reference || tx._id}</small>
                    <br><small style="color: #aaa;">${dateStr}</small>
                </div>
                <div style="text-align: right;">
                    <div class="${itemClass}" style="font-weight: 700; font-size: 15px;">
                        ${prefix}₹${tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                    <span class="status-badge ${badgeClass}">${tx.status}</span>
                </div>
            </div>
        `;
    }
    
    prevPageBtn.disabled = !historyPagination.hasPrevPage;
    nextPageBtn.disabled = !historyPagination.hasNextPage;
    pageIndicator.innerText = `Page ${historyPagination.currentPage} of ${historyPagination.totalPages || 1}`;
}

async function openTxDetails(txId) {
    const isMongoId = /^[0-9a-fA-F]{24}$/.test(txId);
    if (!isMongoId) {
        try {
            const res = await fetch(`${TX_API_URL}/history?search=${txId}`, { credentials: 'include' });
            const data = await res.json();
            if (res.ok && data.success && data.data.length > 0) {
                txId = data.data[0]._id;
            } else {
                alert(`Transaction Reference: ${txId}\nNote: Full details are only available for authenticated account transactions.`);
                return;
            }
        } catch (err) {
            alert(`Transaction Reference: ${txId}`);
            return;
        }
    }

    try {
        const res = await fetch(`${TX_API_URL}/${txId}`, { credentials: 'include' });
        const data = await res.json();
        
        if (res.ok && data.success) {
            const tx = data.data;
            
            detRefId.innerText = tx.reference || tx._id;
            detStatus.innerText = tx.status.toUpperCase();
            
            detStatus.className = 'status-badge';
            if (tx.status === 'completed') detStatus.classList.add('status-completed');
            else if (tx.status === 'failed' || tx.status === 'faied') detStatus.classList.add('status-failed');
            else detStatus.classList.add('status-pending');
            
            detDate.innerText = new Date(tx.createdAt).toLocaleString('en-IN');
            detType.innerText = tx.type.toUpperCase();
            detAmount.innerText = '₹' + tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 });
            
            detSender.innerText = tx.sender ? `${tx.sender.name} (${tx.sender.email})` : 'System / Unknown';
            detReceiver.innerText = tx.reciever || tx.receiver ? `${(tx.reciever || tx.receiver).name} (${(tx.reciever || tx.receiver).email})` : 'System / Unknown';
            
            detDescription.innerText = tx.description || 'N/A';
            
            txDetailsModal.classList.add('active');
        } else {
            alert('Failed to load transaction details: ' + (data.message || ''));
        }
    } catch (err) {
        console.error('Error opening transaction details:', err);
        alert('An error occurred while fetching details.');
    }
}

function closeTxDetails() {
    txDetailsModal.classList.remove('active');
}

async function handleExportCsv() {
    try {
        const params = new URLSearchParams();
        if (historyFilters.type) params.append('type', historyFilters.type);
        if (historyFilters.status) params.append('status', historyFilters.status);
        if (historyFilters.from) params.append('from', historyFilters.from);
        if (historyFilters.to) params.append('to', historyFilters.to);
        if (historyFilters.search) params.append('search', historyFilters.search);
        
        const res = await fetch(`${TX_API_URL}/export?${params.toString()}`, { credentials: 'include' });
        if (res.ok) {
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            
            const filename = `garudapay_transactions_${new Date().toISOString().slice(0, 10)}.csv`;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } else {
            const data = await res.json();
            alert('Failed to export statement: ' + (data.message || ''));
        }
    } catch (err) {
        console.error('Export error:', err);
        alert('An error occurred during statement export.');
    }
}

function checkResetToken() {
    const urlParams = new URLSearchParams(window.location.search);
    const queryToken = urlParams.get('token') || urlParams.get('reset-token');
    if (queryToken) {
        showResetPassword(queryToken);
        return true;
    }
    const hash = window.location.hash;
    if (hash.includes('token=')) {
        const hashToken = hash.split('token=')[1];
        if (hashToken) {
            showResetPassword(hashToken);
            return true;
        }
    }
    return false;
}

// --- Event Handlers ---

// Switch view events
toDashboardBtn.addEventListener('click', showDashboard);
toTopUpBtn.addEventListener('click', showTopUp);
quickAddBtn.addEventListener('click', showTopUp);
finishBtn.addEventListener('click', showDashboard);
toLoginBtn.addEventListener('click', showLogin);
toRegisterBtn.addEventListener('click', showRegister);
toHistoryBtn.addEventListener('click', showHistory);
logoutBtn.addEventListener('click', handleLogout);

// View navigation links
linkForgotPassword.addEventListener('click', (e) => { e.preventDefault(); showForgotPassword(); });
linkRegister.addEventListener('click', (e) => { e.preventDefault(); showRegister(); });
linkLogin.addEventListener('click', (e) => { e.preventDefault(); showLogin(); });
linkBackToLogin1.addEventListener('click', (e) => { e.preventDefault(); showLogin(); });
linkBackToLogin2.addEventListener('click', (e) => { e.preventDefault(); showLogin(); });

// Auth form submissions
loginForm.addEventListener('submit', handleLogin);
registerForm.addEventListener('submit', handleRegister);
forgotPasswordForm.addEventListener('submit', handleForgotPassword);
resetPasswordForm.addEventListener('submit', handleResetPassword);

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

// Transaction History search & filter events
searchDescInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        historyFilters.search = searchDescInput.value.trim();
        historyFilters.page = 1;
        fetchTransactionHistory();
    }
});

filterType.addEventListener('change', () => {
    historyFilters.type = filterType.value;
    historyFilters.page = 1;
    fetchTransactionHistory();
});

filterStatus.addEventListener('change', () => {
    historyFilters.status = filterStatus.value;
    historyFilters.page = 1;
    fetchTransactionHistory();
});

filterFromDate.addEventListener('change', () => {
    historyFilters.from = filterFromDate.value;
    historyFilters.page = 1;
    fetchTransactionHistory();
});

filterToDate.addEventListener('change', () => {
    historyFilters.to = filterToDate.value;
    historyFilters.page = 1;
    fetchTransactionHistory();
});

clearFiltersBtn.addEventListener('click', () => {
    searchDescInput.value = '';
    filterType.value = '';
    filterStatus.value = '';
    filterFromDate.value = '';
    filterToDate.value = '';
    
    historyFilters = { page: 1, limit: 10, type: '', status: '', from: '', to: '', search: '' };
    fetchTransactionHistory();
});

// Pagination events
prevPageBtn.addEventListener('click', () => {
    if (historyPagination.hasPrevPage) {
        historyFilters.page--;
        fetchTransactionHistory();
    }
});

nextPageBtn.addEventListener('click', () => {
    if (historyPagination.hasNextPage) {
        historyFilters.page++;
        fetchTransactionHistory();
    }
});

// CSV Export and Modal events
exportCsvBtn.addEventListener('click', handleExportCsv);
closeTxModalBtn.addEventListener('click', closeTxDetails);

txDetailsModal.addEventListener('click', (e) => {
    if (e.target === txDetailsModal) {
        closeTxDetails();
    }
});

// Boot the application
checkSession();
