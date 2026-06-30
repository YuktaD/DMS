import Joi from "joi";

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

const sendForgotPasswordCodeSchema = Joi.object({
  doctorEmailId: Joi.string()
    .min(6)
    .max(60)
    .required()
    .email({
      tlds: { allow: ["com", "net"] },
    }),
});

const sendForgotPasswordCodeForAdminSchema = Joi.object({
  adminEmailId: Joi.string()
    .min(6)
    .max(60)
    .required()
    .email({
      tlds: { allow: ["com", "net"] },
    }),
});



export {
  registerSchemaForAdmin,
  loginSchemaForAdmin,
  registerSchema,
  loginSchema,

  uploadDocumentSchema,
  
  sendVerificationCodeSchema,
  acceptCodeSchema,
  changePasswordSchema,
  sendForgotPasswordCodeSchema,
  sendForgotPasswordCodeForAdminSchema,
};
