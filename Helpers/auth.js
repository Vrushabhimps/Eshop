const jsonwebtoken = require("jsonwebtoken");
let auth = (req, res, next) => {
  if (
    req.cookies.jwt &&
    jsonwebtoken.verify(req.cookies.jwt, process.env.SECRET)
  ) {
    next();
  } else {
    res.status(500).send("Please login.......!");
  }
};

module.exports = auth;
