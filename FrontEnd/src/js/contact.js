const BACKEND_BASE = window.location.port === '5055' ? '' : 'http://localhost:5055';
var menuButton = document.getElementById("menuButton");
var navLinks = document.getElementById("navLinks");
var contactForm = document.getElementById("contactForm");
var formStatus = document.getElementById("formStatus");
var submitButton = document.getElementById("submitButton");

menuButton.addEventListener("click", function () {
    navLinks.classList.toggle("show");
});

contactForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    var name = document.getElementById("name").value.trim();
    var email = document.getElementById("email").value.trim();
    var subject = document.getElementById("subject").value.trim();
    var message = document.getElementById("message").value.trim();
    var isValid = true;

    clearErrors();
    formStatus.textContent = "";

    if (name === "") {
        showError("nameError", "Please enter your name.");
        isValid = false;
    }

    if (email === "") {
        showError("emailError", "Please enter your email.");
        isValid = false;
    } else if (!isValidEmail(email)) {
        showError("emailError", "Please enter a valid email address.");
        isValid = false;
    }

    if (subject === "") {
        showError("subjectError", "Please enter a subject.");
        isValid = false;
    }

    if (message === "") {
        showError("messageError", "Please enter your message.");
        isValid = false;
    }

    if (isValid) {
        await sendContactMessage(name, email, subject, message);
    }
});

// This sends the contact form data to the Express backend.
async function sendContactMessage(name, email, subject, message) {
    try {
        submitButton.textContent = "Sending...";
        submitButton.disabled = true;

        var response = await fetch(BACKEND_BASE + "/api/contact", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: name,
                email: email,
                subject: subject,
                message: message
            })
        });

        var result = await response.json();

        if (response.ok) {
            formStatus.textContent = result.message;
            formStatus.className = "form-status success";
            contactForm.reset();
        } else {
            formStatus.textContent = result.message;
            formStatus.className = "form-status error";
        }
    } catch (error) {
        formStatus.textContent = "Please start the backend server and try again.";
        formStatus.className = "form-status error";
    }

    submitButton.textContent = "Submit Message";
    submitButton.disabled = false;
}

function showError(id, message) {
    document.getElementById(id).textContent = message;
}

function clearErrors() {
    document.getElementById("nameError").textContent = "";
    document.getElementById("emailError").textContent = "";
    document.getElementById("subjectError").textContent = "";
    document.getElementById("messageError").textContent = "";
}

function isValidEmail(email) {
    var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
}
