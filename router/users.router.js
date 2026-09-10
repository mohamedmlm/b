const express = require('express');
const router = express.Router();
const {registerValidator,loginValidator} = require("../modules/validator/validate_body");
const validationResult = require("../modules/validator/validate_result")
const { register, login, getuser, edituser, deleteuser, getallusers, verfication_register, verfication_login, forgotpassword, verfication_forgotpassword, getuserforedit } = require('../controller/users.controller');
const token_verify = require("../modules/authentication/tokenverify");
const allowedto = require('../modules/authentication/allowedto');
const role = require('../modules/authentication/role');
const uploadMiddleware = require("../modules/upload_verification/avatar");
const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: "Too many requests from this IP, please try again later"
});

router.get("/all", token_verify, allowedto(role.MANAGER, role.ADMIN), getallusers);

// ✅ limiter ضيف قبل uploadMiddleware عشان يمنع spam على /register (بيبعت إيميل)
router.post('/register', limiter, uploadMiddleware, registerValidator, validationResult, register);

router.post('/login', limiter, loginValidator, validationResult, login);
router.get("/me", token_verify, getuser);

// ✅ token_verify قبل uploadMiddleware عشان محدش يرفع ملفات من غير ما يبقى مسجل دخول
router.patch("/edit", token_verify, uploadMiddleware, edituser);

router.delete("/delete", token_verify, deleteuser);
router.post("/verify-email-registiration",  limiter, verfication_register);
router.post("/verify-email-login", limiter, verfication_login);
router.post("/forgot-password", limiter, forgotpassword);
router.post("/verify-email-forgot-password", limiter, verfication_forgotpassword);
router.get("/edit", token_verify, getuserforedit);

module.exports = router;