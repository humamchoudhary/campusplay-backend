// app.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const config = require("./config");
const dsaRoutes = require("./routes/dsaRoutes");
const coachRoutes = require("./routes/coachRoutes");
const coordinatorRoutes = require("./routes/coordinatorRoutes");
const studentrepRoutes = require("./routes/studentrepRoutes");
const captainRoutes = require("./routes/captainRoutes");
const feedscreen = require("./routes/feedscreen");
const refRoutes = require("./routes/refRoutes");
const authRoutes = require("./routes/auth");

const morgan = require("morgan");
const app = express();

// Middleware for CORS and JSON parsing
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use(express.json());

// MongoDB connection
mongoose
  .connect(config.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

app.use(morgan("combined"));
// Route middleware
app.use("/admin/", dsaRoutes);
app.use("/coach/", coachRoutes);
app.use("/coordinator/", coordinatorRoutes);
app.use("/rep/", studentrepRoutes);
app.use("/captain/", captainRoutes);
app.use("/feed/", feedscreen);
app.use("/ref/", refRoutes);
app.use("/auth/", authRoutes);

// Start the server
app.listen(3002, () => {
  console.log(`Server running on ${config.FRONTEND_URL}`);
});

const printedStrings = new Set();

function print(path, layer) {
  if (layer.route) {
    layer.route.stack.forEach(
      print.bind(null, path.concat(split(layer.route.path))),
    );
  } else if (layer.name === "router" && layer.handle.stack) {
    layer.handle.stack.forEach(
      print.bind(null, path.concat(split(layer.regexp))),
    );
  } else if (layer.method) {
    const output = `%s /%s`
      .replace("%s", layer.method.toUpperCase())
      .replace(
        "/%s",
        `/${path.concat(split(layer.regexp)).filter(Boolean).join("/")}`,
      );

    if (!printedStrings.has(output)) {
      printedStrings.add(output);
      console.log(output);
    }
  }
}

function split(thing) {
  if (typeof thing === "string") {
    return thing.split("/");
  } else if (thing.fast_slash) {
    return "";
  } else {
    const match = thing
      .toString()
      .replace("\\/?", "")
      .replace("(?=\\/|$)", "$")
      .match(/^\/\^((?:\\[.*+?^${}()|[\]\\\/]|[^.*+?^${}()|[\]\\\/])*)\$\//);
    return match
      ? match[1].replace(/\\(.)/g, "$1").split("/")
      : "<complex:" + thing.toString() + ">";
  }
}

app._router.stack.forEach(print.bind(null, []));

// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// const bcrypt = require('bcrypt');
// const jwt = require('jsonwebtoken'); // Import JWT
// const app = express();

// // Middleware to handle CORS and JSON
// app.use(cors({
//   origin: 'http://192.168.1.21:3002', // Frontend URL
//   credentials: true
// }));
// app.use(express.json());

// // MongoDB connection
// mongoose.connect('mongodb://127.0.0.1:27017/campusplay')
//   .then(() => console.log('MongoDB connected'))
//   .catch(err => console.log(err));

// // Define User Schema and Model
// const userSchema = new mongoose.Schema({
//   username: String,
//   email: { type: String, unique: true },
//   password: String
// });

// const DSAUser = mongoose.model('DSAUser', userSchema);
// const SportsCoachUser = mongoose.model('SportsCoachUser', userSchema);

// // JWT Secret Key
// const JWT_SECRET = '4gM8XkFz9pVnR2hQ7wLrY5aC0uJbH3eZ'; // strong, unique key
// // Middleware to verify JWT
// const authenticateJWT = (req, res, next) => {
//   const token = req.headers['authorization']?.split(' ')[1]; // Extract token from Authorization header
//   if (token) {
//     jwt.verify(token, JWT_SECRET, (err, user) => {
//       if (err) return res.sendStatus(403); // Forbidden
//       req.user = user;
//       next();
//     });
//   } else {
//     res.sendStatus(401); // Unauthorized
//   }
// };

// // Handle user registration
// app.post('/dsasignup', async (req, res) => {
//     try {
//       // Check if the email already exists
//       const existingUser = await DSAUser.findOne({ email: req.body.email });
//       if (existingUser) {
//         return res.status(400).json({ error: 'Email already exists' });
//       }

//       // Hash the password before saving
//       const hashedPassword = await bcrypt.hash(req.body.password, 10);
//       const user = new DSAUser({ ...req.body, password: hashedPassword });
//       const result = await user.save();
//       res.status(201).send(result);
//     } catch (error) {
//       console.error('Error:', error);
//       res.status(500).json({ error: 'Error creating account' }); // Return a specific error message
//     }
//   });

// // Handle user login
// app.post('/dsalogin', async (req, res) => {
//   const { email, password } = req.body;

//   if (email && password) {
//     const user = await DSAUser.findOne({ email });
//     if (user && await bcrypt.compare(password, user.password)) {
//       // Generate JWT token
//       const token = jwt.sign({ id: user._id, username: user.username, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
//       res.json({ success: true, message: 'Logged in successfully', token });
//     } else {
//       res.json({ success: false, message: 'Invalid credentials' });
//     }
//   } else {
//     res.json({ success: false, message: 'Please provide email and password' });
//   }
// });
// // Handle profile request
// app.get('/dsalandingpage', authenticateJWT, (req, res) => {
//   // req.user will be populated by authenticateJWT middleware
//   res.json({
//     success: true,
//     user: req.user
//   });
// });

//   app.post('/dsasportscoachuser', async (req, res) => {
//     try {
//       const existingUser1 = await SportsCoachUser.findOne({ email: req.body.email });
//       if (existingUser1) {
//         return res.status(400).json({ success: false, error: 'Email already exists' });
//       }

//       const hashedPassword = await bcrypt.hash(req.body.password, 10);
//       const user = new SportsCoachUser({ ...req.body, password: hashedPassword });
//       const result = await user.save();
//       res.status(201).json({ success: true, user: result });
//     } catch (error) {
//       console.error('Error:', error);
//       res.status(500).json({ success: false, error: 'Error creating account' });
//     }
//   });

// // Handle user login
// app.post('/sportscoachlogin', async (req, res) => {
//   const { email, password } = req.body;
//   if (email && password) {
//     const user = await SportsCoachUser.findOne({ email });
//     if (user && await bcrypt.compare(password, user.password)) {
//       // Generate JWT token
//       const token = jwt.sign({ id: user._id, username: user.username, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
//       res.json({ success: true, message: 'Logged in successfully', token });
//     } else {
//       res.json({ success: false, message: 'Invalid credentials' });
//     }
//   } else {
//     res.json({ success: false, message: 'Please provide email and password' });
//   }
// });

// app.get('/coachlandingpage', authenticateJWT, (req, res) => {
//   // req.user will be populated by authenticateJWT middleware
//   res.json({
//     success: true,
//     user: req.user
//   });
// });

// // Start the server
// app.listen(3002, () => {
//   console.log('Server running on port 3002');
// });
