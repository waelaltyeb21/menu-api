const express = require("express");
const RegisterController = require("./RegisterController");
const Register = express.Router();

Register.post("/login", RegisterController.Login);
Register.post("/refresh", RegisterController.Refresh);
Register.post("/verify_email", RegisterController.OTPRequested);
Register.post("/check_otp", RegisterController.CheckOTPCode);
Register.post("/reset_password", RegisterController.RestPassword);

module.exports = Register;
