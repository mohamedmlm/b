const User = require("../data/user.shema");
const bcrypt = require("bcryptjs");
const { promisify } = require("util");
// promisified wrappers so existing `await bcrypt.hash/compare` usage continues to work
const bcryptHash = promisify(bcrypt.hash);
const bcryptCompare = promisify(bcrypt.compare);
const sanitizeHtml = require("sanitize-html");
const asyncwrapper = require("../modules/error/asyncwrapper");
const createToken = require("../modules/authentication/create_token");
const role = require("../modules/authentication/role");
const measurePasswordStrength = require("../modules/validator/passpowval");
const {
  sendVerificationCode,
} = require("../modules/gmail_verfication/gmail_information");
const Comment = require("../data/comment.shema");
const Item = require("../data/item.shema");
const Pay = require("../data/pay.shema");
require("dotenv").config();

const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const setAuthCookie = (res, token) => {
  res.cookie("chater_token", token, {
    httpOnly: true,
    sameSite: "none",
    secure: true,
    path: "/",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
};

const register = asyncwrapper(async (req, res) => {
  const { email, password } = req.body;

  const name = sanitizeHtml(req.body.name || "", {
    allowedTags: [],
    allowedAttributes: {},
  }).trim();

  const username = sanitizeHtml(req.body.username || "", {
    allowedTags: [],
    allowedAttributes: {},
  }).trim();

  if (!email || !password || !name || !username) {
    return res.status(400).json({ msg: "All fields are required" });
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    return res.status(400).json({ msg: "Invalid email format" });
  }

  if (
    measurePasswordStrength(password).level !== "strong" &&
    measurePasswordStrength(password).level !== "very strong"
  ) {
    return res.status(400).json({
      msg: "Please choose a stronger password.",
    });
  }

  if (emailPattern.test(username)) {
    return res.status(400).json({
      msg: "Username cannot be an email address",
    });
  }

  const existingEmail = await User.findOne({ email });
  const existingUsername = await User.findOne({ username });

  if (existingEmail || existingUsername) {
    return res.status(400).json({
      msg: existingEmail ? "Email already exists" : "Username already exists",
    });
  }

  const hashedPassword = await bcryptHash(password, 10);

  const verificationCode = generateVerificationCode();
  const hashedVerificationCode = await bcryptHash(verificationCode, 10);

  const emailSent = await sendVerificationCode(email, verificationCode);
  if (!emailSent) {
    return res.status(500).json({ msg: "Failed to send verification email" });
  }

  await User.create({
    name,
    username,
    email,
    password: hashedPassword,
    verificationCode: hashedVerificationCode,
    role: process.env.MANAGER.split(',').map(e => e.trim().toLowerCase()).includes(email.toLowerCase())? role.MANAGER: role.USER,   
    isEmailVerified: false,
    avatar: req.file ? req.file.blobUrl : ".jp",
    timetodeleteuser: Date.now() + 10 * 60 * 1000,
    notExpiredUntil: Date.now() + 10 * 60 * 1000,
  });

  res.status(201).json({
    message: "User registered successfully. Please verify your email.",
    email: email,
    expiresIn: "10 minutes",
  });
});

const verfication_register = asyncwrapper(async (req, res) => {
  const { email, verificationCode } = req.body;

  if (!email || !verificationCode) {
    return res
      .status(400)
      .json({ msg: "Email and verification code are required" });
  }

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ msg: "User not found" });

  if (user.isEmailVerified) {
    return res.status(400).json({ msg: "Email already verified" });
  }

  if (!user.notExpiredUntil || user.notExpiredUntil <= Date.now()) {
    return res.status(400).json({
      msg: "The verification code has expired. Please register again.",
    });
  }

  const isMatch = await bcryptCompare(
    verificationCode.toString(),
    user.verificationCode,
  );
  if (!isMatch)
    return res.status(400).json({ msg: "Invalid verification code" });

  user.isEmailVerified = true;
  user.verificationCode = null;
  user.notExpiredUntil = null;
  user.timetodeleteuser = null;
  await user.save();

  const token = createToken({
    id: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
  });

  setAuthCookie(res, token);

  res.status(200).json({
    msg: "Email verified successfully",
    token,
  });
});

const login = asyncwrapper(async (req, res) => {
  const { password } = req.body;
  const usernameOrEmail = sanitizeHtml(req.body.username || "", {
    allowedTags: [],
    allowedAttributes: {},
  }).trim();

  if (!usernameOrEmail || !password) {
    return res
      .status(400)
      .json({ message: "Username/email and password are required" });
  }

  let user = await User.findOne({ email: usernameOrEmail });

  if (!user) {
    user = await User.findOne({ username: usernameOrEmail });
  }

  if (!user) {
    return res
      .status(400)
      .json({ message: "Invalid username/email or password" });
  }

  const isPasswordValid = await bcryptCompare(password, user.password);
  if (!isPasswordValid) {
    return res
      .status(400)
      .json({ message: "Invalid username/email or password" });
  }

  if (!user.isEmailVerified) {
    return res.status(403).json({ message: "Please verify your email first" });
  }

  const verificationCode = generateVerificationCode();
  const hashedVerificationCode = await bcryptHash(verificationCode, 10);

  user.verificationCode = hashedVerificationCode;
  user.notExpiredUntil = Date.now() + 10 * 60 * 1000;
  await user.save();

  const emailSent = await sendVerificationCode(user.email, verificationCode);
  if (!emailSent) {
    return res.status(500).json({ msg: "Failed to send verification email" });
  }

  res.status(200).json({
    message:
      "Verification code sent to email. Please verify to complete login.",
    email: user.email,
    expiresIn: "10 minutes",
  });
});

const verfication_login = asyncwrapper(async (req, res) => {
  const { email, verificationCode } = req.body;

  if (!email || !verificationCode) {
    return res
      .status(400)
      .json({ msg: "Email and verification code are required" });
  }

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ msg: "User not found" });

  if (!user.notExpiredUntil || user.notExpiredUntil <= Date.now()) {
    return res
      .status(400)
      .json({ msg: "Verification code expired. Please login again." });
  }

  const isMatch = await bcryptCompare(
    verificationCode.toString(),
    user.verificationCode,
  );
  if (!isMatch)
    return res.status(400).json({ msg: "Invalid verification code" });

  user.verificationCode = null;
  user.notExpiredUntil = null;
  await user.save();

  const token = createToken({
    id: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
  });

  setAuthCookie(res, token);

  res.status(200).json({
    message: "Login successful",
    token,
  });
});

const forgotpassword = asyncwrapper(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ msg: "Email is required" });
  }
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ msg: "User not found" });
  const verificationCode = generateVerificationCode();
  const hashedVerificationCode = await bcryptHash(verificationCode, 10);
  user.verificationCode = hashedVerificationCode;
  user.notExpiredUntil = Date.now() + 10 * 60 * 1000;
  await user.save();
  const emailSent = await sendVerificationCode(email, verificationCode);
  if (!emailSent) {
    return res.status(500).json({ msg: "Failed to send verification email" });
  }
  res.status(200).json({
    message:
      "Verification code sent to email. Please verify to reset password.",
    email: email,
    expiresIn: "10 minutes",
  });
});

const verfication_forgotpassword = asyncwrapper(async (req, res) => {
  const { email, verificationCode, newPassword } = req.body;
  if (!email || !verificationCode || !newPassword) {
    return res
      .status(400)
      .json({ msg: "Email, verification code and new password are required" });
  }
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ msg: "User not found" });
  if (!user.notExpiredUntil || user.notExpiredUntil <= Date.now()) {
    return res
      .status(400)
      .json({ msg: "Verification code expired. Please try again." });
  }
  const isMatch = await bcryptCompare(
    verificationCode.toString(),
    user.verificationCode,
  );
  if (!isMatch)
    return res.status(400).json({ msg: "Invalid verification code" });
  if (
    measurePasswordStrength(newPassword).level !== "strong" &&
    measurePasswordStrength(newPassword).level !== "very strong"
  ) {
    return res.status(400).json({
      msg: "Please choose a stronger password.",
    });
  }
  user.password = await bcryptHash(newPassword, 10);
  user.verificationCode = null;
  user.notExpiredUntil = null;
  await user.save();
  res.status(200).json({ msg: "Password reset successfully" });
});

const getuser = asyncwrapper(async (req, res) => {
  const { id } = req.user;
  const user = await User.findById(id).select(
    "-password -verificationCode -loginVerificationCode",
  );
  if (!user) return res.status(404).json({ msg: "User not found" });

  const safeUser = user.toObject();
  res.status(200).json({ user: safeUser });
});

const edituser = asyncwrapper(async (req, res) => {
  const { id } = req.user;
  const editeduser = await User.findById(id);
  if (!editeduser) {
    return res.status(404).json({ msg: "User not found" });
  }

  // ✅ req.file.blobUrl بدل req.file.filename
  const avatar = req.file ? req.file.blobUrl : editeduser.avatar;

  const name = sanitizeHtml(req.body.name || "", {
    allowedTags: [],
    allowedAttributes: {},
  }).trim();

  if (name.length < 3 || name.length > 20) {
    return res
      .status(400)
      .json({ msg: "Name must be at least 3 characters and at max 20" });
  }

  const isSameUser = editeduser.name === name && editeduser.avatar === avatar;

  // ✅ تغيير الباسورد بقى اختياري ومنفصل، ومحتاج الباسورد القديم كتأكيد
  const { currentPassword, newPassword } = req.body;

  if (isSameUser && !newPassword) {
    return res.status(400).json({
      message: "The new data is identical to the existing user",
    });
  }

  if (newPassword) {
    if (!currentPassword) {
      return res
        .status(400)
        .json({ msg: "Current password is required to set a new password" });
    }

    const isPasswordMatch = await bcryptCompare(
      currentPassword,
      editeduser.password,
    );
    if (!isPasswordMatch) {
      return res.status(400).json({ msg: "Current password is incorrect" });
    }

    const passwordStrength = measurePasswordStrength(newPassword);
    if (
      passwordStrength.level !== "strong" &&
      passwordStrength.level !== "very strong"
    ) {
      return res.status(400).json({
        msg: "Please choose a stronger password",
      });
    }
    if (newPassword.length < 8 || newPassword.length > 25) {
      return res.status(400).json({
        msg: "Password must be at least 8 characters and at max 25",
      });
    }

    editeduser.password = await bcryptHash(newPassword, 10);
  }

  editeduser.name = name;
  editeduser.avatar = avatar;
  await editeduser.save();
  res.status(200).json({ msg: "User updated successfully" });
});

const deleteuser = asyncwrapper(async (req, res) => {
  const { id, username } = req.user;

  const blockingPay = await Pay.findOne({
    username,
    ispayed: false,
    createdAt: { $lte: new Date(Date.now() - 30 * 60 * 1000) },
  });

  if (blockingPay) {
    return res.status(400).json({
      msg: "Cannot delete your account while you have an unpaid payment request older than 30 minutes",
    });
  }

  const user = await User.findByIdAndDelete(id);
  if (!user) return res.status(404).json({ msg: "User not found" });

  const deletedComments = await Comment.find({ user: id }).select("_id");
  const commentIds = deletedComments.map((comment) => comment._id);

  if (commentIds.length > 0) {
    await Item.updateMany(
      { comments: { $in: commentIds } },
      { $pull: { comments: { $in: commentIds } } },
    );
  }

  await Comment.deleteMany({ user: id });
  await Pay.deleteMany({ username });

  res.status(200).json({ msg: "User deleted successfully" });
});

const getallusers = asyncwrapper(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const nmofusersinpage = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * nmofusersinpage;
  const users = await User.find()
    .skip(skip)
    .limit(nmofusersinpage)
    .select("-password -verificationCode -loginVerificationCode");
  const safeUsers = users.map((user) => {
    return {
      id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      avatar: user.avatar,
    };
  });
  res.status(200).json({ safeUsers });
});

const getuserforedit = asyncwrapper(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ msg: "User not found" });
  res.status(200).json({ name: user.name, avatar: user.avatar });
});

module.exports = {
  register,
  login,
  getuser,
  edituser,
  deleteuser,
  getallusers,
  verfication_register,
  verfication_login,
  forgotpassword,
  verfication_forgotpassword,
  getuserforedit,
};