import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  userName: { type: String, required: true, trim: true },
  userEmail: { type: String, required: true, unique: true, lowercase: true },
  userPassword: { type: String, required: true, select: false },
  userMobileNo: { type: String, default: "" },
  bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Document" }],
  notifications: [{
    message: String,
    documentId: { type: mongoose.Schema.Types.ObjectId, ref: "Document" },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }],
  securityQuestion: { type: String, required: true, trim: true },
  securityAnswerHash: { type: String, required: true, select: false },
  passwordResetAuthorizedExpiry: { type: Date, select: false },
}, { timestamps: true });

export default mongoose.models.User || mongoose.model("User", userSchema);
