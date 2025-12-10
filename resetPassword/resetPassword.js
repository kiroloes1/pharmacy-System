// resetPassword.js
const userModel = require(`${__dirname}/../Models/userModel`);
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const bcrypt = require("bcrypt");

// Temporary storage for reset codes
let resetCodes = {};  // { "email@example.com": { code: "123456", verified: false } }

// SEND RESET CODE
async function sendResetCode(req, res) {
    const { email } = req.body;

    // Check if user exists
    const user = await userModel.findOne({ email });
    if (!user) return res.status(404).json({ message: "Email not registered" });

    // Generate 6-digit code
    const code = crypto.randomInt(100000, 999999).toString();
    resetCodes[email] = { code, verified: false };

    // Gmail SMTP (or Outlook)
    const transporter = nodemailer.createTransport({
          host: "smtp.gmail.com",
          port: 465,        // SSL
          secure: true,
  
        auth: {
            user: "kiroloesreda@gmail.com",
            pass: "xyyw gyzs omqu mzia"
        }
    });

    const mailOptions = {
        from: "kiroloesreda@gmail.com",
        to: email,
        subject: "Password Reset Code",
        text: `Your reset code is: ${code}`
    };

    transporter.sendMail(mailOptions, (err) => {
        if (err) return res.status(500).json({ message: "Failed to send email", error: err });
        res.json({ message: "Reset code sent successfully!" });
    });
}

// VERIFY CODE
function verifyResetCode(req, res) {
    const { email, code } = req.body;

    if (resetCodes[email] && resetCodes[email].code === code) {
        resetCodes[email].verified = true;
        return res.json({ valid: true });
    }
    res.json({ valid: false });
}

// RESET PASSWORD
async function resetPassword(req, res) {
    const { email, newPassword } = req.body;

    if (!resetCodes[email] || !resetCodes[email].verified) {
        return res.status(401).json({ message: "Please enter a valid code" });
    }

    const user = await userModel.findOne({ email });
    if (!user) return res.status(404).json({ message: "Email not found" });

    const hashed = await bcrypt.hash(newPassword, 10);
    await userModel.findOneAndUpdate({ email }, { password: hashed });

    // remove used code
    delete resetCodes[email];

    res.json({ message: "Password changed successfully!" });
}

module.exports = { sendResetCode, verifyResetCode, resetPassword };


