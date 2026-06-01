require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const path = require("path");
const { initSocket } = require("./config/socket");

const app = express();
const server = http.createServer(app);

// MIDDLEWARE
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ROUTES
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/chat", require("./routes/chatRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/post", require("./routes/postRoutes"));
app.use("/api/event", require("./routes/eventRoutes"));
app.use("/api/profile", require("./routes/profileRoutes"));

// SOCKET
initSocket(server);

// START SERVER
server.listen(5000, () => console.log("Server running on port 5000"));