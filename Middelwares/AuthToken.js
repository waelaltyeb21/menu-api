const AuthChecker = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  //   console.log(req.url);
  if (req.url === "/api/register/login") return next();
  if (authHeader != undefined && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    console.log("Token: ", token);
    req.token = token;
    next();
  } else {
    req.token = null;
    return res.status(401).json({ msg: "Access Denied!" });
  }
};

module.exports = { AuthChecker };
