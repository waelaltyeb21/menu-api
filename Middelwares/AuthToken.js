const TokenGenerator = require("../Services/TokenGenerator");

const AuthChecker = async (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (req.url === "/api/register/login" || req.url === "/api/register/refresh")
    return next();

  if (authHeader != undefined && authHeader.startsWith("Bearer ")) {
    const Token = authHeader.split(" ")[1];

    // If There Is No Token
    if (!Token) return res.status(403).json({ msg: "UnAuthrized User" });

    // Verify Token And Refresh Token
    const VerifyTokenAccess = TokenGenerator.verifyToken(Token);
    console.log("isVerified Token: ", VerifyTokenAccess ? "Yep" : "No");

    if (!VerifyTokenAccess)
      return res.status(401).json({ msg: "Invalid Token" });

    // Go Ahead
    req.token = Token;
    next();
  } else {
    req.token = null;
    console.info("No Token");
    return res.status(401).json({ msg: "Access Denied!" });
  }
};

module.exports = { AuthChecker };
