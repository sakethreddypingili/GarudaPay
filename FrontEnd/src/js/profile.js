const BACKEND_BASE = window.location.port === '5055' ? '' : 'http://localhost:5055';
const menuButton = document.getElementById("menuButton");
const sidebar = document.getElementById("sidebar");
const profileForm = document.getElementById("profileForm");
const passwordForm = document.getElementById("passwordForm");

const profileName = document.getElementById("profileName");
const profileEmail = document.getElementById("profileEmail");

const profileStatus = document.getElementById("profileStatus");
const passwordStatus = document.getElementById("passwordStatus");

const profileSubmit = document.getElementById("profileSubmit");
const passwordSubmit = document.getElementById("passwordSubmit");

menuButton.addEventListener("click", function () {
    sidebar.classList.toggle("show");
});

// Load user profile on initialization
async function init() {
    const user = await checkAuthAndLoadPreferences();
    if (user) {
        profileName.value = user.name || "";
        profileEmail.value = user.email || "";
    }
}

// Handle Profile Update submit
profileForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    profileStatus.textContent = "";
    
    const name = profileName.value.trim();
    const email = profileEmail.value.trim();
    
    if (!name || !email) {
        profileStatus.textContent = "Please fill in all fields.";
        profileStatus.className = "status-msg status-error";
        return;
    }
    
    try {
        profileSubmit.textContent = "Updating...";
        profileSubmit.disabled = true;
        
        const response = await fetch(BACKEND_BASE + "/api/auth/profile", {
            method: "PUT",
            headers: getAuthHeaders({
                "Content-Type": "application/json"
            }),
            body: JSON.stringify({ name, email }),
            credentials: "include"
        });
        
        const data = await response.json();
        
        if (response.ok) {
            profileStatus.textContent = "Profile updated successfully!";
            profileStatus.className = "status-msg status-success";
            
            // Update the topbar welcome header dynamically
            const welcomeHeader = document.querySelector(".topbar h1");
            if (welcomeHeader) {
                welcomeHeader.textContent = "Welcome, " + name;
            }
        } else {
            profileStatus.textContent = data.message || "Failed to update profile.";
            profileStatus.className = "status-msg status-error";
        }
    } catch (err) {
        profileStatus.textContent = "An error occurred. Please try again.";
        profileStatus.className = "status-msg status-error";
    } finally {
        profileSubmit.textContent = "Update Details";
        profileSubmit.disabled = false;
    }
});

// Handle Password Change submit
passwordForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    passwordStatus.textContent = "";
    
    const currentPassword = document.getElementById("currentPassword").value;
    const newPassword = document.getElementById("newPassword").value;
    
    if (newPassword.length < 6) {
        passwordStatus.textContent = "New password must be at least 6 characters.";
        passwordStatus.className = "status-msg status-error";
        return;
    }
    
    try {
        passwordSubmit.textContent = "Changing...";
        passwordSubmit.disabled = true;
        
        const response = await fetch(BACKEND_BASE + "/api/auth/change-password", {
            method: "PUT",
            headers: getAuthHeaders({
                "Content-Type": "application/json"
            }),
            body: JSON.stringify({ currentPassword, newPassword }),
            credentials: "include"
        });
        
        const data = await response.json();
        
        if (response.ok) {
            passwordStatus.textContent = "Password changed successfully!";
            passwordStatus.className = "status-msg status-success";
            passwordForm.reset();
        } else {
            passwordStatus.textContent = data.message || "Failed to change password.";
            passwordStatus.className = "status-msg status-error";
        }
    } catch (err) {
        passwordStatus.textContent = "An error occurred. Please try again.";
        passwordStatus.className = "status-msg status-error";
    } finally {
        passwordSubmit.textContent = "Change Password";
        passwordSubmit.disabled = false;
    }
});

init();
