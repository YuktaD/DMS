import express from "express";
import {
  registerAdmin,
  loginAdmin,
  logoutAdmin,
  sendVerificationCode,
  verifyVerificationCode,
  changePassword,
  sendForgotPasswordCode,
  verifyForgotPasswordCode,
  getAdmin,
  uploadDocument,
  getAllDocuments,
  getDocumentVersions,
  createNewVersion,
  updateDocument,
  handleDuplicateDocument,
} from "../controllers/adminController.js";
// import upload from '../utils/multer.js';
import { upload } from "../middleware/multer.js";
import { adminIdentifier } from "../middleware/adminIdentification.js";

const adminRouter = express.Router();

adminRouter.post("/register", upload.single("adminImagelink"), registerAdmin);
adminRouter.post("/login", loginAdmin);
adminRouter.get("/get-admin", adminIdentifier, getAdmin);
adminRouter.get("/logout",adminIdentifier, logoutAdmin);


adminRouter.post(
  "/uploadDocuments",
  upload.single("singleDocument"),
  uploadDocument
);

adminRouter.get(
  "/getAllDocuments",
  getAllDocuments
);

// Route for updating a document (with optional versioning)
adminRouter.put(
  "/editDocument/:id",
  upload.single("document"),
  updateDocument
);

adminRouter.post(
  "/handleDuplicateDocument/:id",
  upload.single("singleDocument"),
  handleDuplicateDocument
);

// Route specifically for creating a new version
// This route can be used if you want to separate the versioning endpoint completely
adminRouter.put(
  "/createDocumentVersion/:id",
  upload.single("document"),
  createNewVersion
);

adminRouter.get(
  "/documentVersions/:id",
  getDocumentVersions
);

//sinding verifiaction code
adminRouter.patch(
  "/send-verification-code",
  adminIdentifier,
  sendVerificationCode
);
adminRouter.patch(
  "/verify-verification-code",
  adminIdentifier,
  verifyVerificationCode
);
//for changing the password of Admin
adminRouter.patch("/change-password", adminIdentifier, changePassword);
//for forget password
adminRouter.patch("/send-forgot-password-code", sendForgotPasswordCode);
adminRouter.patch("/verify-forgot-password-code", verifyForgotPasswordCode);

export default adminRouter;
