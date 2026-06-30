import express from "express";
import {
  registerUser, loginUser, getUser, logoutUser,
  toggleBookmark, getBookmarks,
  getNotifications, markNotificationsRead,
  sendUserForgotPasswordOTP, verifyUserOTPAndResetPassword
} from "../controllers/userController.js";
import { userIdentifier } from "../middleware/userIdentification.js";

const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.get("/me", userIdentifier, getUser);
userRouter.get("/logout", userIdentifier, logoutUser);
userRouter.post("/bookmark/:documentId", userIdentifier, toggleBookmark);
userRouter.get("/bookmarks", userIdentifier, getBookmarks);
userRouter.get("/notifications", userIdentifier, getNotifications);
userRouter.patch("/notifications/read", userIdentifier, markNotificationsRead);
userRouter.patch("/forgot-password", sendUserForgotPasswordOTP);
userRouter.patch("/reset-password", verifyUserOTPAndResetPassword);

export default userRouter;
