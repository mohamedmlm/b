const db = require("./data/db");
const express = require("express");
const app = express();
const userRouter = require("./router/users.router");
const itemRouter = require("./router/items.router");
const commentRouter = require("./router/comments.route");
const payRouter = require("./router/pay.router");
const helmet = require("helmet");
const User = require("./data/user.shema");
const hpp = require("hpp");
const path = require("path");
const cors = require("cors");
const fs = require("node:fs");
const cookieParser = require("cookie-parser");
const https = require("https");
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
  }),
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
  }),
);

app.use(express.json());

app.use("/users", userRouter);
app.use("/items", itemRouter);
app.use("/comments", commentRouter);
app.use("/payments", payRouter);

const startServer = async () => {
  try {
    await db();
    /*
    const isProduction = process.env.NODE_ENV === "production";
    const isHTTPS = process.env.USE_HTTPS === "true";

    if (isProduction && isHTTPS) {
      const options = {
        key: fs.readFileSync(process.env.SSL_KEY_PATH || "key.pem"),
        cert: fs.readFileSync(process.env.SSL_CERT_PATH || "cert.pem"),
      };
      https.createServer(options, app).listen(PORT, () => {
        console.log(`✅ HTTPS Server running on port ${PORT}`);
      });
    } else {}*/
    const PORT = process.env.PORT || 3443;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });

    setInterval(
      async () => {
        try {
          const result = await User.deleteMany({
            isEmailVerified: false,
            timetodeleteuser: { $lte: Date.now() },
          });
          if (result.deletedCount > 0) {
            console.log(
              `Deleted ${result.deletedCount} user(s) with unverified email`,
            );
          }
        } catch (error) {
          console.log("Cleanup error:", error);
        }
      },
      5 * 60 * 1000,
    );
  } catch (error) {
    console.error("Failed to connect to database:", error);
    process.exit(1);
  }
};

startServer();

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
