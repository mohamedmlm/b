const jwt = require("jsonwebtoken");
const User = require("../../data/user.shema");

const getTokenFromRequest = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }

  return req.cookies?.chater_token || null;
};

const authHead = async (req, res, next) => {
  const token = getTokenFromRequest(req);
  if (!token) {
    return res
      .status(401)
      .json({ msg: "Authorization header or cookie missing or malformed" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ msg: "User no longer exists" });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ msg: "Invalid or expired token" });
  }
};

module.exports = authHead;
