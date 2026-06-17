
document.addEventListener("DOMContentLoaded", () => {
    const API_BASE_URL = "http://localhost:8000/api";
    const form = document.querySelector(".transaction-form");
    const receiverInput = document.getElementById("upiid");
    const amountInput = document.getElementById("amount");
    const noteInput = document.getElementById("note");
    const balanceElement = document.querySelector(".balance-amount");
    const submitButton = document.querySelector(".btn-submit-payment");

    const setBalance = (balance) => {
        balanceElement.textContent = `₹${Number(balance || 0).toFixed(2)}`;
    };

    const loadBalance = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/wallet/balance`);
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || data.message || "Failed to load balance");
            }
            setBalance(data.balance);
        } catch (error) {
            setBalance(0);
            alert(error.message);
        }
    };

    const sendMoney = async (receiver, amount, note) => {
        const response = await fetch(`${API_BASE_URL}/wallet/transfer`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                recipient: receiver,
                amount,
                method: "UPI",
                note
            })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || data.message || "Transfer failed");
        }

        return data;
    };

    loadBalance();

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const receiver = receiverInput.value.trim();
        const amount = Number(amountInput.value);
        const note = noteInput.value.trim();

        if (!receiver) {
            alert("Please enter Receiver UPI ID or Email.");
            receiverInput.focus();
            return;
        }

        if (!amount || amount < 1) {
            alert("Minimum transfer amount is ₹1.");
            amountInput.focus();
            return;
        }

        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Sending...';

        try {
            const result = await sendMoney(receiver, amount, note);
            setBalance(result.newBalance);
            alert(
                `₹${amount.toFixed(2)} sent successfully!\n\n` +
                `Receiver: ${receiver}\n` +
                `Note: ${note || "No note added"}`
            );
            form.reset();
        } catch (error) {
            alert(error.message);
        } finally {
            submitButton.disabled = false;
            submitButton.innerHTML = '<i class="bi bi-send me-2"></i> Send Money';
        }
    });
});