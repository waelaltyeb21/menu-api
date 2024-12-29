const jwt = require("jsonwebtoken");

const SECRET_KEY = process.env.SECRET_KEY;

const TokenGenerator = {
  // Generate Token
  generate: async (payload, LIFE_TIME = "7m") => {
    try {
      const token = jwt.sign(payload, SECRET_KEY, {
        expiresIn: LIFE_TIME,
      });
      if (token) return token;
    } catch (error) {
      return null;
    }
  },
  // Verify Token
  verifyToken: async (token) => {
    try {
      const DecodedToken = jwt.verify(token, SECRET_KEY);
      return DecodedToken;
    } catch (error) {
      return null;
    }
  },
};
module.exports = TokenGenerator;
