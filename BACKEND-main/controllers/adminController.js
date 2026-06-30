import jwt from "jsonwebtoken";
import {
  sendVerificationCodeSchema,
  acceptCodeSchema,
  changePasswordSchema,
  registerSchemaForAdmin,
  loginSchemaForAdmin,
  sendForgotPasswordCodeForAdminSchema,
  uploadDocumentSchema,
} from "../middleware/validator.js";
import adminModel from "../models/adminModel.js";
import {
  comparePassword,
  hashPassword,
  hmacProcess,
} from "../utils/hashing.js";
import { v2 as cloudinary } from "cloudinary";
import transport from "../middleware/sendMail.js";
import csv from "csvtojson";
import fs from "fs";

import axios from "axios";
import sendEmailNotification from "../middleware/sendEmailNotification.js";
import DocumentModel from "../models/documentModel.js";
import DocumentVersionModel from "../models/DocumentVersionModel.js";

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

    // Validate input data
    const { error, value } = registerSchemaForAdmin.validate({
      adminEmailId,
      adminPassword,
      adminName,
      adminLocation,
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

    // Hash the password
    const hashedPassword = await hashPassword(adminPassword, 12);

    const verificationCodeValidation = Date.now() + 24 * 60 * 60 * 1000; // 24 hours validity

    // Prepare the admin object
    const adminData = {
      adminEmailId,
      adminPassword: hashedPassword,
      adminName,
      adminLocation,
      adminMobileNo,
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
      .findOne({ adminEmailId })
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

    // If you need to include image data like in the doctor profile, handle it here
    // You can add any necessary logic to return image data or any other fields

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

// const getVersionedFileName = (originalFileName, version) => {
//   const fileNameParts = originalFileName.split('.');
//   const extension = fileNameParts.pop();
//   const baseName = fileNameParts.join('.');
//   return `${baseName}_V${version}.${extension}`;
// };

// const uploadDocument = async (req, res) => {
//   const { title, description } = req.body;
//   const pdfFile = req.file;
//   let imageTempPath = null;

//   try {
//     if (!pdfFile) {
//       return res.status(400).json({ success: false, message: "PDF file is required!" });
//     }

//     imageTempPath = pdfFile.path;
    
//     // Upload to Cloudinary
//     const cloudinaryResponse = await cloudinary.uploader.upload(
//       imageTempPath,
//       { 
//         folder: "Documents_Folder",
//         resource_type: 'raw'
//       }
//     );

//     if (!cloudinaryResponse || cloudinaryResponse.error) {
//       if (fs.existsSync(imageTempPath)) {
//         fs.unlinkSync(imageTempPath);
//       }
//       return res.status(400).json({
//         success: false,
//         message: "Failed to upload document to Cloudinary",
//       });
//     }

//     // Create document in database
//     const newDocument = await DocumentModel.create({
//       title,
//       description,
//       pdfUrl: {
//         public_id: cloudinaryResponse.public_id,
//         url: cloudinaryResponse.secure_url
//       },
//       fileName: pdfFile.originalname,
//       currentVersion: 0
//     });

//     // Clean up temp file
//     if (fs.existsSync(imageTempPath)) {
//       fs.unlinkSync(imageTempPath);
//     }

//     res.status(201).json({
//       success: true,
//       document: newDocument,
//       message: "Document uploaded successfully",
//     });

//   } catch (error) {
//     if (imageTempPath && fs.existsSync(imageTempPath)) {
//       fs.unlinkSync(imageTempPath);
//     }
    
//     console.error('Upload document error:', error);
//     res.status(500).json({
//       success: false,
//       message: "Something went wrong while uploading document",
//     });
//   }
// };

// const updateDocument = async (req, res) => {
//   const { id } = req.params;
//   const { title, description, createVersion } = req.body;
//   const pdfFile = req.file;
//   let imageTempPath = null;

//   console.log("Request ID:", id);
//   console.log("Request Body - Title:", title);
//   console.log("Request Body - Description:", description);
//   console.log("Request File:", pdfFile);

//   try {
//     // Check if the document exists
//     const existingDocument = await DocumentModel.findById(id);
//     if (!existingDocument) {
//       return res.status(404).json({
//         success: false,
//         message: "Document not found",
//       });
//     }

//     // If creating a new version, delegate to version controller
//     if (createVersion === "true") {
//       return await versionController.createNewVersion(req, res, existingDocument);
//     }

//     // Prepare the update data
//     const updateData = {
//       title,
//       description,
//       currentVersion: existingDocument.currentVersion,
//     };

//     // Handle PDF file update if a new file is provided
//     if (pdfFile) {
//       imageTempPath = pdfFile.path;
//       console.log("Temporary file path:", imageTempPath);

//       // Delete the existing PDF from Cloudinary if it exists
//       if (existingDocument.pdfUrl && existingDocument.pdfUrl.public_id) {
//         console.log("Deleting existing PDF from Cloudinary...");
//         await cloudinary.uploader.destroy(existingDocument.pdfUrl.public_id, {
//           resource_type: "raw",
//         });
//       }

//       console.log("Uploading new PDF to Cloudinary...");
//       const cloudinaryResponse = await cloudinary.uploader.upload(imageTempPath, {
//         folder: "Documents_Folder",
//         resource_type: "raw",
//         public_id: pdfFile.originalname.split(".")[0], // Remove extension for public_id
//       });

//       if (!cloudinaryResponse || cloudinaryResponse.error) {
//         console.error("Cloudinary upload failed:", cloudinaryResponse.error);
//         if (fs.existsSync(imageTempPath)) {
//           fs.unlinkSync(imageTempPath);
//         }
//         return res.status(400).json({
//           success: false,
//           message: "Failed to upload new document to Cloudinary",
//         });
//       }

//       // Update the document's PDF URL and file name
//       updateData.pdfUrl = {
//         public_id: cloudinaryResponse.public_id,
//         url: cloudinaryResponse.secure_url,
//       };
//       updateData.fileName = pdfFile.originalname;
//       console.log("PDF URL updated:", updateData.pdfUrl);
//     }

//     // Update the document in the database
//     console.log("Updating document in the database...");
//     const updatedDocument = await DocumentModel.findByIdAndUpdate(
//       id,
//       updateData,
//       { new: true, runValidators: true }
//     );

//     // Clean up the temporary file
//     if (imageTempPath && fs.existsSync(imageTempPath)) {
//       console.log("Cleaning up temporary file...");
//       fs.unlinkSync(imageTempPath);
//     }

//     console.log("Operation successful");
//     res.status(200).json({
//       success: true,
//       document: updatedDocument,
//       message: "Document updated successfully",
//     });
//   } catch (error) {
//     console.error("Error in updateDocument:", error);

//     // Clean up the temporary file in case of an error
//     if (imageTempPath && fs.existsSync(imageTempPath)) {
//       console.log("Cleaning up temporary file due to error...");
//       fs.unlinkSync(imageTempPath);
//     }

//     res.status(500).json({
//       success: false,
//       message: "Something went wrong while updating the document",
//     });
//   }
// };

// // versionController.js
// const createNewVersion = async (req, res) => {
//   const { title, description } = req.body;
//   const { id } = req.params;
//   const pdfFile = req.file;
//   let imageTempPath = null;


//   const existingDocument = await DocumentModel.findById(id);
//   try {
//     console.log("Creating a new version of the document...");
//     await DocumentVersionModel.create({
//       originalDocument: existingDocument._id,
//       version: existingDocument.currentVersion,
//       title: existingDocument.title,
//       description: existingDocument.description,
//       pdfUrl: existingDocument.pdfUrl,
//       fileName: existingDocument.fileName,
//     });

//     // Increment the version number
//     existingDocument.currentVersion += 1;
//     console.log("New version number:", existingDocument.currentVersion);

//     // Prepare the update data
//     const updateData = {
//       title,
//       description,
//       currentVersion: existingDocument.currentVersion,
//     };

//     // Handle PDF file update if a new file is provided
//     if (pdfFile) {
//       imageTempPath = pdfFile.path;
//       console.log("Temporary file path:", imageTempPath);

//       // Delete the existing PDF from Cloudinary if it exists
//       if (existingDocument.pdfUrl && existingDocument.pdfUrl.public_id) {
//         console.log("Deleting existing PDF from Cloudinary...");
//         await cloudinary.uploader.destroy(existingDocument.pdfUrl.public_id, {
//           resource_type: "raw",
//         });
//       }

//       const versionedFileName = getVersionedFileName(
//         pdfFile.originalname,
//         existingDocument.currentVersion
//       );

//       console.log("Uploading new PDF to Cloudinary...");
//       const cloudinaryResponse = await cloudinary.uploader.upload(imageTempPath, {
//         folder: "Documents_Folder",
//         resource_type: "raw",
//         public_id: versionedFileName.split(".")[0], // Remove extension for public_id
//       });

//       if (!cloudinaryResponse || cloudinaryResponse.error) {
//         console.error("Cloudinary upload failed:", cloudinaryResponse.error);
//         if (fs.existsSync(imageTempPath)) {
//           fs.unlinkSync(imageTempPath);
//         }
//         return res.status(400).json({
//           success: false,
//           message: "Failed to upload new document version to Cloudinary",
//         });
//       }

//       // Update the document's PDF URL and file name
//       updateData.pdfUrl = {
//         public_id: cloudinaryResponse.public_id,
//         url: cloudinaryResponse.secure_url,
//       };
//       updateData.fileName = versionedFileName;
//       console.log("PDF URL updated:", updateData.pdfUrl);
//     }

//     // Update the document in the database
//     console.log("Updating document in the database...");
//     const updatedDocument = await DocumentModel.findByIdAndUpdate(
//       existingDocument._id,
//       updateData,
//       { new: true, runValidators: true }
//     );

//     // Clean up the temporary file
//     if (imageTempPath && fs.existsSync(imageTempPath)) {
//       console.log("Cleaning up temporary file...");
//       fs.unlinkSync(imageTempPath);
//     }

//     console.log("Operation successful");
//     res.status(200).json({
//       success: true,
//       document: updatedDocument,
//       message: "Document version created and updated successfully",
//     });
//   } catch (error) {
//     console.error("Error in createNewVersion:", error);

//     // Clean up the temporary file in case of an error
//     if (imageTempPath && fs.existsSync(imageTempPath)) {
//       console.log("Cleaning up temporary file due to error...");
//       fs.unlinkSync(imageTempPath);
//     }

//     res.status(500).json({
//       success: false,
//       message: "Something went wrong while creating new document version",
//     });
//   }
// };


// const getAllDocuments = async (req, res) => {
//   try {
//     const documents = await DocumentModel
//       .find()
//       .sort('-createdAt');

//     res.status(200).json({
//       success: true,
//       documents,
//       message: "Documents fetched successfully",
//     });
//   } catch (error) {
//     console.error('Get documents error:', error);
//     res.status(500).json({
//       success: false,
//       message: "Something went wrong while fetching documents",
//     });
//   }
// };

// const getDocumentVersions = async (req, res) => {
//   const { id } = req.params;

//   try {
//     const versions = await DocumentVersionModel
//       .find({ originalDocument: id })
//       .sort('-version');
//     const currentDocument = await DocumentModel.findById(id);

//     if (!currentDocument) {
//       return res.status(404).json({
//         success: false,
//         message: "Document not found"
//       });
//     }

//     res.status(200).json({
//       success: true,
//       currentDocument,
//       versions,
//       message: "Document versions fetched successfully"
//     });

//   } catch (error) {
//     console.error('Get document versions error:', error);
//     res.status(500).json({
//       success: false,
//       message: "Something went wrong while fetching document versions"
//     });
//   }
// };

// const deleteDocument = async (req, res) => {
//   const { id } = req.params;

//   try {
//     const document = await documentModel.findById(id);

//     if (!document) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Document not found!" });
//     }

//     // Delete from Cloudinary
//     const publicId = document.pdfUrl.split('/').pop().split('.')[0];
//     await cloudinary.uploader.destroy(publicId);

//     // Delete from database
//     await documentModel.findByIdAndDelete(id);

//     res.status(200).json({
//       success: true,
//       message: "Document deleted successfully",
//     });
//   } catch (error) {
//     console.error('Delete document error:', error);
//     res.status(500).json({
//       success: false,
//       message: "Something went wrong while deleting document",
//     });
//   }
// };


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
    const newDocument = await DocumentModel.create({
      title,
      description,
      pdfUrl: {
        public_id: cloudinaryResponse.public_id,
        url: cloudinaryResponse.secure_url
      },
      fileName: pdfFile.originalname,
      currentVersion: 0
    });

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

      // Delete the existing PDF from Cloudinary if it exists
      if (existingDocument.pdfUrl && existingDocument.pdfUrl.public_id) {
        console.log("Deleting existing PDF from Cloudinary...");
        await cloudinary.uploader.destroy(existingDocument.pdfUrl.public_id, {
          resource_type: "raw",
        });
      }

      console.log("Uploading new PDF to Cloudinary...");
      const cloudinaryResponse = await cloudinary.uploader.upload(imageTempPath, {
        folder: "Documents_Folder",
        resource_type: "raw",
        public_id: pdfFile.originalname.split(".")[0], // Remove extension for public_id
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

      // Update the document's PDF URL and file name
      updateData.pdfUrl = {
        public_id: cloudinaryResponse.public_id,
        url: cloudinaryResponse.secure_url,
      };
      updateData.fileName = pdfFile.originalname;
      console.log("PDF URL updated:", updateData.pdfUrl);
    }

    // Update the document in the database
    console.log("Updating document in the database...");
    const updatedDocument = await DocumentModel.findByIdAndUpdate(
      id,
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
    });

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
      
      // Delete the existing PDF from Cloudinary if it exists
      if (existingDocument.pdfUrl && existingDocument.pdfUrl.public_id) {
        console.log("Deleting existing PDF from Cloudinary...");
        await cloudinary.uploader.destroy(existingDocument.pdfUrl.public_id, {
          resource_type: "raw",
        });
      }

      console.log("Uploading new PDF to Cloudinary...");
      // Upload with the original file name for the current version (no version suffix)
      const cloudinaryResponse = await cloudinary.uploader.upload(imageTempPath, {
        folder: "Documents_Folder",
        resource_type: "raw",
        public_id: pdfFile.originalname.split(".")[0], // Remove extension for public_id
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

      // Update the document's PDF URL and file name
      updateData.pdfUrl = {
        public_id: cloudinaryResponse.public_id,
        url: cloudinaryResponse.secure_url,
      };
      updateData.fileName = pdfFile.originalname; // Keep the original name for current version
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
    const { error } = sendForgotPasswordCodeForAdminSchema.validate({
      adminEmailId,
    });
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const existingAdmin = await adminModel.findOne({ adminEmailId });
    if (!existingAdmin) {
      return res.status(404).json({
        success: false,
        message: "Admin does not exist!",
      });
    }

    // Configure the authenticator to generate a 6-digit OTP
    authenticator.options = { digits: 6 };

    function generateOTP(secret) {
      return authenticator.generate(secret);
    }

    // You can use a unique secret per user or session
    const secret = authenticator.generateSecret();
    const codeValue = generateOTP(secret); // Example output: "749302"

    let info = await transport.sendMail({
      from: process.env.NODEMAILER_SENDING_EMAIL_ADDRESS,
      to: existingAdmin.adminEmailId,
      subject: "Psycortex: Password Reset Code",
      html: `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <div style="max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px; background-color: #1c1c1c; color: #f4f4f4;">
        <h2 style="color: #00ccff; text-align: center;">Psycortex</h2>
        <h3 style="text-align: center;">Password Reset Request</h3>
        <p>Hello ${existingAdmin.adminName},</p>
        <p>We received a request to reset your password. Please use the following verification code to proceed with the reset:</p>
        
        <div style="text-align: center; margin: 20px;">
          <span style="font-size: 24px; font-weight: bold; color: #ff6600;">${codeValue}</span>
        </div>

        <p>If you did not request a password reset, please disregard this message. Your account remains secure.</p>

        <div style="border-top: 1px solid #eaeaea; margin-top: 20px; padding-top: 10px;">
          <p style="font-size: 12px; text-align: center; color: #999;">
            &copy; ${new Date().getFullYear()} Psycortex. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  `,
    });

    if (info.accepted.includes(existingAdmin.adminEmailId)) {
      const hashedCodeValue = hmacProcess(
        codeValue,
        process.env.HMAC_VERIFICATION_CODE_SECRET
      );
      existingAdmin.forgotPasswordCode = hashedCodeValue;
      existingAdmin.forgotPasswordCodeValidation = Date.now();
      await existingAdmin.save();

      return res.status(200).json({
        success: true,
        message: "Code sent successfully!",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to send code!",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error sending forgot password code!",
    });
  }
};

const verifyForgotPasswordCode = async (req, res) => {
  const { adminEmailId, providedCode, newPassword } = req.body;

  try {
    // Validate the input using schema
    const { error } = acceptFPCodeForAdminSchema.validate({
      adminEmailId,
      providedCode,
      newPassword,
    });
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    // Find admin by email
    const existingAdmin = await adminModel
      .findOne({ adminEmailId })
      .select("+forgotPasswordCode +forgotPasswordCodeValidation");

    if (!existingAdmin) {
      return res.status(404).json({
        success: false,
        message: "Admin does not exist!",
      });
    }

    if (
      !existingAdmin.forgotPasswordCode ||
      !existingAdmin.forgotPasswordCodeValidation
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired code!",
      });
    }

    // Check if the code has expired (valid for 5 minutes)
    if (
      Date.now() - existingAdmin.forgotPasswordCodeValidation >
      5 * 60 * 1000
    ) {
      return res.status(400).json({
        success: false,
        message: "Code has expired!",
      });
    }

    // Hash the provided code and compare it with the stored hashed code
    const hashedCodeValue = hmacProcess(
      providedCode,
      process.env.HMAC_VERIFICATION_CODE_SECRET
    );
    if (hashedCodeValue === existingAdmin.forgotPasswordCode) {
      // Hash the new password
      const hashedPassword = await hashPassword(newPassword, 12);

      // Update the password and clear forgot password fields
      existingAdmin.adminPassword = hashedPassword;
      existingAdmin.forgotPasswordCode = undefined;
      existingAdmin.forgotPasswordCodeValidation = undefined;

      // Save the updated admin
      await existingAdmin.save();

      return res.status(200).json({
        success: true,
        message: "Password updated successfully!",
      });
    }

    return res.status(400).json({
      success: false,
      message: "Invalid code provided!",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Error verifying forgot password code!",
    });
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
