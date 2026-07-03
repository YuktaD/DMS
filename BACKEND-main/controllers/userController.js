import jwt from "jsonwebtoken";
import UserModel from "../models/userModel.js";
import DocumentModel from "../models/documentModel.js";
import { securityQuestions } from "../middleware/validator.js";
import { hashPassword, comparePassword } from "../utils/hashing.js";

const normalizeSecurityAnswer = (value = "") => value.trim().toLowerCase();
const isValidSecurityQuestion = (question = "") => securityQuestions.includes(question);

// Register User
export const registerUser = async (req, res) => {
  const { userName, userEmail, userPassword, userMobileNo, securityQuestion, securityAnswer } = req.body;
  try {
    if (!userName || !userEmail || !userPassword || !securityQuestion || !securityAnswer)
      return res.status(400).json({ success: false, message: "All fields are required" });

    if (!isValidSecurityQuestion(securityQuestion)) {
      return res.status(400).json({ success: false, message: "Please select a valid security question" });
    }

    const existing = await UserModel.findOne({ userEmail: userEmail?.trim().toLowerCase() });
    if (existing)
      return res.status(409).json({ success: false, message: "Email already registered" });

    const hashed = await hashPassword(userPassword, 12);
    const normalizedAnswer = normalizeSecurityAnswer(securityAnswer);
    const hashedSecurityAnswer = await hashPassword(normalizedAnswer, 12);
    const user = await UserModel.create({ userName, userEmail: userEmail?.trim().toLowerCase(), userPassword: hashed, userMobileNo, securityQuestion, securityAnswerHash: hashedSecurityAnswer });
    user.userPassword = undefined;

    const token = jwt.sign({ userId: user._id, userEmail: user.userEmail }, process.env.TOKEN_SECRET, { expiresIn: process.env.TOKEN_EXPIRE });
    res.cookie("UserAuthorization", "Bearer " + token, { expires: new Date(Date.now() + 8 * 3600000), httpOnly: process.env.NODE_ENV === "production", secure: process.env.NODE_ENV === "production" })
      .status(201).json({ success: true, message: "Registered successfully", token, user });
  } catch (error) {
    console.error("Register user error:", error);
    res.status(500).json({ success: false, message: "Registration failed" });
  }
};

// Login User
export const loginUser = async (req, res) => {
  const { userEmail, userPassword } = req.body;
  try {
    if (!userEmail || !userPassword)
      return res.status(400).json({ success: false, message: "Email and password required" });

    const user = await UserModel.findOne({ userEmail: userEmail?.trim().toLowerCase() }).select("+userPassword");
    if (!user) return res.status(401).json({ success: false, message: "Invalid credentials" });

    const match = await comparePassword(userPassword, user.userPassword);
    if (!match) return res.status(401).json({ success: false, message: "Invalid credentials" });

    user.userPassword = undefined;
    const token = jwt.sign({ userId: user._id, userEmail: user.userEmail }, process.env.TOKEN_SECRET, { expiresIn: process.env.TOKEN_EXPIRE });
    res.cookie("UserAuthorization", "Bearer " + token, { expires: new Date(Date.now() + 8 * 3600000), httpOnly: process.env.NODE_ENV === "production", secure: process.env.NODE_ENV === "production" })
      .json({ success: true, message: "Login successful", token, user });
  } catch (error) {
    console.error("Login user error:", error);
    res.status(500).json({ success: false, message: "Login failed" });
  }
};

// Get current user
export const getUser = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.userId).populate("bookmarks");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching user" });
  }
};

// Logout User
export const logoutUser = async (req, res) => {
  res.clearCookie("UserAuthorization").json({ success: true, message: "Logged out" });
};

// Toggle Bookmark
export const toggleBookmark = async (req, res) => {
  const { documentId } = req.params;
  try {
    const user = await UserModel.findById(req.user.userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const idx = user.bookmarks.findIndex(b => b.toString() === documentId);
    if (idx > -1) {
      user.bookmarks.splice(idx, 1);
    } else {
      user.bookmarks.push(documentId);
    }
    await user.save();
    res.json({ success: true, bookmarks: user.bookmarks, isBookmarked: idx === -1 });
  } catch (error) {
    res.status(500).json({ success: false, message: "Bookmark toggle failed" });
  }
};

// Get user bookmarks
export const getBookmarks = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.userId).populate("bookmarks");
    res.json({ success: true, bookmarks: user?.bookmarks || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching bookmarks" });
  }
};

// Get notifications
export const getNotifications = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.userId);
    res.json({ success: true, notifications: user?.notifications?.slice().reverse() || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching notifications" });
  }
};

// Mark all notifications read
export const markNotificationsRead = async (req, res) => {
  try {
    await UserModel.updateOne({ _id: req.user.userId }, { $set: { "notifications.$[].isRead": true } });
    res.json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error marking notifications" });
  }
};

export const sendUserForgotPasswordOTP = async (req, res) => {
  const { userEmail } = req.body;
  try {
    const user = await UserModel.findOne({ userEmail: userEmail?.trim().toLowerCase() });
    if (!user) return res.status(404).json({ success: false, message: "No account found with this email" });
    return res.json({ success: true, securityQuestion: user.securityQuestion });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching security question" });
  }
};

export const verifyUserOTPAndResetPassword = async (req, res) => {
  const { userEmail, securityAnswer, newPassword } = req.body;
  try {
    const user = await UserModel.findOne({ userEmail: userEmail?.trim().toLowerCase() }).select("+securityAnswerHash +userPassword");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    const normalizedAnswer = normalizeSecurityAnswer(securityAnswer);
    const isAnswerCorrect = await comparePassword(normalizedAnswer, user.securityAnswerHash);
    if (!isAnswerCorrect) return res.status(400).json({ success: false, message: "Incorrect security answer" });
    const hashed = await hashPassword(newPassword, 12);
    user.userPassword = hashed;
    await user.save();
    res.json({ success: true, message: "Password reset successfully! Please login." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error resetting password" });
  }
};

