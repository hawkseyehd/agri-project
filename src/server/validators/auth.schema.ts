import { z } from "zod";

export const registrationSchema = z
  .object({
    name: z.string().trim().min(2, "Name is required."),
    email: z.string().trim().toLowerCase().email("Enter a valid email address."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(8, "Confirm your password.")
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"]
  });

export type RegistrationInput = z.infer<typeof registrationSchema>;
