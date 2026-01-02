const nodemailer = require("nodemailer");
const asyncHandler = require("../utils/asyncHandler");

const sendEmail = asyncHandler(async (email, subject, message) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  await transporter.sendMail({
    from: "Ecommerce WebPAge",
    to: email,
    subject,
    text: message
  });

});

module.exports = sendEmail;

 // send email variable -> transport variable_ > { service-> gmai,}, { auth: { EmailUSer, EmailPassword } }------ Authentication credentials used to login to email server.
 // transport.sendEmail->{from:, to->email,subject,text->message}createTransport() → connects to mail server
// 2️⃣ sendMail() → sends email