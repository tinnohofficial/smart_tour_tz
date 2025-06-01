require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
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

const applicationsRouter = require("./routes/applicationsRouter");
const cartRouter = require("./routes/cartRouter");

const uploadRouter = require("./routes/uploadRouter");

const PORT = process.env.PORT;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  // Create a .gitkeep file to ensure the directory is tracked in git
  fs.writeFileSync(path.join(uploadsDir, '.gitkeep'), '');
  console.log('Created uploads directory');
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploads)
app.use('/uploads', express.static('uploads'));

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

router.use("/applications", applicationsRouter);
router.use("/cart", cartRouter);

router.use("/upload", uploadRouter);

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

