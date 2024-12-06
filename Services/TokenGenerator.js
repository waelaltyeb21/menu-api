const jwt = require("jsonwebtoken");

const TokenGenerator = {
  // Generate Token
  generate: async (payload) => {
    const token = jwt.sign(payload, process.env.SECRET_KEY, {
      expiresIn: "1h",
    });
    if (token) return token;
  },
  // Verify Token
  verifyToken: async (token) => {
    const DecodedToken = jwt.verify(token, process.env.SECRET_KEY);
    console.log(DecodedToken);
    return DecodedToken;
  },
};
module.exports = TokenGenerator;
