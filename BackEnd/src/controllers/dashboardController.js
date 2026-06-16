function getDashboardSummary(req, res) {
    res.json({
        walletBalance: 5000,
        totalSent: 2000,
        totalReceived: 3000,
        totalTransactions: 15
    });
}

function getRecentActivity(req, res) {
    res.json({
        transactions: [
            {
                id: 1,
                title: "Paid to Ananya",
                amount: 450,
                type: "sent",
                date: "Today, 10:15 AM",
                icon: "S"
            },
            {
                id: 2,
                title: "Received from Rahul",
                amount: 1200,
                type: "received",
                date: "Today, 09:40 AM",
                icon: "R"
            },
            {
                id: 3,
                title: "Electricity Bill",
                amount: 850,
                type: "sent",
                date: "Yesterday",
                icon: "B"
            }
        ],
        activities: [
            {
                id: 1,
                title: "Wallet Updated",
                message: "₹1,000 added to your wallet.",
                time: "5 min ago",
                icon: "W"
            },
            {
                id: 2,
                title: "Money Sent",
                message: "Payment to Ananya completed.",
                time: "1 hour ago",
                icon: "S"
            },
            {
                id: 3,
                title: "System Notification",
                message: "Your account security check passed.",
                time: "Today",
                icon: "N"
            }
        ]
    });
}

module.exports = {
    getDashboardSummary,
    getRecentActivity
};
