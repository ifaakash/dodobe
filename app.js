// server.js
require('dotenv').config();
const cors = require('cors');
const express = require('express');
const bodyParser = require('body-parser');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const blockRoutes = require('./routes/blockRoutes');
const linkRoutes = require('./routes/linkListRoutes');
const invoiceRoutes = require('./routes/invoice/invoiceRoutes');
const receiverRoutes = require('./routes/invoice/receiverRoutes');
const senderRoutes = require('./routes/invoice/senderRoutes');
const publishedDataRoutes = require("./routes/publishedData");
const apiLogger = require("./middlewares/apiLogger");
const errorLogger = require("./middlewares/errorLogger");

const app = express();
const port = 3001;
const host = "0.0.0.0"; // Ensures it listens on all IPv4 addresses

const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://main.d3vw2tir4aqdnd.amplifyapp.com", // Amplify URL
    "https://dodoclub.in", // Custom domain,
    "https://www.dodoclub.in",
];

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    optionSuccessStatus: 200,
};

app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
    }
    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS"
    );
    res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, token, X-Requested-With, Accept, Origin"
    );
    res.setHeader("Access-Control-Allow-Credentials", "true");
    next();
});

app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // Allow preflight requests

// Connect to MongoDB
connectDB();

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Add API logger middleware before routes
app.use(apiLogger);

// Use auth routes
app.use("/", authRoutes);
app.use("/", linkRoutes);
app.use("/", blockRoutes);
app.use("/", invoiceRoutes);
app.use("/", receiverRoutes);
app.use("/", senderRoutes);
app.use("/", publishedDataRoutes);
// Add error logger after routes but before error handler
app.use(errorLogger);

// Error handling middleware
app.use((err, req, res, next) => {
    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal Server Error",
        ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
});

// Define a route handler for the default home page
app.get('/', (req, res) => {
    res.send('DODO Backend is live, volla!');
});

app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// Start the server
app.listen(port, host, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
