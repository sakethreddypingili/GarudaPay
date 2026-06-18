var menuButton = document.getElementById("menuButton");
var sidebar = document.getElementById("sidebar");
var notificationsList = document.getElementById("notificationsList");

menuButton.addEventListener("click", function () {
    sidebar.classList.toggle("show");
});

// This loads notifications from the backend API.
async function loadNotifications() {
    try {
        var response = await fetch("/api/notifications", { credentials: "include" });
        var notifications = await response.json();

        notificationsList.innerHTML = "";

        if (notifications.length === 0) {
            notificationsList.innerHTML = "<p class='empty-text'>No notifications found.</p>";
            return;
        }

        notifications.forEach(function (notification) {
            var badgeClass = notification.status === "New" ? "status-new" : "status-read";
            notificationsList.innerHTML +=
                "<div class='notification-card'>" +
                    "<div class='item-left'>" +
                        "<span class='item-icon'>" + notification.icon + "</span>" +
                        "<div>" +
                            "<h3>" + notification.message + "</h3>" +
                            "<p>" + notification.date + "</p>" +
                        "</div>" +
                    "</div>" +
                    "<span class='status " + badgeClass + "'>" + notification.status + "</span>" +
                "</div>";
        });
    } catch (error) {
        notificationsList.innerHTML = "<p class='empty-text'>Start the backend server to view notifications.</p>";
    }
}

// Check session and load page data
async function init() {
    const user = await checkAuthAndLoadPreferences();
    if (user) {
        loadNotifications();
    }
}

init();
