var menuButton = document.getElementById("menuButton");
var navLinks = document.getElementById("navLinks");

// This opens and closes the mobile navigation menu.
menuButton.addEventListener("click", function () {
    navLinks.classList.toggle("show");
});
