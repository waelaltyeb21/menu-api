const { UpdateDoc } = require("../../Config/DbQueries/DbQueries");
const Hashing = require("../../Services/Hashing");
const Transporter = require("../../Services/SendMail");
const TokenGenerator = require("../../Services/TokenGenerator");
const RestaurantModel = require("../Restaurant/RestaurantModel");
const Supervisor = require("../Supervisor/Supervisor");

const ACCESS_TOKEN_LIFETIME = "15m"; // Access token lifetime
const REFRESH_TOKEN_LIFETIME = "2h"; // Refresh token lifetime

let UsersOTP = [];

const RegisterController = {
  Login: async (req, res) => {
    const { email, password } = req.body;
    try {
      const [supervisor] = await Supervisor.find({ email: email });
      if (!supervisor)
        return res.status(400).json({ msg: "Incorrect Email Or Password" });

      const restaurant = await RestaurantModel.findById(supervisor.restaurant);
      // Hashing
      // const Hashed = await Hashing.Hash(password, 10);
      const isMatched = await Hashing.Compare(password, supervisor.password);
      //   ------------------------------------------------
      if (!isMatched)
        return res.status(400).json({ msg: "Incorrect Email Or Password" });

      // Payload
      const Payload = {
        username: supervisor.username,
        email: supervisor.email,
        createdAt: supervisor.createdAt,
      };

      // Access Token
      const Token = await TokenGenerator.generate(
        Payload,
        ACCESS_TOKEN_LIFETIME
      );

      // Refresh Token
      const RefreshToken = await TokenGenerator.generate(
        Payload,
        REFRESH_TOKEN_LIFETIME
      );

      // Response
      return res
        .cookie("Token", Token, {
          maxAge: 15 * 60 * 1000,
          // httpOnly: true,
          // secure: true,
          sameSite: "None",
          path: "/",
          // domain: "https://restaurants-menu-55879.web.app",
        })
        .cookie("RefreshToken", RefreshToken, {
          maxAge: 2 * 60 * 60 * 1000,
          // httpOnly: true,
          // secure: true,
          sameSite: "None",
          path: "/",
          // domain: "https://restaurants-menu-55879.web.app",
        })
        .status(200)
        .json({
          msg: "Found",
          restaurant: restaurant,
          supervisor: {
            username: supervisor.username,
            email: supervisor.email,
            createdAt: supervisor.createdAt,
          },
          Token: Token,
          RefreshToken: RefreshToken,
        });
    } catch (error) {
      return res.status(500).json({ msg: "Somthing Went Wrong" });
    }
  },
  Refresh: async (req, res) => {
    const { username, email, createdAt } = req.body;
    try {
      const RefreshToken = req.cookies["RefreshToken"];
      // Verify Token And Refresh Token
      const VerifyRefreshToken = TokenGenerator.verifyToken(RefreshToken);
      console.log(
        "isVerified Refresh Token?",
        VerifyRefreshToken ? "Yep" : "No"
      );

      if (!VerifyRefreshToken)
        return res.status(403).json({ msg: "Invalid Refresh Token" });

      // Payload
      const Payload = {
        username: username,
        email: email,
        createdAt: createdAt,
      };

      const Token = await TokenGenerator.generate(
        Payload,
        ACCESS_TOKEN_LIFETIME
      );

      const Refresh = await TokenGenerator.generate(
        Payload,
        REFRESH_TOKEN_LIFETIME
      );

      return res
        .cookie("Token", Token, {
          maxAge: 15 * 60 * 1000,
          httpOnly: true,
          secure: true,
          sameSite: "None",
          path: "/",
          domain: "https://restaurants-menu-55879.web.app",
        })
        .cookie("RefreshToken", Refresh, {
          maxAge: 2 * 60 * 60 * 1000,
          httpOnly: true,
          secure: true,
          sameSite: "None",
          path: "/",
          domain: "https://restaurants-menu-55879.web.app",
        })
        .status(200)
        .json({
          msg: "Token Has Been Refreshed",
          token: Token,
        });
    } catch (error) {
      return res.status(500).json({ msg: "Internal Server Error" });
    }
  },
  OTPRequested: async (req, res) => {
    const { email } = req.body;
    try {
      const [SupervisorEmail] = await Supervisor.find({ email: email });
      if (!SupervisorEmail) return res.status(400).json({ msg: "Wrong Email" });

      const GenerateOTP = () => {
        let OTP = "";

        for (let i = 0; i < 6; i++) OTP += Math.floor(Math.random() * 10);
        return OTP;
      };

      const OTP = GenerateOTP();
      // console.log(`Your OTP: ${OTP}`);

      const MailOptions = {
        from: process.env.Verify_Email,
        to: email,
        subject: "Rest Your Password",
        text: `Your OTP Code Is ${OTP}`,
      };

      Transporter.sendMail(MailOptions, (error, info) => {
        if (error) {
          return res.status(500).json({ msg: "Error sending email", error });
        }
        UsersOTP.push({ OTP: OTP, Email: email });
        return res.status(200).json({ msg: "Email sent successfully", info });
      });
    } catch (error) {
      return res.status(500).json({ msg: "Internal Server Error" });
    }
  },
  CheckOTPCode: async (req, res) => {
    const { otp } = req.body;
    try {
      const OTP = UsersOTP.find((UserOTP) => UserOTP.OTP == otp);
      // console.log("User: ", otp, "Code: ", OTP, "Check: ", OTP == otp);
      if (!OTP) return res.status(400).json({ msg: "Incorrect OTP Code" });
      return res.status(200).json({ msg: `OTP Code Has Been Checked` });
    } catch (error) {
      return res
        .status(500)
        .json({ msg: "Internal Server Error", error: error });
    }
  },
  RestPassword: async (req, res) => {
    const { password, email } = req.body;
    try {
      const [supervisor] = await Supervisor.find({ email: email });
      if (!supervisor)
        return res.status(400).json({ msg: "Supervisor Not Found" });
      // Hashed Password
      const Hashed = await Hashing.Hash(password, 10);
      // Update Supervisor Password
      const UpdateSupervisorPassword = await UpdateDoc(
        Supervisor,
        supervisor._id,
        { password: Hashed }
      );
      // Delete User From Temp Array
      UsersOTP = UsersOTP.filter((UserOTP) => UserOTP.Email != email);
      // console.log("UsersOTPs: ", UsersOTP);
      return res
        .status(200)
        .json({ msg: "Password Has Been Change Successfuly" });
    } catch (error) {
      return res.status(500).json({ msg: "Internal Server Error" });
    }
  },
};
module.exports = RegisterController;
