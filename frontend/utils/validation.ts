import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const createUserSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  full_name: z.string().trim().min(1, "Full name is required"),
  role: z.enum(["admin", "user"]),
  is_active: z.boolean().optional(),
});

export const editUserSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  full_name: z.string().trim().min(1, "Full name is required"),
  role: z.enum(["admin", "user"]),
});

export const resetPasswordSchema = z.object({
  new_password: z.string().min(8, "Password must be at least 8 characters"),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type CreateUserFormData = z.infer<typeof createUserSchema>;
export type EditUserFormData = z.infer<typeof editUserSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
