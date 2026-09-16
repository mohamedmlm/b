const User = require("../../data/user.shema");

module.exports = async (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const result = await User.deleteMany({
      isEmailVerified: false,
      timetodeleteuser: { $lte: Date.now() },
    });

    return res.status(200).json({
      message: "Cleanup completed",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Cleanup error:", error);
    return res.status(500).json({ message: "Cleanup failed" });
  }
};   