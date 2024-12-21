// Libraries
const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");

// // Enviromantal Variables
require("dotenv").config();
const PORT = process.env.PORT;
// const SOCKET_PORT = process.env.SOCKET_PORT;
const MONGO_URI = process.env.DB_URI;

// Socket.io Server
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: [
      // "http://localhost:5173",
      // "http://localhost:5174",
      "https://digital-menu1.web.app", // Client
      "https://restaurants-menu-55879.web.app", // Dashboard
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
  pingTimeout: 10000,
  pingInterval: 5000,
  perMessageDeflate: 1024,
});

// Max Listeners Limit
io.setMaxListeners(2000);

const {
  ClientsIDs,
  RestaurantsIDs,
  HandleConnectedClients,
  HandleConnectedRestaurants,
  HandleDisconnectedClients,
  HandleDisonnectedRestaurants,
} = require("../Modules/Notification/NotificationController");

// Socket.io
io.on("connection", (socket) => {
  console.table([
    { restaurants: RestaurantsIDs.length },
    { clients: ClientsIDs.length },
  ]);

  // Client Connected
  socket.on("Client-Connected", (ClientID) => {
    HandleConnectedClients(ClientID, socket.id);
  });

  // Restaurant Connected
  socket.on("Restaurant-Connected", (RestaurantID) => {
    HandleConnectedRestaurants(RestaurantID, socket.id);
  });

  // Disconnect
  socket.on("disconnect", () => {
    console.log("User With ID ", socket.id, " Disconnected");
    HandleDisconnectedClients(socket.id);
    HandleDisonnectedRestaurants(socket.id);
  });

  // Error
  socket.on("error", (error) => {
    io.emit("disconnect", error);
  });
});

app.set("io", io);
module.exports = io;

// Middelwares
const { default: rateLimit } = require("express-rate-limit");
const { default: helmet } = require("helmet");
// const { AuthChecker } = require("../Middelwares/AuthToken");
const path = require("path");

// Helmet
// Using Helmet to apply all headers
app.use(helmet());

// Or explicitly enable and configure all the individual Helmet features
app.use(helmet.dnsPrefetchControl()); // Controls DNS prefetching (default: false)
app.use(helmet.frameguard({ action: "deny" })); // Prevents clickjacking (default: 'deny')
app.use(helmet.hidePoweredBy()); // Hides the 'X-Powered-By' header (default: true)
app.use(
  helmet.hsts({ maxAge: 31536000, includeSubDomains: true, preload: true })
); // Enforces HTTPS (default: false)
app.use(helmet.ieNoOpen()); // Prevents IE from opening untrusted files (default: true)
app.use(helmet.noSniff()); // Prevents browsers from interpreting files as a different MIME type (default: true)
app.use(helmet.xssFilter()); // Sets the 'X-XSS-Protection' header (default: true)
app.use(helmet.referrerPolicy({ policy: "strict-origin-when-cross-origin" })); // Controls the Referer header (default: 'no-referrer')
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://trusted-scripts.com"],
      objectSrc: ["'none'"],
    },
  })
); // Controls content sources (default: none)
// Rate Limit
const Limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // Time
  max: 10, // 10 Requests Pre 15 Minutes
  message: "Too Many Requests",
});

// Make It For Spacific Route
// app.use(Limiter);
// app.use(xssClean());
// Json Parser
app.use(express.json());

// CROS ORIGIN
app.use(
  cors({
    origin: [
      // "http://localhost:5173",
      // "http://localhost:5174",
      "https://digital-menu1.web.app", // Client
      "https://restaurants-menu-55879.web.app", // Dashboard
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// Auth
// app.use(AuthChecker);

// Serve static files (uploaded images)
app.use("/api/Uploads", express.static(path.join(__dirname, "../Uploads")));

// Routes
const Restaurants = require("../Modules/Restaurant/Restaurants");
const Dishes = require("../Modules/Dish/Dishes");
const Categories = require("../Modules/Category/Categories");
const Orders = require("../Modules/Order/Orders");
const Tables = require("../Modules/Table/Tables");
const Register = require("../Modules/Register/Register");

// Routes
app.use("/api/restaurants", Restaurants);
app.use("/api/dishes", Dishes);
app.use("/api/categories", Categories);
app.use("/api/orders", Orders);
app.use("/api/tables", Tables);
app.use("/api/register", Register);

//
app.post("/api/refresh", (req, res) => {
  console.log("Headers: ", req.headers["authorization"]);
  return res.status(200).json({ msg: "Refreshed" });
});
// 404 - Route Not Found
app.get("*", (req, res) => {
  return res.status(404).json({ msg: "404 - Route Not Found!" });
});

// Server Port
mongoose
  .connect(MONGO_URI)
  .then(() => {
    server.listen(PORT, () => console.log(`Server Running On Port ${PORT}`));
  })
  .catch((err) => console.log("Something Went Wrong!", err));
