/* ==========================================================================
   GARUDAPAY INTERACTIVE JS APPLICATION
   This script drives the interactive user experience, including:
   1. Dynamic Scroll-based Navigation Header styling
   2. Mobile Toggle Menu
   3. Stats Counters (Animated Number Count-Up)
   4. Interactive UPI Payment Simulator (Standard Domestic UPI Settle Checkout Flow)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // 1. STICKY HEADER & SCROLL DETECTION
    // ==========================================
    const header = document.querySelector('.header');
    
    window.addEventListener('scroll', () => {
        // If user scrolls down more than 50px, add class to style the header
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // ==========================================
    // 2. MOBILE NAVIGATION HAMBURGER MENU
    // ==========================================
    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.querySelector('.nav-menu');

    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            // Toggle 'active' class to show/hide the menu on mobile
            navMenu.classList.toggle('active');
            
            // Visual toggle of hamburger bars into an 'X'
            const bars = menuToggle.querySelectorAll('.bar');
            bars[0].style.transform = navMenu.classList.contains('active') ? 'rotate(45deg) translate(5px, 5px)' : 'none';
            bars[1].style.opacity = navMenu.classList.contains('active') ? '0' : '1';
            bars[2].style.transform = navMenu.classList.contains('active') ? 'rotate(-45deg) translate(5px, -5px)' : 'none';
        });

        // Close mobile menu when clicking any nav link
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                // Reset hamburger icon bars
                const bars = menuToggle.querySelectorAll('.bar');
                bars[0].style.transform = 'none';
                bars[1].style.opacity = '1';
                bars[2].style.transform = 'none';
            });
        });
    }

    // ==========================================
    // 3. STATS NUMBER COUNT-UP ANIMATION
    // ==========================================
    const statNumbers = document.querySelectorAll('.stat-number');
    
    // Trigger animation when the stats section enters the screen
    const observerOptions = {
        threshold: 0.5 // Trigger when 50% of the section is visible
    };

    const statsObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateStats();
                // Stop observing after animating once
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const statsSection = document.querySelector('.stats-section');
    if (statsSection) {
        statsObserver.observe(statsSection);
    }

    function animateStats() {
        statNumbers.forEach(stat => {
            const target = parseInt(stat.getAttribute('data-target'), 10);
            let current = 0;
            const duration = 2000; // Duration of animation in ms
            const stepTime = Math.abs(Math.floor(duration / target));
            
            const timer = setInterval(() => {
                current += Math.ceil(target / 50); // Increment number in chunks
                if (current >= target) {
                    stat.textContent = target; // Ensure it reaches exact target value
                    clearInterval(timer);
                } else {
                    stat.textContent = current;
                }
            }, stepTime > 30 ? stepTime : 30); // Prevent intervals faster than browser limit
        });
    }

    // ==========================================
    // 4. INTERACTIVE UPI PAYMENT SIMULATOR
    // ==========================================
    const sendAmountInput = document.getElementById('sendAmount');
    const targetCountrySelect = document.getElementById('targetCountry');
    const rateLabel = document.getElementById('rateLabel');
    const recipientGetsLabel = document.getElementById('recipientGets');
    
    const btnSendSim = document.getElementById('btnSendSim');
    const btnResetSim = document.getElementById('btnResetSim');
    
    const simFormScreen = document.getElementById('simFormScreen');
    const simLoadingScreen = document.getElementById('simLoadingScreen');
    const simSuccessScreen = document.getElementById('simSuccessScreen');
    
    // Receipt UI elements to update on success
    const receiptTxId = document.getElementById('receiptTxId');
    const receiptSent = document.getElementById('receiptSent');
    const receiptReceived = document.getElementById('receiptReceived');
    const settleTimeVal = document.getElementById('settleTime');

    // Function to calculate and update conversion fields
    function updateConversion() {
        if (!sendAmountInput || !targetCountrySelect) return;

        const sendAmount = parseFloat(sendAmountInput.value) || 0;
        
        // Fetch selected option properties
        const selectedOption = targetCountrySelect.options[targetCountrySelect.selectedIndex];
        const symbol = selectedOption.getAttribute('data-symbol') || '₹';

        // Update Bank Label Info
        rateLabel.textContent = `HDFC Bank (**** 8943)`;

        // Format amount nicely with comma separations
        const formattedAmount = sendAmount.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });

        // Update UI
        recipientGetsLabel.textContent = `${symbol}${formattedAmount}`;
    }

    // Event listeners to update conversions on inputs edit
    if (sendAmountInput) sendAmountInput.addEventListener('input', updateConversion);
    if (targetCountrySelect) targetCountrySelect.addEventListener('change', updateConversion);

    // Initial load conversion trigger
    updateConversion();

    // Settle Transfer Button Action
    if (btnSendSim) {
        btnSendSim.addEventListener('click', async () => {
            const amount = parseFloat(sendAmountInput.value) || 0;
            if (amount <= 0) {
                alert('Please enter a valid amount greater than ₹0.');
                return;
            }

            // Switch to Loading Screen
            simFormScreen.classList.remove('active');
            simLoadingScreen.classList.add('active');

            try {
                const response = await fetch('http://localhost:5055/api/wallet/transfer', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        amount: amount,
                        recipient: targetCountrySelect.value
                    })
                });

                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.error || 'Transfer failed');
                }

                const data = await response.json();
                const newTx = data.transaction;
                
                // Fetch conversion parameters
                const selectedOption = targetCountrySelect.options[targetCountrySelect.selectedIndex];
                const symbol = selectedOption.getAttribute('data-symbol') || '₹';
                const recipientId = targetCountrySelect.value;
                const formatted = amount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                });

                // Generate random settle speed (e.g. 0.45s to 0.95s)
                const speed = (Math.random() * (0.95 - 0.45) + 0.45).toFixed(2);

                // Populate Receipt Details
                if (receiptTxId) receiptTxId.textContent = newTx.transactionId;
                if (receiptSent) receiptSent.textContent = `${symbol}${formatted}`;
                if (receiptReceived) receiptReceived.textContent = recipientId;
                if (settleTimeVal) settleTimeVal.textContent = `${speed}s`;

                // Switch to Success Screen
                simLoadingScreen.classList.remove('active');
                simSuccessScreen.classList.add('active');

            } catch (error) {
                alert(error.message || 'Transaction failed. Please try again.');
                console.error(error);
                simLoadingScreen.classList.remove('active');
                simFormScreen.classList.add('active');
            }
        });
    }

    // Reset Transfer Button Action (returns to start form)
    if (btnResetSim) {
        btnResetSim.addEventListener('click', () => {
            simSuccessScreen.classList.remove('active');
            simFormScreen.classList.add('active');
            
            // Reset input values to defaults
            if (sendAmountInput) sendAmountInput.value = '500';
            updateConversion();
        });
    }
});
