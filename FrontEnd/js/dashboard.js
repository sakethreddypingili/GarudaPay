var menuButton = document.getElementById("menuButton");
var sidebar = document.getElementById("sidebar");
var transactionList = document.getElementById("transactionList");
var activityList = document.getElementById("activityList");

menuButton.addEventListener("click", function () {
    sidebar.classList.toggle("show");
});

// This loads the dashboard numbers from the backend.
async function loadDashboardSummary() {
    try {
        var response = await fetch("/api/dashboard/summary");
        var summary = await response.json();

        document.getElementById("walletBalance").textContent = "₹" + summary.walletBalance;
        document.getElementById("totalSent").textContent = "₹" + summary.totalSent;
        document.getElementById("totalReceived").textContent = "₹" + summary.totalReceived;
        document.getElementById("totalTransactions").textContent = summary.totalTransactions;
    } catch (error) {
        document.getElementById("walletBalance").textContent = "Unavailable";
        document.getElementById("totalSent").textContent = "Unavailable";
        document.getElementById("totalReceived").textContent = "Unavailable";
        document.getElementById("totalTransactions").textContent = "Unavailable";
    }
}

// This loads sample activity and transaction data.
async function loadDashboardActivity() {
    try {
        var response = await fetch("/api/dashboard/activity");
        var activityData = await response.json();

        showTransactions(activityData.transactions);
        showActivity(activityData.activities);
    } catch (error) {
        transactionList.innerHTML = "<p class='empty-text'>Start the backend server to view transactions.</p>";
        activityList.innerHTML = "<p class='empty-text'>Start the backend server to view activity.</p>";
    }
}

function showTransactions(transactions) {
    transactionList.innerHTML = "";

    transactions.forEach(function (transaction) {
        var amountClass = transaction.type === "sent" ? "sent" : "received";
        var sign = transaction.type === "sent" ? "-" : "+";

        transactionList.innerHTML +=
            "<div class='transaction-item'>" +
                "<div class='item-left'>" +
                    "<span class='item-icon'>" + transaction.icon + "</span>" +
                    "<div>" +
                        "<h3>" + transaction.title + "</h3>" +
                        "<p>" + transaction.date + "</p>" +
                    "</div>" +
                "</div>" +
                "<span class='amount " + amountClass + "'>" + sign + "₹" + transaction.amount + "</span>" +
            "</div>";
    });
}

function showActivity(activities) {
    activityList.innerHTML = "";

    activities.forEach(function (activity) {
        activityList.innerHTML +=
            "<div class='activity-item'>" +
                "<div class='item-left'>" +
                    "<span class='item-icon'>" + activity.icon + "</span>" +
                    "<div>" +
                        "<h3>" + activity.title + "</h3>" +
                        "<p>" + activity.message + "</p>" +
                    "</div>" +
                "</div>" +
                "<p>" + activity.time + "</p>" +
            "</div>";
    });
}

loadDashboardSummary();
loadDashboardActivity();
