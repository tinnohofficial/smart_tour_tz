require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const { runSchema } = require("./config/setupDb");
const router = express.Router();
const authRouter = require("./routes/authRouter");
const adminRouter = require("./routes/adminRouter");
const destinationsRouter = require("./routes/destinationsRouter");
const hotelManagersRouter = require("./routes/hotelManagersRouter");
const travelAgentsRouter = require("./routes/travelAgentsRouter");
const tourGuidesRouter = require("./routes/tourGuidesRouter");
const touristsRouter = require("./routes/touristsRouter");
const bookingsRouter = require("./routes/bookingsRouter");
const activitiesRouter = require("./routes/activitiesRouter");
const paymentsRouter = require("./routes/paymentsRouter");
const savingsRouter = require("./routes/savingsRouter");

const PORT = process.env.PORT;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

router.get("/", (req, res) => {
  res.send("Welcome to the Smart Tour backend!");
});
router.use("/auth", authRouter);
router.use("/admin", adminRouter);
router.use("/destinations", destinationsRouter);
router.use("/hotel-managers", hotelManagersRouter);
router.use("/travel-agents", travelAgentsRouter);
router.use("/tour-guides", tourGuidesRouter);
router.use("/tourists", touristsRouter);
router.use("/bookings", bookingsRouter);
router.use("/activities", activitiesRouter);
router.use("/payments", paymentsRouter);
router.use("/savings", savingsRouter);

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
