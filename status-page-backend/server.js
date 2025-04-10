// server.js or app.js
const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('API is running...');
});

// Routes (to be added later)
// app.use('/api/organizations', require('./routes/organizations'));
// ...

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
