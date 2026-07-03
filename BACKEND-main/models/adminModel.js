import mongoose from "mongoose";

const adminSchema = mongoose.Schema(
  {
    adminEmailId: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      unique: [true, 'Email must be unique'],
      minLength: [6, 'Email must have 6 characters!'],
      lowercase: true,
    },

    adminPassword: {
      type: String,
      required: [true, 'Password must be provided'],
      trim: true,
      select: false,
    },

    adminName: {
      type: String,
    
    },

    adminLocation:{
      type: String,
     
    },
    adminMobileNo:{
      type: String,
     
    },

    adminImagelink: {
      public_id: String,
      url: String,  
     },

    verified: {
      type: Boolean,
      default: false,
    },
    securityQuestion: {
      type: String,
      required: [true, 'Security question is required'],
      trim: true,
      default: "What is your favorite food?",
    },
    securityAnswerHash: {
      type: String,
      required: [true, 'Security answer is required'],
      select: false,
    },
    passwordResetAuthorizedExpiry: {
      type: Date,
      select: false,
    },
  },
  { timestamps: true }
);

const adminModel = mongoose.models.admin || mongoose.model("admin", adminSchema);
export default adminModel;
