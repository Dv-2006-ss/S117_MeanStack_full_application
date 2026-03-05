const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    let token = req.headers.authorization;

    if (!token)
      return res.status(401).json({ message: "No token provided" });
    

    // remove Bearer if present (optional support)
    if (token.startsWith("Bearer "))
      token = token.slice(7);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;
    next();

  } catch (err) {
    console.log("JWT ERROR:", err.message);
    res.status(401).json({ message: "Invalid token" });
  }
};