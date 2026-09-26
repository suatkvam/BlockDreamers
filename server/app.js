const express = require("express");
const cors = require("cors");

const eventRouter = require("./routes/event");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ ok: true }));
app.use("/api/event", eventRouter);

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.reason || err.message || "Internal error" });
});

module.exports = app;
