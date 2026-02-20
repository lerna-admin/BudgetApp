require("dotenv").config();
const express = require("express");
const profileRoutes = require("./routes/profileRoutes");

const app = express();
app.use(express.json());

app.use("/api/profiles", profileRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Backend listening on http://localhost:${PORT}`);
});
