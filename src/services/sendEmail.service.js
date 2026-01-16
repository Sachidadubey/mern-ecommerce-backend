const transporter = require("../config/email");

exports.sendEmail = async (to,subject, html) => {
  const mailOptions = {
    from: `"MyApp Support" <${process.env.SMTP_EMAIL}>`,
    to,
    subject,
    html,
  };

  await transporter.sendMail(mailOptions);
};
