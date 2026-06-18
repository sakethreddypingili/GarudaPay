// Global authentication check for protected dashboard pages
async function checkAuthAndLoadPreferences() {
    try {
        const response = await fetch("/api/auth/me", { credentials: "include" });
        if (!response.ok) {
            // Not authenticated, redirect to login page
            window.location.href = "index.html";
            return null;
        }
        
        const data = await response.json();
        const user = data.user;
        
        // Populate welcome text if it exists
        const welcomeHeader = document.querySelector(".topbar h1");
        if (welcomeHeader) {
            welcomeHeader.textContent = "Welcome, " + user.name;
        }

        // Apply theme preference
        if (user.preferences && user.preferences.theme === "dark") {
            document.body.classList.add("dark-theme");
        } else {
            document.body.classList.remove("dark-theme");
        }
        
        return user;
    } catch (error) {
        console.error("Auth check failed:", error);
        window.location.href = "index.html";
        return null;
    }
}

// Handle Logout click
document.addEventListener("DOMContentLoaded", () => {
    // Find logout navigation link
    const logoutLinks = document.querySelectorAll('a[href="landing.html"], a:has(text="Logout")');
    logoutLinks.forEach(link => {
        // If it's a sidebar logout link
        if (link.textContent.trim().toLowerCase() === "logout") {
            link.addEventListener("click", async (e) => {
                e.preventDefault();
                try {
                    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
                } catch (err) {
                    console.error("Logout error:", err);
                }
                window.location.href = "landing.html";
            });
        }
    });
});
