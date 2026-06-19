const BACKEND_BASE = window.location.port === '5055' ? '' : 'http://localhost:5055';
const menuButton = document.getElementById("menuButton");
const sidebar = document.getElementById("sidebar");
const preferencesForm = document.getElementById("preferencesForm");

const themeSelect = document.getElementById("themeSelect");
const currencySelect = document.getElementById("currencySelect");
const notificationsCheckbox = document.getElementById("notificationsCheckbox");

const settingsStatus = document.getElementById("settingsStatus");
const settingsSubmit = document.getElementById("settingsSubmit");

menuButton.addEventListener("click", function () {
    sidebar.classList.toggle("show");
});

// Load user preferences on initialization
async function init() {
    const user = await checkAuthAndLoadPreferences();
    if (user && user.preferences) {
        themeSelect.value = user.preferences.theme || "light";
        currencySelect.value = user.preferences.currency || "INR";
        notificationsCheckbox.checked = user.preferences.notificationsEnabled !== false;
    }
}

// Dynamically preview theme change
themeSelect.addEventListener("change", () => {
    if (themeSelect.value === "dark") {
        document.body.classList.add("dark-theme");
    } else {
        document.body.classList.remove("dark-theme");
    }
});

// Handle Preferences Form submission
preferencesForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    settingsStatus.textContent = "";
    
    const theme = themeSelect.value;
    const currency = currencySelect.value;
    const notificationsEnabled = notificationsCheckbox.checked;
    
    try {
        settingsSubmit.textContent = "Saving...";
        settingsSubmit.disabled = true;
        
        const response = await fetch(BACKEND_BASE + "/api/auth/preferences", {
            method: "PUT",
            headers: getAuthHeaders({
                "Content-Type": "application/json"
            }),
            body: JSON.stringify({ theme, currency, notificationsEnabled }),
            credentials: "include"
        });
        
        const data = await response.json();
        
        if (response.ok) {
            settingsStatus.textContent = "Preferences saved successfully!";
            settingsStatus.className = "status-msg status-success";
        } else {
            settingsStatus.textContent = data.message || "Failed to save preferences.";
            settingsStatus.className = "status-msg status-error";
        }
    } catch (err) {
        settingsStatus.textContent = "An error occurred. Please try again.";
        settingsStatus.className = "status-msg status-error";
    } finally {
        settingsSubmit.textContent = "Save Preferences";
        settingsSubmit.disabled = false;
    }
});

init();
