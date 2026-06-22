import { z } from 'zod';

export const UserSchema = z.object({
  username: z.string(),
  nickname: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  social: z.boolean(),
});
export type User = z.infer<typeof UserSchema>;

export const LoginRequestSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const LoginResponseSchema = z.object({
  refreshToken: z.string(),
});
export type LoginResponse = z.infer<typeof LoginResponseSchema>;

export const RefreshRequestSchema = z.object({
  refreshToken: z.string(),
});
export type RefreshRequest = z.infer<typeof RefreshRequestSchema>;

export const RefreshResponseSchema = z.object({
  refreshToken: z.string(),
});
export type RefreshResponse = z.infer<typeof RefreshResponseSchema>;

export const SignupRequestSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(8),
  nickname: z.string().min(1),
  email: z.string().email(),
});
export type SignupRequest = z.infer<typeof SignupRequestSchema>;

// Backend signup returns { userEntityId: Long } per UserController.signUp.
export const SignupResponseSchema = z.object({
  userEntityId: z.coerce.number().int(),
});
export type SignupResponse = z.infer<typeof SignupResponseSchema>;
