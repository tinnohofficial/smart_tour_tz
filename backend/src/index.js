const express = require('express');
const cors = require('cors');
const routes = require('./routes');
require('dotenv').config();


const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test route
app.get('/', (req, res) => {
  res.send('Hello World! The server is ffrunfadning.');
});

app.use('/api', routes);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});