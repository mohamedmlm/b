const app = require("../app");
const connectDB = require("../data/db");

module.exports = async (req, res) => {
  try {
    await connectDB();
  } catch (error) {
    console.error("Failed to connect to database:", error);
    return res.status(500).json({ message: "Database connection failed" });
  }
  return app(req, res);
};