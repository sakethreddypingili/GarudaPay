// Global authentication check for protected dashboard pages
const BACKEND_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port !== '5055' ? 'http://localhost:5055' : '';

function getAuthHeaders(headers = {}) {
    const token = localStorage.getItem('token');
    const newHeaders = { ...headers };
    if (token) {
        newHeaders['Authorization'] = `Bearer ${token}`;
    }
    return newHeaders;
}

async function checkAuthAndLoadPreferences() {
    try {
        const response = await fetch(BACKEND_BASE + "/api/auth/me", { 
            headers: getAuthHeaders(),
            credentials: "include" 
        });
        if (!response.ok) {
            // Not authenticated, redirect to login page
            window.location.href = "../../index.html";
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
        window.location.href = "../../index.html";
        return null;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    // Find logout navigation link
    const logoutLinks = document.querySelectorAll('a');
    logoutLinks.forEach(link => {
        // If it's a sidebar logout link
        if (link.textContent.trim().toLowerCase() === "logout" || link.id === "sideNavLogout") {
            link.addEventListener("click", async (e) => {
                e.preventDefault();
                try {
                    await fetch(BACKEND_BASE + "/api/auth/logout", { 
                        method: "POST", 
                        headers: getAuthHeaders(),
                        credentials: "include" 
                    });
                } catch (err) {
                    console.error("Logout error:", err);
                }
                localStorage.removeItem('token');
                window.location.href = "../../index.html";
            });
        }
    });
});
