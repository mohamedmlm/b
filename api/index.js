// server.js
const app = require("./app");
const connectDB = require("./data/db");

const PORT = process.env.PORT || 3000;

// ✅ الاتصال بالـ DB مرة واحدة عند التشغيل
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});   