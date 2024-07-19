const Joi = require("joi");

const contactValidation = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    "string.empty": "Name is required",
    "string.min": "Name must be at least 2 characters long",
    "string.max": "Name cannot exceed 100 characters",
    "any.required": "Name is required",
  }),

  email: Joi.string().email().required().messages({
    "string.empty": "Email is required",
    "string.email": "Please provide a valid email address",
    "any.required": "Email is required",
  }),

  subject: Joi.string().trim().min(5).max(200).required().messages({
    "string.empty": "Subject is required",
    "string.min": "Subject must be at least 5 characters long",
    "string.max": "Subject cannot exceed 200 characters",
    "any.required": "Subject is required",
  }),

  inquiry: Joi.string().trim().min(10).max(2000).required().messages({
    "string.empty": "Inquiry is required",
    "string.min": "Inquiry must be at least 10 characters long",
    "string.max": "Inquiry cannot exceed 2000 characters",
    "any.required": "Inquiry is required",
  }),
});

module.exports = { contactValidation };
