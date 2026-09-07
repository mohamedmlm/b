const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  },
});

transporter.verify((error) => {
  if (error) {
    console.log("❌ Error:", error);
  } else {
    console.log("✅  to send Server is readyemails");
  }
});

const sendVerificationCode = async (email, code) => {
    try {
        const mailOptions = {
            from: `"Crocs Store" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: "Email Verification Code",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Email Verification</h2>
                    <p>Thank you for registering! Please use the following verification code:</p>
                    <div style="background-color: #f4f4f4; padding: 15px; font-size: 24px; font-weight: bold; text-align: center; letter-spacing: 5px;">
                        ${code}
                    </div>
                    <p>This code will expire in 10 minutes.</p>
                    <p>If you didn't request this, please ignore this email.</p>
                    <hr>
                    <p style="color: #666; font-size: 12px;">This is an automated message, please do not reply.</p>
                </div>
            `
        };
        
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error("Error sending email:", error);
        return false;
    }
};

module.exports = {
    sendVerificationCode
};