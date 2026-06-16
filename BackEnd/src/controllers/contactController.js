function submitContactForm(req, res) {
    const name = req.body.name;
    const email = req.body.email;
    const subject = req.body.subject;
    const message = req.body.message;

    if (!name || !email || !subject || !message) {
        return res.status(400).json({
            success: false,
            message: "All fields are required."
        });
    }

    if (!isValidEmail(email)) {
        return res.status(400).json({
            success: false,
            message: "Please enter a valid email address."
        });
    }

    return res.status(200).json({
        success: true,
        message: "Thank you for contacting Garuda Pay. We will reply soon."
    });
}

function isValidEmail(email) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
}

module.exports = {
    submitContactForm
};
