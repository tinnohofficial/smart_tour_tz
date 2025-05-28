import { z } from "zod"

// Email validation regex
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Password validation rules
export const PASSWORD_RULES = {
  minLength: 8,
  hasUppercase: /[A-Z]/,
  hasLowercase: /[a-z]/,
  hasNumber: /[0-9]/,
  hasSpecialChar: /.*[!@#$%^&*(),.?":{}|<>].*/
}

// Phone number validation for Tanzanian numbers
export const PHONE_REGEX = /^\+255\d{9}$/

// Zod schemas for reusable validation
export const emailSchema = z.string()
  .min(1, "Email is required")
  .regex(EMAIL_REGEX, "Please enter a valid email address")

export const passwordSchema = z.string()
  .min(PASSWORD_RULES.minLength, `Password must be at least ${PASSWORD_RULES.minLength} characters`)
  // .regex(PASSWORD_RULES.hasUppercase, "Password must contain at least one uppercase letter")
  .regex(PASSWORD_RULES.hasLowercase, "Password must contain at least one lowercase letter") 
  .regex(PASSWORD_RULES.hasNumber, "Password must contain at least one number")
  .regex(PASSWORD_RULES.hasSpecialChar, "Password must contain at least one special character")

export const phoneSchema = z.string()
  .min(13, "Phone number must be +255 followed by 9 digits")
  .max(13, "Phone number must be +255 followed by 9 digits")
  .regex(PHONE_REGEX, "Please enter a valid Tanzanian phone number (+255XXXXXXXXX)")

// Password change schema
export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
  })

// Registration schema
export const registrationSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
    phoneNumber: phoneSchema,
    role: z.string().min(1, "Please select a role"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

// Manual validation functions (for components not using react-hook-form)
export const validateEmail = (email) => {
  if (!email) return "Email is required"
  if (!EMAIL_REGEX.test(email)) return "Please enter a valid email address"
  return null
}

export const validatePassword = (password) => {
  if (!password) return "Password is required"
  if (password.length < PASSWORD_RULES.minLength) {
    return `Password must be at least ${PASSWORD_RULES.minLength} characters long`
  }
  // if (!PASSWORD_RULES.hasUppercase.test(password)) {
  //   return "Password must contain at least one uppercase letter"
  // }
  if (!PASSWORD_RULES.hasLowercase.test(password)) {
    return "Password must contain at least one lowercase letter"
  }
  if (!PASSWORD_RULES.hasNumber.test(password)) {
    return "Password must contain at least one number"
  }
  if (!PASSWORD_RULES.hasSpecialChar.test(password)) {
    return "Password must contain at least one special character"
  }
  return null
}

export const validatePasswordMatch = (password, confirmPassword) => {
  if (password !== confirmPassword) return "Passwords do not match"
  return null
}

export const validatePhone = (phone) => {
  if (!phone) return "Phone number is required"
  if (phone.length !== 13) return "Phone number must be +255 followed by 9 digits"
  if (!PHONE_REGEX.test(phone)) return "Please enter a valid Tanzanian phone number (+255XXXXXXXXX)"
  return null
}
