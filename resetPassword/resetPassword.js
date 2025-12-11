// resetPassword.js
const userModel = require(`${__dirname}/../Models/userModel`);
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const { Resend } = require("resend");

// initialize resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Temporary storage for reset codes
let resetCodes = {};  // { "email@example.com": { code: "123456", verified: false } }

// SEND RESET CODE
async function sendResetCode(req, res) {
    const { email } = req.body;

    try {
        // Check if user exists
        const user = await userModel.findOne({ email });
        if (!user)
            return res.status(404).json({ message: "Email not registered" });

        // Generate 6-digit code
        const code = crypto.randomInt(100000, 999999).toString();

        resetCodes[email] = { code, verified: false };

        // Send email using Resend
        await resend.emails.send({
            from: "System <onboarding@resend.dev>",   // لازم يكون verified domain or default
            to: email,
            subject: "Password Reset Code",
            text: `Your reset code is: ${code}`
        });

        return res.json({ message: "Reset code sent successfully!" });
    }
    catch (err) {
        return res.status(500).json({
            message: "Failed to send email",
            error: err
        });
    }
}

// VERIFY CODE
function verifyResetCode(req, res) {
    const { email, code } = req.body;

    if (resetCodes[email] && resetCodes[email].code === code) {
        resetCodes[email].verified = true;
        return res.json({ valid: true });
    }
    return res.json({ valid: false });
}

// RESET PASSWORD
async function resetPassword(req, res) {
    const { email, newPassword } = req.body;

    if (!resetCodes[email] || !resetCodes[email].verified) {
        return res.status(401).json({ message: "Please enter a valid code" });
    }

    const user = await userModel.findOne({ email });
    if (!user)
        return res.status(404).json({ message: "Email not found" });

    const hashed = await bcrypt.hash(newPassword, 10);
    await userModel.findOneAndUpdate({ email }, { password: hashed });

    delete resetCodes[email];

    return res.json({ message: "Password changed successfully!" });
}

module.exports = { sendResetCode, verifyResetCode, resetPassword };
