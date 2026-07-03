import jwt from "jsonwebtoken";
import {
  sendVerificationCodeSchema,
  acceptCodeSchema,
  changePasswordSchema,
  registerSchemaForAdmin,
  loginSchemaForAdmin,
  forgotPasswordQuestionSchema,
  resetPasswordWithSecurityAnswerSchema,
  uploadDocumentSchema,
  securityQuestions,
} from "../middleware/validator.js";
import adminModel from "../models/adminModel.js";
import {
  comparePassword,
  hashPassword,
  hmacProcess,
} from "../utils/hashing.js";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";


import DocumentModel from "../models/documentModel.js";
import DocumentVersionModel from "../models/DocumentVersionModel.js";
import DocumentHistory from "../models/DocumentHistory.js";

const normalizeSecurityAnswer = (value = "") => value.trim().toLowerCase();
const isValidSecurityQuestion = (question = "") => securityQuestions.includes(question);
const DEFAULT_SECURITY_QUESTION = securityQuestions[0] || "What is your favorite food?";

const getAdminSecurityQuestion = (existingAdmin) => {
  const savedQuestion = existingAdmin?.securityQuestion?.trim();
  if (savedQuestion) return savedQuestion;

  if (!existingAdmin) return DEFAULT_SECURITY_QUESTION;

  return DEFAULT_SECURITY_QUESTION;
};

const registerAdmin = async (req, res) => {
   console.log("===== REGISTER REQUEST =====");
  console.log("BODY:", req.body);
  console.log("FILE:", req.file);
  const {
    adminEmailId,
    adminPassword,
    adminName,
    adminLocation,
    adminMobileNo,
    securityQuestion,
    securityAnswer,
  } = req.body;

  try {
    // First check if any admin already exists in the system
    const existingAdminCount = await adminModel.countDocuments();
    if (existingAdminCount > 0) {
      return res.status(403).json({
        success: false,
        message:
          "System already has an admin. Multiple administrators are not allowed.",
      });
    }

    if (!isValidSecurityQuestion(securityQuestion)) {
      return res.status(400).json({ success: false, message: "Please select a valid security question" });
    }

    // Validate input data
    const { error, value } = registerSchemaForAdmin.validate({
      adminEmailId,
      adminPassword,
      adminName,
      adminLocation,
      securityQuestion,
      securityAnswer,
      adminMobileNo,
    });

    if (error) {
      return res
        .status(401)
        .json({ success: false, message: error.details[0].message });
    }

    // Double check specifically for email (extra safety)
    const existingAdmin = await adminModel.findOne({ adminEmailId });
    if (existingAdmin) {
      return res
        .status(401)
        .json({ success: false, message: "Admin already exists!" });
    }

    // Hash the password and security answer
    const hashedPassword = await hashPassword(adminPassword, 12);
    const normalizedAnswer = normalizeSecurityAnswer(securityAnswer);
    const hashedSecurityAnswer = await hashPassword(normalizedAnswer, 12);

    const verificationCodeValidation = Date.now() + 24 * 60 * 60 * 1000; // 24 hours validity

    // Prepare the admin object
    const adminData = {
      adminEmailId: adminEmailId?.trim().toLowerCase(),
      adminPassword: hashedPassword,
      adminName,
      adminLocation,
      adminMobileNo,
      securityQuestion,
      securityAnswerHash: hashedSecurityAnswer,
      verified: false,
      verificationCodeValidation,
      adminImagelink: {
        public_id: "",
        url: "",
      },
      isFirstAdmin: true, // Flag to mark this as the primary admin
    };

    // Handle image upload if a file is provided
    if (req.file) {
      const { path: imageTempPath } = req.file;

      if (imageTempPath) {
        try {
          const cloudinaryResponse = await cloudinary.uploader.upload(
            imageTempPath,
            { folder: "ADMIN_IMAGES" }
          );

          if (!cloudinaryResponse || cloudinaryResponse.error) {
            fs.unlinkSync(imageTempPath);
            return res.json({
              success: false,
              message: "Failed to upload image to Cloudinary",
            });
          }

          adminData.adminImagelink.public_id = cloudinaryResponse.public_id;
          adminData.adminImagelink.url = cloudinaryResponse.secure_url;

          fs.unlinkSync(imageTempPath);
        } catch (error) {
          if (fs.existsSync(imageTempPath)) {
            fs.unlinkSync(imageTempPath);
          }
          return res.json({
            success: false,
            message: "An error occurred while uploading the image",
          });
        }
      }
    }

    // Create and save the new admin
    const admin = new adminModel(adminData);
    const result = await admin.save();

    // Remove sensitive data from response
    result.adminPassword = undefined;
    result.verificationCodeValidation = undefined;

    res.status(201).json({
      success: true,
      message:
        "Admin account created successfully. You are the primary administrator.",
      result,
    });
  } catch (error) {
    

  return res.status(500).json({
    success: false,
    message: error.message,
  });
}
};

const loginAdmin = async (req, res) => {
  // console.log(req.body);
  const { adminEmailId, adminPassword } = req.body; // Change email to adminEmailId
  try {
    // Validate input data
    const { error } = loginSchemaForAdmin.validate({
      adminEmailId,
      adminPassword,
    });

    if (error) {
      return res
        .status(401)
        .json({ success: false, message: error.details[0].message });
    }

    // Check if admin exists
    const existingAdmin = await adminModel
      .findOne({ adminEmailId: adminEmailId?.trim().toLowerCase() })
      .select("+adminPassword");
    // console.log(existingAdmin, 'this is existing');

    if (!existingAdmin) {
      return res
        .status(401)
        .json({ success: false, message: "You are not an admin!" });
    }

    // Compare passwords
    const result = await comparePassword(
      adminPassword,
      existingAdmin.adminPassword
    );

    if (!result) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials!" });
    }

    // Generate token
    const token = jwt.sign(
      {
        adminId: existingAdmin._id,
        adminEmailId: existingAdmin.adminEmailId,
        verified: existingAdmin.verified,
      },
      process.env.TOKEN_SECRET,
      {
        expiresIn: process.env.TOKEN_EXPIRE,
      }
    );

    res
      .cookie("Authorization", "Bearer " + token, {
        expires: new Date(Date.now() + 8 * 3600000),
        httpOnly: process.env.NODE_ENV === "production",
        secure: process.env.NODE_ENV === "production",
      })
      .json({
        success: true,
        token,
        message: "Logged in successfully",
      });
  } catch (error) {
    // console.log(error);
    res.json({
      success: false,
      message: "Something went wrong in login admin",
    });
  }
};

const getAdmin = async (req, res) => {
  try {
    // Extract the userId from the token or session
    const adminId = req.admin.adminId; // Assuming the userId is attached to the request via authentication middleware

    // Fetch the user using the userId from the database
    const existingDoctor = await adminModel.findById(adminId); // Replace `userModel` with the correct model (e.g., doctorModel if it's for doctors)

    if (!existingDoctor) {
      return res
        .status(404)
        .json({ success: false, message: "Admin not found" });
    }


    // Return the user data as a response
    return res.status(200).json({
      success: true,
      existingDoctor, // This will include all user data fetched from the database
    });
  } catch (error) {
    // Handle any errors during fetching user data
    console.error("Error fetching user data: ", error.message);
    return res.status(500).json({
      success: false,
      message: error.message + " in catch block of getUser function",
    });
  }
};

const logoutAdmin = async (req, res) => {
  res.clearCookie("Authorization").status(200).json({
    success: true,
    message: "logged out successfully",
  });
};

const getVersionedFileName = (originalFileName, version) => {

  const fileNameParts = originalFileName.split('.');
  const extension = fileNameParts.pop();
  const baseName = fileNameParts.join('.');
  return `${baseName}_V${version}.${extension}`;
};

// Helper function to check if document with same title already exists
const checkDocumentExists = async (title, excludeId = null) => {
  const query = { title };
  
  // Exclude the current document if we're updating
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  
  return await DocumentModel.findOne(query);
};

const uploadDocument = async (req, res) => {
  const { title, description } = req.body;
  const pdfFile = req.file;
  let imageTempPath = null;

  try {
    if (!pdfFile) {
      return res.status(400).json({ success: false, message: "PDF file is required!" });
    }

    // Check if document with same title already exists
    const existingDocument = await checkDocumentExists(title);
    
    // If document already exists, return with conflict status and existing document info
    if (existingDocument) {
      // Clean up temp file since we're not using it yet
      if (fs.existsSync(pdfFile.path)) {
        fs.unlinkSync(pdfFile.path);
      }
      
      return res.status(409).json({
        success: false,
        message: "Document with this title already exists",
        documentExists: true,
        existingDocument: {
          id: existingDocument._id,
          title: existingDocument.title,
          description: existingDocument.description,
          createdAt : existingDocument.createdAt,
          version: existingDocument.currentVersion
        }
      });
    }

    imageTempPath = pdfFile.path;

    
    
    // Upload to Cloudinary
    const cloudinaryResponse = await cloudinary.uploader.upload(
      imageTempPath,
      { 
        folder: "Documents_Folder",
        resource_type: 'raw'
      }
    );

    if (!cloudinaryResponse || cloudinaryResponse.error) {
      if (fs.existsSync(imageTempPath)) {
        fs.unlinkSync(imageTempPath);
      }
      return res.status(400).json({
        success: false,
        message: "Failed to upload document to Cloudinary",
      });
    }

    // Create document in database
    const fileExt = pdfFile.originalname?.split('.').pop()?.toLowerCase();
    const mime = pdfFile.mimetype || '';
    const fileType = fileExt === 'pdf' ? 'pdf' : (mime.includes('word') || fileExt === 'doc' || fileExt === 'docx') ? 'word' : 'image';

    const newDocument = await DocumentModel.create({
      title,
      description,
      pdfUrl: {
        public_id: cloudinaryResponse.public_id,
        url: cloudinaryResponse.secure_url
      },
      fileName: pdfFile.originalname,
      fileType,
      currentVersion: 0
    });

    // Record history
    try {
      await DocumentHistory.create({
        originalDocument: newDocument._id,
        action: 'upload',
        performedBy: req.admin?.adminId || req.admin?.adminEmailId || null,
        details: { title: newDocument.title, fileName: newDocument.fileName }
      });
    } catch (e) { console.warn('Failed to record document history (upload):', e.message); }

    try {
      await notifyUsersOfNewDocument(newDocument._id, newDocument.title);
    } catch (e) {
      console.warn('Failed to notify users of new document:', e.message);
    }

    // Clean up temp file
    if (fs.existsSync(imageTempPath)) {
      fs.unlinkSync(imageTempPath);
    }

    res.status(201).json({
      success: true,
      document: newDocument,
      message: "Document uploaded successfully",
    });

  } catch (error) {
    if (imageTempPath && fs.existsSync(imageTempPath)) {
      fs.unlinkSync(imageTempPath);
    }
    
    console.error('Upload document error:', error);
    res.status(500).json({
      success: false,
      message: "Something went wrong while uploading document",
    });
  }
};

// This endpoint handles the choice after a duplicate is found
const handleDuplicateDocument = async (req, res) => {
  const { id } = req.params;
  const { action } = req.body; // 'replace' or 'version'
  const { title, description } = req.body;
  const pdfFile = req.file;

  console.log("Request Body : ", req.body);
  console.log("id : ", id)

  req.body.id = id;
  
  try {
    if (!pdfFile) {
      return res.status(400).json({ success: false, message: "PDF file is required!" });
    }
    
    // Check if the document exists
    const existingDocument = await DocumentModel.findById(id);
    if (!existingDocument) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // Delegate to appropriate controller based on action
    if (action === 'replace') {
      // Modify req.body to indicate this is not a version creation
      req.body.createVersion = "false";
      return await updateDocument(req, res);
    } else if (action === 'version') {
      // Modify req.body to indicate this is a version creation
      req.body.createVersion = "true";
      return await updateDocument(req, res);
    } else {
      // Clean up temp file
      if (fs.existsSync(pdfFile.path)) {
        fs.unlinkSync(pdfFile.path);
      }
      
      return res.status(400).json({
        success: false,
        message: "Invalid action. Must be 'replace' or 'version'",
      });
    }
  } catch (error) {
    // Clean up temp file in case of error
    if (pdfFile && fs.existsSync(pdfFile.path)) {
      fs.unlinkSync(pdfFile.path);
    }
    
    console.error('Handle duplicate document error:', error);
    res.status(500).json({
      success: false,
      message: "Something went wrong while handling duplicate document",
    });
  }
};

const updateDocument = async (req, res) => {
  // const { id } = req.params;

  const { title, description, createVersion, id } = req.body;
  const pdfFile = req.file;
  let imageTempPath = null;

  console.log("Request ID:", id);
  console.log("Request Body - Title:", title);
  console.log("Request Body - Description:", description);
  console.log("Request File:", pdfFile);

  try {
    // Check if the document exists
    const existingDocument = await DocumentModel.findById(id);
    if (!existingDocument) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }
    
    // Check if there's another document with the same title (excluding this one)
    if (title && title !== existingDocument.title) {
      const duplicateDocument = await checkDocumentExists(title, id);
      if (duplicateDocument) {
        // Clean up temp file
        if (pdfFile && fs.existsSync(pdfFile.path)) {
          fs.unlinkSync(pdfFile.path);
        }
        
        return res.status(409).json({
          success: false,
          message: "Another document with this title already exists",
        });
      }
    }

    // If creating a new version, delegate to version controller
    if (createVersion === "true") {
      return await createNewVersion(req, res, existingDocument);
    }

    // Prepare the update data
    const updateData = {
      title,
      description,
      currentVersion: existingDocument.currentVersion,
    };

    // Handle PDF file update if a new file is provided
    if (pdfFile) {
      imageTempPath = pdfFile.path;
      console.log("Temporary file path:", imageTempPath);

      console.log("Uploading new file to Cloudinary...");
      // IMPORTANT: never delete the previous version file.
      // Upload using a unique public_id so old versions remain downloadable.
      const versionedPublicId = `${pdfFile.originalname.split(".")[0]}_V${Date.now()}`;
      const cloudinaryResponse = await cloudinary.uploader.upload(imageTempPath, {
        folder: "Documents_Folder",
        resource_type: "raw",
        public_id: versionedPublicId,
      });


      if (!cloudinaryResponse || cloudinaryResponse.error) {
        console.error("Cloudinary upload failed:", cloudinaryResponse.error);
        if (fs.existsSync(imageTempPath)) {
          fs.unlinkSync(imageTempPath);
        }
        return res.status(400).json({
          success: false,
          message: "Failed to upload new document to Cloudinary",
        });
      }

      const fileExt = pdfFile.originalname?.split('.').pop()?.toLowerCase();
      const mime = pdfFile.mimetype || '';
      const fileType = fileExt === 'pdf' ? 'pdf' : (mime.includes('word') || fileExt === 'doc' || fileExt === 'docx') ? 'word' : 'image';

      // Update the document's PDF URL and file name
      updateData.pdfUrl = {
        public_id: cloudinaryResponse.public_id,
        url: cloudinaryResponse.secure_url,
      };
      updateData.fileName = pdfFile.originalname;
      updateData.fileType = fileType;
      console.log("PDF URL updated:", updateData.pdfUrl);
    }

    // Update the document in the database
    console.log("Updating document in the database...");
    const updatedDocument = await DocumentModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    // Record history for update
    try {
      await DocumentHistory.create({
        originalDocument: updatedDocument._id,
        action: 'update',
        performedBy: req.admin?.adminId || req.admin?.adminEmailId || null,
        details: { before: { title: existingDocument.title, fileName: existingDocument.fileName }, after: { title: updatedDocument.title, fileName: updatedDocument.fileName } }
      });
    } catch (e) { console.warn('Failed to record document history (update):', e.message); }

    // Clean up the temporary file
    if (imageTempPath && fs.existsSync(imageTempPath)) {
      console.log("Cleaning up temporary file...");
      fs.unlinkSync(imageTempPath);
    }

    console.log("Operation successful");
    res.status(200).json({
      success: true,
      document: updatedDocument,
      message: "Document updated successfully",
    });
  } catch (error) {
    console.error("Error in updateDocument:", error);

    // Clean up the temporary file in case of an error
    if (imageTempPath && fs.existsSync(imageTempPath)) {
      console.log("Cleaning up temporary file due to error...");
      fs.unlinkSync(imageTempPath);
    }

    res.status(500).json({
      success: false,
      message: "Something went wrong while updating the document",
    });
  }
};

const createNewVersion = async (req, res, existingDocument) => {
  const { title, description } = req.body;
  const pdfFile = req.file;
  let imageTempPath = null;

  try {
    console.log("Creating a new version of the document...");
    
    // Store the current version before incrementing
    const previousVersion = existingDocument.currentVersion;
    
    // Create a version record of the current document before updating
    await DocumentVersionModel.create({
      originalDocument: existingDocument._id,
      version: previousVersion,
      title: existingDocument.title,
      description: existingDocument.description,
      pdfUrl: existingDocument.pdfUrl,
      fileName: existingDocument.fileName,
      fileType: existingDocument.fileType || "unknown",
    });

    // Record history for version creation
    try {
      await DocumentHistory.create({
        originalDocument: existingDocument._id,
        action: 'version',
        performedBy: req.admin?.adminId || req.admin?.adminEmailId || null,
        details: { previousVersion, newVersion: existingDocument.currentVersion + 1, previousFileName: existingDocument.fileName }
      });
    } catch (e) { console.warn('Failed to record document history (version):', e.message); }

    // Increment the version number
    existingDocument.currentVersion += 1;
    console.log("New version number:", existingDocument.currentVersion);

    // Prepare the update data
    const updateData = {
      title: title || existingDocument.title,
      description: description || existingDocument.description,
      currentVersion: existingDocument.currentVersion,
    };

    // Handle PDF file update if a new file is provided
    if (pdfFile) {
      imageTempPath = pdfFile.path;
      console.log("Temporary file path:", imageTempPath);

      // Create versioned file name for the old version in DocumentVersionModel
      // But we keep the original name for the current version
      // This ensures the latest version always has the clean filename
      
      // IMPORTANT: never delete previous version files.
      // Upload a unique public_id so older versions remain downloadable.
      const versionedPublicId = `${pdfFile.originalname.split(".")[0]}_V${Date.now()}`;

      console.log("Uploading new file to Cloudinary...");
      const cloudinaryResponse = await cloudinary.uploader.upload(imageTempPath, {
        folder: "Documents_Folder",
        resource_type: "raw",
        public_id: versionedPublicId,
      });


      if (!cloudinaryResponse || cloudinaryResponse.error) {
        console.error("Cloudinary upload failed:", cloudinaryResponse.error);
        if (fs.existsSync(imageTempPath)) {
          fs.unlinkSync(imageTempPath);
        }
        return res.status(400).json({
          success: false,
          message: "Failed to upload new document version to Cloudinary",
        });
      }

      const fileExt = pdfFile.originalname?.split('.').pop()?.toLowerCase();
      const mime = pdfFile.mimetype || '';
      const fileType = fileExt === 'pdf' ? 'pdf' : (mime.includes('word') || fileExt === 'doc' || fileExt === 'docx') ? 'word' : 'image';

      // Update the document's PDF URL and file name
      updateData.pdfUrl = {
        public_id: cloudinaryResponse.public_id,
        url: cloudinaryResponse.secure_url,
      };
      updateData.fileName = pdfFile.originalname; // Keep the original name for current version
      updateData.fileType = fileType;
      console.log("PDF URL updated:", updateData.pdfUrl);
      
      // Update the previous version's file name in DocumentVersionModel to include version number
      await DocumentVersionModel.findOneAndUpdate(
        { originalDocument: existingDocument._id, version: previousVersion },
        { fileName: getVersionedFileName(existingDocument.fileName, previousVersion) }
      );
    }

    // Update the document in the database
    console.log("Updating document in the database...");
    const updatedDocument = await DocumentModel.findByIdAndUpdate(
      existingDocument._id,
      updateData,
      { new: true, runValidators: true }
    );

    // Clean up the temporary file
    if (imageTempPath && fs.existsSync(imageTempPath)) {
      console.log("Cleaning up temporary file...");
      fs.unlinkSync(imageTempPath);
    }

    console.log("Operation successful");
    res.status(200).json({
      success: true,
      document: updatedDocument,
      message: "Document version created and updated successfully",
    });
  } catch (error) {
    console.error("Error in createNewVersion:", error);

    // Clean up the temporary file in case of an error
    if (imageTempPath && fs.existsSync(imageTempPath)) {
      console.log("Cleaning up temporary file due to error...");
      fs.unlinkSync(imageTempPath);
    }

    res.status(500).json({
      success: false,
      message: "Something went wrong while creating new document version",
    });
  }
};

const getAllDocuments = async (req, res) => {
  try {
    const documents = await DocumentModel
      .find()
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      documents,
      message: "Documents fetched successfully",
    });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({
      success: false,
      message: "Something went wrong while fetching documents",
    });
  }
};

const getDocumentVersions = async (req, res) => {
  const { id } = req.params;

  try {
    const versions = await DocumentVersionModel
      .find({ originalDocument: id })
      .sort('-version');
    const currentDocument = await DocumentModel.findById(id);

    if (!currentDocument) {
      return res.status(404).json({
        success: false,
        message: "Document not found"
      });
    }

    res.status(200).json({
      success: true,
      currentDocument,
      versions,
      message: "Document versions fetched successfully"
    });

  } catch (error) {
    console.error('Get document versions error:', error);
    res.status(500).json({
      success: false,
      message: "Something went wrong while fetching document versions"
    });
  }
};

// Get history for a document
const getDocumentHistory = async (req, res) => {
  const { id } = req.params;
  try {
    const history = await DocumentHistory.find({ originalDocument: id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, history });
  } catch (error) {
    console.error('Get document history error:', error);
    res.status(500).json({ success: false, message: 'Something went wrong while fetching document history' });
  }
};

const deleteDocument = async (req, res) => {
  const { id } = req.params;

  try {
    const document = await DocumentModel.findById(id);

    if (!document) {
      return res
        .status(404)
        .json({ success: false, message: "Document not found!" });
    }

    // Delete the main document from Cloudinary
    if (document.pdfUrl && document.pdfUrl.public_id) {
      await cloudinary.uploader.destroy(document.pdfUrl.public_id, {
        resource_type: "raw",
      });
    }

    // Find all versions of this document
    const versions = await DocumentVersionModel.find({ originalDocument: id });
    
    // Delete all version files from Cloudinary
    for (const version of versions) {
      if (version.pdfUrl && version.pdfUrl.public_id) {
        await cloudinary.uploader.destroy(version.pdfUrl.public_id, {
          resource_type: "raw",
        });
      }
    }

    // Delete all versions from database
    await DocumentVersionModel.deleteMany({ originalDocument: id });
    
    // Delete the main document from database
    await DocumentModel.findByIdAndDelete(id);

    // Record delete history
    try {
      await DocumentHistory.create({
        originalDocument: document._id,
        action: 'delete',
        performedBy: req.admin?.adminId || req.admin?.adminEmailId || null,
        details: { title: document.title, fileName: document.fileName }
      });
    } catch (e) { console.warn('Failed to record document history (delete):', e.message); }
    res.status(200).json({
      success: true,
      message: "Document and all its versions deleted successfully",
    });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({
      success: false,
      message: "Something went wrong while deleting document",
    });
  }
};


const sendVerificationCode = async (req, res) => {
  const { email } = req.body;

  try {
    const { error, value } = sendVerificationCodeSchema.validate({ email });
    if (error) {
      return res
        .status(401)
        .json({ success: false, message: error.details[0].message });
    }

    const existingAdmin = await adminModel.findOne({ email });
    if (!existingAdmin) {
      return res.status(404).json({
        success: false,
        message: "Admin does not exists!",
      });
    }
    if (existingAdmin.verified) {
      return res
        .status(400)
        .json({ success: false, message: "you are already verified" });
    }
    //dont use this method in production any one can think this codevalue
    const codeValue = Math.floor(Math.random() * 1000000).toString();

    let info = await transport.sendMail({
      from: process.env.NODEMAILER_SENDING_EMAIL_ADDRESS,
      to: existingAdmin.email,
      subject: "verification code",
      html: "<h1>" + codeValue + "</h1>",
    });
    if (info.accepted[0] === existingAdmin.email) {
      const hashedCodeValue = hmacProcess(
        codeValue,
        process.env.HMAC_VERIFICATION_CODE_SECRET
      );
      existingAdmin.verificationCode = hashedCodeValue;
      existingAdmin.verificationCodeValidation = Date.now();
      await existingAdmin.save();
      return res.status(200).json({ success: true, message: "Code Sent!" });
    }
    return res
      .status(400)
      .json({ success: false, message: `${error}Code sent failed` });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      success: false,
      message: `${error} error in last Code sent failed`,
    });
  }
};

const verifyVerificationCode = async (req, res) => {
  const { email, providedCode } = req.body;
  console.log(email, "this is emai and code", providedCode);
  try {
    const { error, value } = acceptCodeSchema.validate({ email, providedCode });
    if (error) {
      return res.status(401).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const codeValue = providedCode.toString();
    const existingAdmin = await adminModel
      .findOne({ email })
      .select("+verificationCode +verificationCodeValidation");

    if (!existingAdmin) {
      return res
        .status(401)
        .json({ success: false, message: "admin does not exists" });
    }

    if (existingAdmin.verified) {
      return res
        .status(400)
        .json({ success: false, message: "you are already verified" });
    }

    if (
      !existingAdmin.verificationCode ||
      !existingAdmin.verificationCodeValidation
    ) {
      return res
        .status(400)
        .json({ success: false, message: "something is wrong with the code!" });
    }

    if (Date.now() - existingAdmin.verificationCodeValidation > 5 * 60 * 1000) {
      return res
        .status(400)
        .json({ success: false, message: "code has been expired" });
    }

    const hashedCodeValue = hmacProcess(
      codeValue,
      process.env.HMAC_VERIFICATION_CODE_SECRET
    );
    if (hashedCodeValue == existingAdmin.verificationCode) {
      existingAdmin.verified = true;
      existingAdmin.verificationCode = undefined;
      existingAdmin.verificationCodeValidation = undefined;
      await existingAdmin.save();
      return res
        .status(200)
        .json({ success: true, message: "your account has been verified" });
    }
    return res
      .status(400)
      .json({ success: false, message: "unexpected occured !!" });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      success: false,
      message: `${error} error in last Code verification failed`,
    });
  }
};

const changePassword = async (req, res) => {
  const { adminId, verified } = req.admin;
  console.log(verified);
  const { oldPassword, newPassword } = req.body;
  try {
    const { error, value } = changePasswordSchema.validate({
      oldPassword,
      newPassword,
    });
    if (error) {
      return res
        .status(401)
        .json({ success: false, message: error.details[0].message });
    }
    if (!verified) {
      return res
        .status(401)
        .json({ success: false, message: "You are not verified admin!" });
    }
    const existingAdmin = await adminModel
      .findOne({ _id: adminId })
      .select("+password");
    if (!existingAdmin) {
      return res
        .status(401)
        .json({ success: false, message: "Admin does not exists!" });
    }
    const result = await comparePassword(oldPassword, existingAdmin.password);
    if (!result) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials!" });
    }
    const hashedPassword = await hashPassword(newPassword, 12);
    existingAdmin.password = hashedPassword;
    await existingAdmin.save();
    return res
      .status(200)
      .json({ success: true, message: "Password updated!!" });
  } catch (error) {
    console.log(error);
  }
};

const sendForgotPasswordCode = async (req, res) => {
  const { adminEmailId } = req.body;
  try {
    const { error } = forgotPasswordQuestionSchema.validate({ adminEmailId });
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const existingAdmin = await adminModel.findOne({ adminEmailId: adminEmailId?.trim().toLowerCase() });
    if (!existingAdmin) {
      return res.status(404).json({ success: false, message: "Admin does not exist!" });
    }

    const securityQuestionToReturn = getAdminSecurityQuestion(existingAdmin);
    if (!existingAdmin.securityQuestion?.trim()) {
      existingAdmin.securityQuestion = securityQuestionToReturn;
      await existingAdmin.save();
    }

    return res.status(200).json({
      success: true,
      securityQuestion: securityQuestionToReturn,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error fetching security question." });
  }
};

const verifyForgotPasswordCode = async (req, res) => {
  const { adminEmailId, securityAnswer, newPassword } = req.body;

  try {
    const { error } = resetPasswordWithSecurityAnswerSchema.validate({ adminEmailId, securityAnswer, newPassword });
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const existingAdmin = await adminModel
      .findOne({ adminEmailId: adminEmailId?.trim().toLowerCase() })
      .select("+securityAnswerHash +adminPassword");

    if (!existingAdmin) {
      return res.status(404).json({ success: false, message: "Admin does not exist!" });
    }

    const normalizedAnswer = normalizeSecurityAnswer(securityAnswer);
    const isAnswerCorrect = await comparePassword(normalizedAnswer, existingAdmin.securityAnswerHash);
    if (!isAnswerCorrect) {
      return res.status(400).json({ success: false, message: "Incorrect security answer." });
    }

    const hashedPassword = await hashPassword(newPassword, 12);
    existingAdmin.adminPassword = hashedPassword;
    await existingAdmin.save();

    return res.status(200).json({ success: true, message: "Password updated successfully!" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Error resetting password." });
  }
};

export {
  registerAdmin,
  loginAdmin,
  getAdmin,
  logoutAdmin,

  uploadDocument,
  checkDocumentExists,
  getAllDocuments,
  deleteDocument,
  getDocumentVersions,
  handleDuplicateDocument,
  updateDocument,
  createNewVersion,

  getDocumentHistory,

  sendVerificationCode,
  verifyVerificationCode,
  changePassword,
  sendForgotPasswordCode,
  verifyForgotPasswordCode,
};

// Notify all users of a new document
export const notifyUsersOfNewDocument = async (documentId, documentTitle) => {
  try {
    const UserModel = (await import("../models/userModel.js")).default;
    await UserModel.updateMany({}, {
      $push: {
        notifications: {
          message: `New document available: "${documentTitle}"`,
          documentId,
          isRead: false,
          createdAt: new Date()
        }
      }
    });
  } catch (e) {
    console.error("Notify users error:", e);
  }
};
