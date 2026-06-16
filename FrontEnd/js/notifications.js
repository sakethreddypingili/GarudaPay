var menuButton = document.getElementById("menuButton");
var sidebar = document.getElementById("sidebar");
var notificationsList = document.getElementById("notificationsList");

menuButton.addEventListener("click", function () {
    sidebar.classList.toggle("show");
});

// This loads notifications from the backend API.
async function loadNotifications() {
    try {
        var response = await fetch("/api/notifications");
        var notifications = await response.json();

        notificationsList.innerHTML = "";

        notifications.forEach(function (notification) {
            notificationsList.innerHTML +=
                "<div class='notification-card'>" +
                    "<div class='item-left'>" +
                        "<span class='item-icon'>" + notification.icon + "</span>" +
                        "<div>" +
                            "<h3>" + notification.message + "</h3>" +
                            "<p>" + notification.date + "</p>" +
                        "</div>" +
                    "</div>" +
                    "<span class='status'>" + notification.status + "</span>" +
                "</div>";
        });
    } catch (error) {
        notificationsList.innerHTML = "<p class='empty-text'>Start the backend server to view notifications.</p>";
    }
}

loadNotifications();
