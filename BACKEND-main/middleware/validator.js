import Joi from "joi";

const securityQuestions = [
  "What is your mother's maiden name?",
  "What was the name of your first school?",
  "What is your favorite book?",
  "What is the name of your childhood best friend?",
  "What city were you born in?",
  "What is your favorite teacher's name?",
  "What was the name of your first pet?",
  "What is your favorite movie?",
  "What is your dream job?",
  "What is your favorite food?",
];

const registerSchema = Joi.object({
  email: Joi.string()
    .min(6)
    .max(60)
    .required()
    .email({
      tlds: { allow: ["com", "net"] },
    }),
  password: Joi.string().required(),
});

const registerSchemaForAdmin = Joi.object({
  adminEmailId: Joi.string()
    .min(6)
    .max(60)
    .required()
    .email({
      tlds: { allow: ["com", "net", "in"] },
    }),

  adminPassword: Joi.string()
    .min(8)
    .max(30)
    .required()
    .pattern(new RegExp("^[a-zA-Z0-9!@#$%^&*()]{8,30}$"))
    .messages({
      "string.pattern.base":
        "Password must contain only alphanumeric and special characters",
      "string.min": "Password must be at least 8 characters long",
      "string.max": "Password cannot exceed 30 characters",
    }),

  adminName: Joi.string()
    .min(2)
    .max(50)
    .required()
    .pattern(new RegExp("^[a-zA-Z ]+$"))
    .messages({
      "string.pattern.base": "Name must contain only letters and spaces",
    }),

  adminLocation: Joi.string().min(3).max(100).optional().messages({
    "string.min": "Location must be at least 3 characters long",
    "string.max": "Location cannot exceed 100 characters",
  }),

  securityQuestion: Joi.string()
    .valid(...securityQuestions)
    .required()
    .messages({
      "any.only": "Please select a valid security question",
      "string.empty": "Security question is required",
    }),

  securityAnswer: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      "string.empty": "Security answer is required",
      "string.min": "Security answer must be at least 2 characters long",
      "string.max": "Security answer cannot exceed 100 characters",
    }),

  adminMobileNo: Joi.string()
    .pattern(new RegExp("^[0-9]{10}$"))
    .required()
    .messages({
      "string.pattern.base": "Mobile number must be exactly 10 digits",
    }),
});

const loginSchema = Joi.object({
  staffEmail: Joi.string()
    .min(6)
    .max(60)
    .required()
    .email({
      tlds: { allow: ["com", "net"] },
    }),
  staffPassword: Joi.string().required(),
});

const loginSchemaForAdmin = Joi.object({
  adminEmailId: Joi.string()
    .min(6)
    .max(60)
    .required()
    .email({
      tlds: { allow: ["com", "net", "in"] },
    }),
  adminPassword: Joi.string().required(),
});

const uploadDocumentSchema = Joi.object({
  title: Joi.string()
    .required()
    .trim()
    .min(3)
    .max(100)
    .messages({
      'string.empty': 'Document title is required',
      'string.min': 'Document title must be at least 3 characters long',
      'string.max': 'Document title cannot exceed 100 characters',
      'any.required': 'Document title is required'
    }),

  description: Joi.string()
    .required()
    .trim()
    .min(10)
    .max(500)
    .messages({
      'string.empty': 'Document description is required',
      'string.min': 'Document description must be at least 10 characters long',
      'string.max': 'Document description cannot exceed 500 characters',
      'any.required': 'Document description is required'
    }),

  pdfFile: Joi.string()
    .required()
    .messages({
      'string.empty': 'PDF file is required',
      'any.required': 'PDF file is required'
    })
});




const sendVerificationCodeSchema = Joi.object({
  email: Joi.string()
    .min(6)
    .max(60)
    .required()
    .email({
      tlds: { allow: ["com", "net"] },
    }),
});
const acceptCodeSchema = Joi.object({
  email: Joi.string()
    .min(6)
    .max(60)
    .required()
    .email({
      tlds: { allow: ["com", "net"] },
    }),
  providedCode: Joi.string().min(6).max(6).required(),
});

const changePasswordSchema = Joi.object({
  oldPassword: Joi.string().required().min(8).max(20),

  newPassword: Joi.string().required().min(8).max(20),
});

const forgotPasswordQuestionSchema = Joi.object({
  adminEmailId: Joi.string()
    .min(6)
    .max(60)
    .required()
    .email({
      tlds: { allow: ["com", "net", "in"] },
    }),
});

const forgotPasswordQuestionSchemaForUser = Joi.object({
  userEmail: Joi.string()
    .min(6)
    .max(60)
    .required()
    .email({
      tlds: { allow: ["com", "net", "in"] },
    }),
});

const resetPasswordWithSecurityAnswerSchema = Joi.object({
  adminEmailId: Joi.string()
    .min(6)
    .max(60)
    .required()
    .email({
      tlds: { allow: ["com", "net", "in"] },
    }),
  securityAnswer: Joi.string().min(2).max(100).required(),
  newPassword: Joi.string().min(8).max(30).optional(),
});

const resetPasswordWithSecurityAnswerSchemaForUser = Joi.object({
  userEmail: Joi.string()
    .min(6)
    .max(60)
    .required()
    .email({
      tlds: { allow: ["com", "net", "in"] },
    }),
  securityAnswer: Joi.string().min(2).max(100).required(),
  newPassword: Joi.string().min(8).max(30).optional(),
});



export {
  securityQuestions,
  registerSchemaForAdmin,
  loginSchemaForAdmin,
  registerSchema,
  loginSchema,

  uploadDocumentSchema,
  
  sendVerificationCodeSchema,
  acceptCodeSchema,
  changePasswordSchema,
  forgotPasswordQuestionSchema,
  forgotPasswordQuestionSchemaForUser,
  resetPasswordWithSecurityAnswerSchema,
  resetPasswordWithSecurityAnswerSchemaForUser,
};
