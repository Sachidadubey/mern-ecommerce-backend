const transporter = require("../config/email");

exports.sendEmail = async (to, subject, html) => {
  try {
    const mailOptions = {
      from: `"MyApp Support" <${process.env.SMTP_EMAIL}>`,
      to,
      subject,
      html,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('Email sending failed:', error.message);
    throw error;
  }
};
