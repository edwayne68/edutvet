const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const User = require("./models/User");
const nodemailer = require("nodemailer"); // For sending emails
const bcrypt = require("bcrypt"); // For password hashing
const multer = require("multer");
const crypto = require("crypto");

dotenv.config();

const app = express();
app.use(cors({
  origin: ["http://localhost:3000"],
}));
app.use(express.json());

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // Your email address
    pass: process.env.EMAIL_PASS  // Your email password
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// Forgot Password Route
app.post("/api/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetToken = resetToken;
    user.resetTokenExpires = Date.now() + 3600000; // Token valid for 1 hour
    await user.save();

    const resetLink = `http://localhost:5000/reset-password?token=${resetToken}`;
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset Request",
      html: `
        <p>Hello,</p>
        <p>You requested to reset your password. Click the link below to reset it:</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>If you did not request this, please ignore this email.</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    res.json({ msg: "Password reset email sent" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Internal server error" });
  }
});

// Reset Password Route
app.post("/api/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpires: { $gt: Date.now() }, // Ensure token is not expired
    });

    if (!user) {
      return res.status(400).json({ msg: "Invalid or expired token" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetToken = undefined; // Clear the reset token
    user.resetTokenExpires = undefined;
    await user.save();

    res.json({ msg: "Password reset successful" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Internal server error" });
  }
});

// Sign-up Route
app.post("/api/signup", async (req, res) => {
  const { name, email, password } = req.body;
  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ msg: "User already exists" });

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ name, email, password: hashedPassword });
  await user.save();
  res.json({ msg: "User registered successfully" });
});

// Login Route
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(400).json({ msg: "Invalid credentials" });
  }
  res.json({ msg: "Login successful", user });
});

let documents = []; // Example in-memory storage

// Upload document
app.post("/api/upload", upload.single("file"), (req, res) => {
  const { title, category, level, description, isApproved } = req.body;
  const filePath = "/uploads/" + req.file.filename; // File path from multer
  const newDocument = {
    id: documents.length + 1,
    title,
    category,
    level,
    description,
    filePath,
    isApproved: isApproved === "true", // Convert string to boolean
  };
  documents.push(newDocument);
  res.status(201).json({ message: "Document uploaded successfully. Awaiting approval." });
});

// Approve document
app.post("/api/documents/:id/approve", (req, res) => {
  const documentId = parseInt(req.params.id);
  const document = documents.find((doc) => doc.id === documentId);
  if (!document) {
    return res.status(404).json({ message: "Document not found." });
  }
  document.isApproved = true;
  res.json({ message: "Document approved successfully." });
});

// Get all documents (filter by approval status)
app.get("/api/documents", (req, res) => {
  const { isApproved } = req.query;
  const filteredDocuments = isApproved
    ? documents.filter((doc) => doc.isApproved.toString() === isApproved)
    : documents;
  res.json(filteredDocuments);
});

app.listen(5000, () => console.log("Server running on port 5000"));
