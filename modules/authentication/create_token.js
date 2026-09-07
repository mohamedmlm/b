const jwt = require("jsonwebtoken");

module.exports = (payload, options = { expiresIn: "30d" }) => {
  const secret = process.env.JWT_SECRET;


  return jwt.sign(payload, secret, options);
};
