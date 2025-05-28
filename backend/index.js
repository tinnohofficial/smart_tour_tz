require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const { runSchema } = require("./config/setupDb");
const router = express.Router();
const authRouter = require("./routes/authRouter");
const destinationsRouter = require("./routes/destinationsRouter");
const hotelsRouter = require("./routes/hotelsRouter");
const travelAgentsRouter = require("./routes/travelAgentsRouter");
const tourGuidesRouter = require("./routes/tourGuidesRouter");
const bookingsRouter = require("./routes/bookingsRouter");
const activitiesRouter = require("./routes/activitiesRouter");
const transportsRouter = require("./routes/transportsRouter");
const savingsRouter = require("./routes/savingsRouter");
const applicationsRouter = require("./routes/applicationsRouter");
const cartRouter = require("./routes/cartRouter");

const PORT = process.env.PORT;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

router.get("/", (req, res) => {
  res.send("Welcome to the Smart Tour backend!");
});
router.use("/auth", authRouter);
router.use("/destinations", destinationsRouter);
router.use("/hotels", hotelsRouter);
router.use("/travel-agents", travelAgentsRouter);
router.use("/tour-guides", tourGuidesRouter);
router.use("/bookings", bookingsRouter);
router.use("/activities", activitiesRouter);
router.use("/transports", transportsRouter);
router.use("/savings", savingsRouter);
router.use("/applications", applicationsRouter);
router.use("/cart", cartRouter);

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
