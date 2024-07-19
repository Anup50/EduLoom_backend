const { sendEmail } = require("../utils/emailService");
const { contactValidation } = require("../validation/ContactValidation");

const submitContactForm = async (req, res) => {
  try {
    // Validate input data
    const { error, value } = contactValidation.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { name, email, subject, inquiry } = value;

    // HTML template for the contact email
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
          New Contact Form Submission - EduLoom
        </h2>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #2c3e50; margin-top: 0;">Contact Details:</h3>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Subject:</strong> ${subject}</p>
        </div>
        
        <div style="background-color: #ffffff; padding: 20px; border: 1px solid #dee2e6; border-radius: 8px;">
          <h3 style="color: #2c3e50; margin-top: 0;">Inquiry:</h3>
          <p style="line-height: 1.6; white-space: pre-wrap;">${inquiry}</p>
        </div>
        
        <div style="margin-top: 20px; padding: 15px; background-color: #e8f4f8; border-radius: 8px;">
          <p style="margin: 0; font-size: 14px; color: #555;">
            This message was sent through the EduLoom contact form.
            Please respond to: <a href="mailto:${email}">${email}</a>
          </p>
        </div>
      </div>
    `;

    // Plain text version
    const textContent = `
New Contact Form Submission - EduLoom

Name: ${name}
Email: ${email}
Subject: ${subject}

Inquiry:
${inquiry}

This message was sent through the EduLoom contact form.
Please respond to: ${email}
    `;

    // Send email to admin/support team with proper reply-to
    await sendEmail(
      process.env.ADMIN_EMAIL || process.env.EMAIL_USER, // Send to admin email
      `Contact Form: ${subject}`,
      textContent,
      htmlContent,
      email // Reply-to email (sender's email)
    );

    // Send confirmation email to user
    const confirmationHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #27ae60;">Thank you for contacting EduLoom!</h2>
        
        <p>Dear ${name},</p>
        
        <p>We have received your inquiry and will get back to you as soon as possible.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #2c3e50; margin-top: 0;">Your Message Summary:</h3>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Inquiry:</strong></p>
          <p style="font-style: italic;">${inquiry.substring(0, 200)}${
      inquiry.length > 200 ? "..." : ""
    }</p>
        </div>
        
        <p>Best regards,<br>The EduLoom Team</p>
      </div>
    `;

    const confirmationText = `
Thank you for contacting EduLoom!

Dear ${name},

We have received your inquiry and will get back to you as soon as possible.

Your Message Summary:
Subject: ${subject}
Inquiry: ${inquiry.substring(0, 200)}${inquiry.length > 200 ? "..." : ""}

Best regards,
The EduLoom Team
    `;

    await sendEmail(
      email,
      "Thank you for contacting EduLoom",
      confirmationText,
      confirmationHtml
    );

    res.status(200).json({
      success: true,
      message:
        "Your message has been sent successfully. We'll get back to you soon!",
    });
  } catch (error) {
    console.error("❌ Error in contact form submission:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send your message. Please try again later.",
    });
  }
};

module.exports = {
  submitContactForm,
};
