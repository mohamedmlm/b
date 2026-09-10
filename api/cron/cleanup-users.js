const connectDB = require("../../data/db");
const User = require("../../data/user.shema");

module.exports = async (req, res) => {
  // حماية الـ endpoint عشان محدش يقدر يستدعيه من برا غير Vercel Cron نفسه
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    await connectDB();

    const result = await User.deleteMany({
      isEmailVerified: false,
      timetodeleteuser: { $lte: Date.now() },
    });

    if (result.deletedCount > 0) {
      console.log(
        `Deleted ${result.deletedCount} user(s) with unverified email`
      );
    }

    return res.status(200).json({
      message: "Cleanup completed",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Cleanup error:", error);
    return res.status(500).json({ message: "Cleanup failed" });
  }
};