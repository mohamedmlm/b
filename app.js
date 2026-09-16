const express = require("express");
const app = express();
const userRouter = require("./router/users.router");
const itemRouter = require("./router/items.router");
const commentRouter = require("./router/comments.route");
const payRouter = require("./router/pay.router");
const helmet = require("helmet");
const hpp = require("hpp");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const compression = require("compression");
require("dotenv").config();

app.use(
  cors({
    origin: "https://crocsstorefm.vercel.app",
    credentials: true,
  })
);

app.use(hpp());
app.use(
  compression({
    level: 6,
    threshold: 0,
  })
);
app.use(cookieParser(process.env.COOKIE_SECRET));

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https:"],
        styleSrc: ["'self'", "'unsafe-inline'", "https:"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https:"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        frameAncestors: ["'none'"],
      },
    },
  })
);

app.use(express.json({ limit: "1mb" }));

app.use("/users", userRouter);
app.use("/items", itemRouter);
app.use("/comments", commentRouter);
app.use("/payments", payRouter);

// error handler لازم يتسجل بعد كل الـ routes مباشرة
app.use((err, req, res, next) => {
  console.log(err.stack);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
  });
});

process.on("unhandledRejection", (reason, promise) => {
  console.log("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (err) => {
  console.log("Uncaught Exception:", err);
});

module.exports = app;