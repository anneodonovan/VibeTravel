require("dotenv").config();
const express = require("express");
const cors = require("cors");
const travelRoutes = require("./routes/travel");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));
app.use(express.json());

app.use("/api/travel", travelRoutes);

app.listen(PORT, () => {
  console.log(`VibeTravel server running on http://localhost:${PORT}`);
});
