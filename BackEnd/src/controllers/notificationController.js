function getNotifications(req, res) {
    res.json([
        {
            id: 1,
            message: "Money Sent Successfully",
            date: "Today",
            status: "Read",
            icon: "S"
        },
        {
            id: 2,
            message: "Money Received from Rahul",
            date: "Today",
            status: "New",
            icon: "R"
        },
        {
            id: 3,
            message: "Wallet Updated with ₹1,000",
            date: "Yesterday",
            status: "Read",
            icon: "W"
        },
        {
            id: 4,
            message: "System Notification: Security check completed",
            date: "2 days ago",
            status: "Read",
            icon: "N"
        }
    ]);
}

module.exports = {
    getNotifications
};
