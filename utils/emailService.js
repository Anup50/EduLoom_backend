const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, text, html, replyTo = null) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD, // Use the 16-char app password without spaces
      },
    });

    const mailOptions = {
      from: `"EduLoom" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    };

    // Add reply-to if provided
    if (replyTo) {
      mailOptions.replyTo = replyTo;
    }

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent: ", info.response);
  } catch (error) {
    console.error("❌ Error sending email:", error);
    throw new Error("Email could not be sent");
  }
};

module.exports = { sendEmail };
