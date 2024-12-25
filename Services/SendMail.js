const nodemailer = require("nodemailer");

const Transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.Verify_Email,
    pass: process.env.App_Pass,
  },
});

module.exports = Transporter;
