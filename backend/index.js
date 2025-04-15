require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const { runSchema } = require("./config/setupDb");
const router = express.Router();
const authRoutes = require("./auth/routes");
const userRoutes = require("./users/routes");
const adminRoutes = require("./admin/routes");
const destinationRoutes = require("./destinations/routes");
const hotelRoutes = require("./hotels/routes");
const transportRoutes = require("./transport/routes");
const bookingRoutes = require("./bookings/routes");
const activityRoutes = require("./activities/routes");
const paymentRoutes = require("./payments/routes");
const savingsRoutes = require("./savings/routes");

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
router.use("/destinations", destinationRoutes);
router.use("/hotels", hotelRoutes);
router.use("/transport-routes", transportRoutes);
router.use("/bookings", bookingRoutes);
router.use("/activities", activityRoutes);
router.use("/payments", paymentRoutes);
router.use("/savings", savingsRoutes);

app.use("/api", router);

async function startServer() {
  try {
    await runSchema();

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
