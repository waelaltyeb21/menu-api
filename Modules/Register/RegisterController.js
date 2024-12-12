const TokenGenerator = require("../../Services/TokenGenerator");
const RestaurantModel = require("../Restaurant/RestaurantModel");
const Supervisor = require("../Supervisor/Supervisor");

const RegisterController = {
  login: async (req, res) => {
    const { email, password } = req.body;
    try {
      const [supervisor] = await Supervisor.find({ email: email });
      if (!supervisor)
        return res.status(400).json({ msg: "Incorrect Email Or Password" });
      //   ------------------------------------------------
      const restaurant = await RestaurantModel.findById(supervisor.restaurant);
      //   ------------------------------------------------
      // Hashing
      //   ------------------------------------------------
      if (supervisor.password != password)
        return res.status(400).json({ msg: "Incorrect Email Or Password" });
      //   ------------------------------------------------
      // Token
      const payload = {
        email: supervisor.email,
        createdAt: supervisor.createdAt,
      };
      const token = await TokenGenerator.generate(payload);
      return res
        .status(200)
        .cookie("Token", token, { 
          maxAge: 604800000,
          httpOnly: true,
          secure: true, // Ensures the cookie is only sent over HTTPS
          sameSite: 'Strict',
          path: '/'
        })
        .cookie("Restaurant", restaurant , { 
          maxAge: 604800000,
          httpOnly: true,
          secure: true, // Ensures the cookie is only sent over HTTPS
          sameSite: 'Strict',
          path: '/' 
        })
        .json({
          msg: "Found",
          supervisor: supervisor,
          restaurant: restaurant,
          token: token,
        });
    } catch (error) {
      return res.status(500).json({ msg: "Somthing Went Wrong" });
    }
  },
};
module.exports = RegisterController;
