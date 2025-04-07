const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (token == null) return res.sendStatus(401); // if there isn't any token

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.error("JWT Error:", err.message);
      return res.sendStatus(403); // Invalid token
    }
    req.user = user; // Add decoded user payload to request object
    next(); // pass the execution off to whatever request the client intended
  });
}

module.exports = authenticateToken;
