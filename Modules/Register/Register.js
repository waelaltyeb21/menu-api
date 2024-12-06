const express = require("express");
const RegisterController = require("./RegisterController");
const Register = express.Router();

Register.post("/login", RegisterController.login);

module.exports = Register;
