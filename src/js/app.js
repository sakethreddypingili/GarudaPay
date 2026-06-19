// --- Base API Configuration ---
const BACKEND_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port !== '5055' ? 'http://localhost:5055' : '';
const API_URL = `${BACKEND_BASE}/api/wallet`;
const AUTH_API_URL = `${BACKEND_BASE}/api/auth`;
const TX_API_URL = `${BACKEND_BASE}/api/transaction`;

function getAuthHeaders(headers = {}) {
    const token = localStorage.getItem('token');
    const newHeaders = { ...headers };
    if (token) {
        newHeaders['Authorization'] = `Bearer ${token}`;
    }
    return newHeaders;
}

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

// Navigation layouts
const guestAuthContainer = document.getElementById('guestAuthContainer');
const appDashboardLayout = document.getElementById('appDashboardLayout');

// Views
const dashboardView = document.getElementById('dashboardView');
const topupView = document.getElementById('topupView');
const loginView = document.getElementById('loginView');
const registerView = document.getElementById('registerView');
const forgotPasswordView = document.getElementById('forgotPasswordView');
const resetPasswordView = document.getElementById('resetPasswordView');
const transactionHistoryView = document.getElementById('transactionHistoryView');
const txDetailsModal = document.getElementById('txDetailsModal');
const sendMoneyView = document.getElementById('sendMoneyView');
const transferReceiptView = document.getElementById('transferReceiptView');

// Send Money Elements
const sendMoneyForm = document.getElementById('sendMoneyForm');
const sendRecipientInput = document.getElementById('sendRecipientInput');
const sendAmountInput = document.getElementById('sendAmountInput');
const sendMoneySubmitBtn = document.getElementById('sendMoneySubmitBtn');
const txReceiptRefId = document.getElementById('txReceiptRefId');
const txReceiptAmount = document.getElementById('txReceiptAmount');
const txReceiptRecipient = document.getElementById('txReceiptRecipient');
const txReceiptDate = document.getElementById('txReceiptDate');
const txReceiptDoneBtn = document.getElementById('txReceiptDoneBtn');

// Tabs/Buttons
const toDashboardBtn = document.getElementById('toDashboardBtn');
const toTopUpBtn = document.getElementById('toTopUpBtn');
const toSendMoneyBtn = document.getElementById('toSendMoneyBtn');
const quickAddBtn = document.getElementById('quickAddBtn');
const finishBtn = document.getElementById('finishBtn');
const toLoginBtn = document.getElementById('toLoginBtn');
const toRegisterBtn = document.getElementById('toRegisterBtn');
const toHistoryBtn = document.getElementById('toHistoryBtn');
const logoutBtn = document.getElementById('logoutBtn');

// Sidebar Nav Links
const sideNavDashboard = document.getElementById('sideNavDashboard');
const sideNavTopUp = document.getElementById('sideNavTopUp');
const sideNavSend = document.getElementById('sideNavSend');
const sideNavHistory = document.getElementById('sideNavHistory');
const sideNavLogout = document.getElementById('sideNavLogout');
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
    if (dashboardView) dashboardView.classList.remove('active');
    if (topupView) topupView.classList.remove('active');
    if (loginView) loginView.classList.remove('active');
    if (registerView) registerView.classList.remove('active');
    if (forgotPasswordView) forgotPasswordView.classList.remove('active');
    if (resetPasswordView) resetPasswordView.classList.remove('active');
    if (transactionHistoryView) transactionHistoryView.classList.remove('active');
    if (sendMoneyView) sendMoneyView.classList.remove('active');
    if (transferReceiptView) transferReceiptView.classList.remove('active');
}

function showSendMoney() {
    hideAllViews();
    if (sendMoneyView) sendMoneyView.classList.add('active');
    if (sendRecipientInput) sendRecipientInput.value = '';
    if (sendAmountInput) sendAmountInput.value = '';
}

function showDashboard() {
    hideAllViews();
    if (dashboardView) dashboardView.classList.add('active');
    fetchWalletState();
}

function showTopUp() {
    hideAllViews();
    if (dashboardView) dashboardView.classList.remove('active');
    if (topupView) topupView.classList.add('active');
    
    // Reset Top-up form status
    if (topupFormContainer) topupFormContainer.classList.add('active');
    if (loadingState) loadingState.classList.remove('active');
    if (successState) successState.classList.remove('active');
    if (amountInput) amountInput.value = '1000';
}

function renderUI() {
    // 1. Display updated balance
    if (balanceText) {
        balanceText.innerText = '₹' + currentBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    
    // 2. Display transactions list
    if (transactionsList) {
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
}

// --- Navigation Helpers ---
function showLogin() {
    hideAllViews();
    if (loginView) loginView.classList.add('active');
    if (loginEmail) loginEmail.value = '';
    if (loginPassword) loginPassword.value = '';
}

function showRegister() {
    hideAllViews();
    if (registerView) registerView.classList.add('active');
    if (registerName) registerName.value = '';
    if (registerEmail) registerEmail.value = '';
    if (registerPassword) registerPassword.value = '';
}

function showForgotPassword() {
    hideAllViews();
    if (forgotPasswordView) forgotPasswordView.classList.add('active');
    if (forgotEmail) forgotEmail.value = '';
    if (forgotPasswordDebugContainer) forgotPasswordDebugContainer.style.display = 'none';
}

function showResetPassword(tokenVal = '') {
    hideAllViews();
    if (resetPasswordView) resetPasswordView.classList.add('active');
    if (resetToken) resetToken.value = tokenVal;
    if (resetPasswordInput) resetPasswordInput.value = '';
}

async function showHistory() {
    hideAllViews();
    if (transactionHistoryView) transactionHistoryView.classList.add('active');
    historyFilters.page = 1;
    await fetchTransactionHistory();
}

// --- Session & Navigation State Update ---
function updateNavbar() {
    if (currentUser) {
        if (guestAuthContainer) guestAuthContainer.style.display = 'none';
        if (appDashboardLayout) appDashboardLayout.style.display = 'grid';
    } else {
        if (guestAuthContainer) guestAuthContainer.style.display = 'block';
        if (appDashboardLayout) appDashboardLayout.style.display = 'none';
    }
}

function updateSidebarActiveLink(activeId) {
    const links = document.querySelectorAll('.side-nav a');
    links.forEach(link => {
        if (link.id === activeId) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

async function checkSession() {
    try {
        const res = await fetch(`${AUTH_API_URL}/me`, { 
            headers: getAuthHeaders(),
            credentials: 'include' 
        });
        if (res.ok) {
            const data = await res.json();
            currentUser = data.user;
            updateNavbar();
            const hash = window.location.hash;
            if (hash === '#topup') {
                showTopUp();
                updateSidebarActiveLink('sideNavTopUp');
            } else if (hash === '#send') {
                showSendMoney();
                updateSidebarActiveLink('sideNavSend');
            } else if (hash === '#transactions') {
                showHistory();
                updateSidebarActiveLink('sideNavHistory');
            } else {
                showDashboard();
                updateSidebarActiveLink('sideNavTopUp');
            }
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
            if (data.token) localStorage.setItem('token', data.token);
            currentUser = data.user;
            updateNavbar();
            window.location.href = "dashboard.html";
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
            if (data.token) localStorage.setItem('token', data.token);
            currentUser = data.user;
            updateNavbar();
            window.location.href = "dashboard.html";
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
        await fetch(`${AUTH_API_URL}/logout`, { 
            method: 'POST', 
            headers: getAuthHeaders(),
            credentials: 'include' 
        });
    } catch (err) {
        console.error('Logout API call failed:', err);
    }
    localStorage.removeItem('token');
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
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
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
            if (data.token) localStorage.setItem('token', data.token);
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
        
        const res = await fetch(`${TX_API_URL}/history?${params.toString()}`, { 
            headers: getAuthHeaders(),
            credentials: 'include' 
        });
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
if (toDashboardBtn) toDashboardBtn.addEventListener('click', showDashboard);
if (toTopUpBtn) toTopUpBtn.addEventListener('click', showTopUp);
if (toSendMoneyBtn) toSendMoneyBtn.addEventListener('click', showSendMoney);
if (quickAddBtn) quickAddBtn.addEventListener('click', showTopUp);
if (finishBtn) finishBtn.addEventListener('click', showDashboard);
if (txReceiptDoneBtn) txReceiptDoneBtn.addEventListener('click', showDashboard);
if (toLoginBtn) toLoginBtn.addEventListener('click', showLogin);
if (toRegisterBtn) toRegisterBtn.addEventListener('click', showRegister);
if (toHistoryBtn) toHistoryBtn.addEventListener('click', showHistory);
if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

// Sidebar Nav click handlers
if (sideNavTopUp) {
    sideNavTopUp.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.hash = '#topup';
        showTopUp();
        updateSidebarActiveLink('sideNavTopUp');
    });
}
if (sideNavSend) {
    sideNavSend.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.hash = '#send';
        showSendMoney();
        updateSidebarActiveLink('sideNavSend');
    });
}
if (sideNavHistory) {
    sideNavHistory.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.hash = '#transactions';
        showHistory();
        updateSidebarActiveLink('sideNavHistory');
    });
}
if (sideNavLogout) {
    sideNavLogout.addEventListener('click', (e) => {
        e.preventDefault();
        handleLogout();
    });
}

// Global hash change listener
window.addEventListener('hashchange', () => {
    if (!currentUser) return;
    const hash = window.location.hash;
    if (hash === '#topup') {
        showTopUp();
        updateSidebarActiveLink('sideNavTopUp');
    } else if (hash === '#send') {
        showSendMoney();
        updateSidebarActiveLink('sideNavSend');
    } else if (hash === '#transactions') {
        showHistory();
        updateSidebarActiveLink('sideNavHistory');
    } else {
        showDashboard();
        updateSidebarActiveLink('sideNavTopUp');
    }
});

// Send Money Submit Listener
if (sendMoneyForm) {
    sendMoneyForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const recipient = sendRecipientInput.value.trim();
        const amount = parseFloat(sendAmountInput.value);

        if (!recipient || isNaN(amount) || amount <= 0) {
            alert('Please enter valid recipient and amount.');
            return;
        }

        if (sendMoneySubmitBtn) {
            sendMoneySubmitBtn.innerText = 'Sending...';
            sendMoneySubmitBtn.disabled = true;
        }

        try {
            const res = await fetch(`${API_URL}/transfer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount, recipient }),
                credentials: 'include'
            });
            const data = await res.json();

            if (res.ok && data.success) {
                hideAllViews();
                if (transferReceiptView) transferReceiptView.classList.add('active');
                if (txReceiptRefId) txReceiptRefId.innerText = data.data.reference || data.data._id || 'N/A';
                if (txReceiptAmount) txReceiptAmount.innerText = '₹' + amount.toLocaleString('en-IN', { minimumFractionDigits: 2 });
                if (txReceiptRecipient) txReceiptRecipient.innerText = recipient;
                if (txReceiptDate) txReceiptDate.innerText = new Date().toLocaleString('en-IN');
            } else {
                alert('Transfer failed: ' + (data.error || data.message || 'Unknown error'));
            }
        } catch (err) {
            console.error('Transfer error:', err);
            alert('An error occurred while executing the transfer.');
        } finally {
            if (sendMoneySubmitBtn) {
                sendMoneySubmitBtn.innerText = 'Send Funds Now';
                sendMoneySubmitBtn.disabled = false;
            }
        }
    });
}

// View navigation links
if (linkForgotPassword) linkForgotPassword.addEventListener('click', (e) => { e.preventDefault(); showForgotPassword(); });
if (linkRegister) linkRegister.addEventListener('click', (e) => { e.preventDefault(); showRegister(); });
if (linkLogin) linkLogin.addEventListener('click', (e) => { e.preventDefault(); showLogin(); });
if (linkBackToLogin1) linkBackToLogin1.addEventListener('click', (e) => { e.preventDefault(); showLogin(); });
if (linkBackToLogin2) linkBackToLogin2.addEventListener('click', (e) => { e.preventDefault(); showLogin(); });

// Auth form submissions
if (loginForm) loginForm.addEventListener('submit', handleLogin);
if (registerForm) registerForm.addEventListener('submit', handleRegister);
if (forgotPasswordForm) forgotPasswordForm.addEventListener('submit', handleForgotPassword);
if (resetPasswordForm) resetPasswordForm.addEventListener('submit', handleResetPassword);

// Preset amount helper buttons
if (presetButtons) {
    presetButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (amountInput) amountInput.value = button.getAttribute('data-val');
        });
    });
}

// Process Top-Up Form submission
if (topupForm) {
    topupForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Stop page reload
        
        if (!amountInput || !methodSelect) return;
        let amount = parseFloat(amountInput.value);
        let method = methodSelect.value;
        
        if (isNaN(amount) || amount <= 0) {
            alert('Please enter a valid amount.');
            return;
        }
        
        // Step 1: Show loading screen
        if (topupFormContainer) topupFormContainer.classList.remove('active');
        if (loadingState) loadingState.classList.add('active');
        
        try {
            const response = await fetch(`${API_URL}/topup`, {
                method: 'POST',
                headers: getAuthHeaders({
                    'Content-Type': 'application/json'
                }),
                credentials: 'include',
                body: JSON.stringify({ amount, method })
            });

            if (!response.ok) {
                throw new Error('Top-up failed');
            }

            const data = await response.json();
            const newTx = data.transaction;
            currentBalance = data.newBalance;

            // Populate receipt
            if (receiptTxId) receiptTxId.innerText = newTx.transactionId;
            if (receiptAmount) receiptAmount.innerText = '₹' + amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            if (receiptMethod) receiptMethod.innerText = method;
            if (receiptDate) receiptDate.innerText = newTx.date;

            // Switch to success screen state
            if (loadingState) loadingState.classList.remove('active');
            if (successState) successState.classList.add('active');
        } catch (error) {
            alert('Transaction failed. Please try again.');
            console.error(error);
            showTopUp();
        }
    });
}

// Transaction History search & filter events
if (searchDescInput) {
    searchDescInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            historyFilters.search = searchDescInput.value.trim();
            historyFilters.page = 1;
            fetchTransactionHistory();
        }
    });
}

if (filterType) {
    filterType.addEventListener('change', () => {
        historyFilters.type = filterType.value;
        historyFilters.page = 1;
        fetchTransactionHistory();
    });
}

if (filterStatus) {
    filterStatus.addEventListener('change', () => {
        historyFilters.status = filterStatus.value;
        historyFilters.page = 1;
        fetchTransactionHistory();
    });
}

if (filterFromDate) {
    filterFromDate.addEventListener('change', () => {
        historyFilters.from = filterFromDate.value;
        historyFilters.page = 1;
        fetchTransactionHistory();
    });
}

if (filterToDate) {
    filterToDate.addEventListener('change', () => {
        historyFilters.to = filterToDate.value;
        historyFilters.page = 1;
        fetchTransactionHistory();
    });
}

if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', () => {
        if (searchDescInput) searchDescInput.value = '';
        if (filterType) filterType.value = '';
        if (filterStatus) filterStatus.value = '';
        if (filterFromDate) filterFromDate.value = '';
        if (filterToDate) filterToDate.value = '';
        
        historyFilters = { page: 1, limit: 10, type: '', status: '', from: '', to: '', search: '' };
        fetchTransactionHistory();
    });
}

// Pagination events
if (prevPageBtn) {
    prevPageBtn.addEventListener('click', () => {
        if (historyPagination.hasPrevPage) {
            historyFilters.page--;
            fetchTransactionHistory();
        }
    });
}

if (nextPageBtn) {
    nextPageBtn.addEventListener('click', () => {
        if (historyPagination.hasNextPage) {
            historyFilters.page++;
            fetchTransactionHistory();
        }
    });
}

// CSV Export and Modal events
if (exportCsvBtn) exportCsvBtn.addEventListener('click', handleExportCsv);
if (closeTxModalBtn) closeTxModalBtn.addEventListener('click', closeTxDetails);

if (txDetailsModal) {
    txDetailsModal.addEventListener('click', (e) => {
        if (e.target === txDetailsModal) {
            closeTxDetails();
        }
    });
}

// Boot the application
checkSession();
