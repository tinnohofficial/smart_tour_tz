require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const router = express.Router();
const authRoutes = require("./auth/routes");
const userRoutes = require("./users/routes");
const adminRoutes = require("./admin/routes");

const PORT = process.env.PORT;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

router.get("/", (req, res) => {
  res.send("Welcome to the Smart Tour backend!");
});
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/admin", adminRoutes);

app.use("/api", router);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
