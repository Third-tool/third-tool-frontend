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

// PUT /user — backend DTO UserUpdateRequestDTO (M1 Story 2 5-4):
// username/password were removed; only nickname/email are editable for self.
export const UserUpdateRequestSchema = z.object({
  nickname: z.string().min(1).optional(),
  email: z.string().email().optional(),
});
export type UserUpdateRequest = z.infer<typeof UserUpdateRequestSchema>;

export const UserUpdateResponseSchema = z.coerce.number().int();
export type UserUpdateResponse = z.infer<typeof UserUpdateResponseSchema>;

// Unified error envelope from GlobalExceptionHandler — every 4xx/5xx returns this.
export const ErrorResponseSchema = z.object({
  code: z.string(),
  message: z.string(),
  path: z.string(),
  timestamp: z.string(),
});
export type ErrorResponseBody = z.infer<typeof ErrorResponseSchema>;

// POST /social/login/{provider} — BE accepts {code, state?}; provider is kakao | naver.
export const SocialProviderSchema = z.enum(['kakao', 'naver']);
export type SocialProvider = z.infer<typeof SocialProviderSchema>;

export const SocialLoginRequestSchema = z.object({
  code: z.string().min(1),
  state: z.string().optional(),
});
export type SocialLoginRequest = z.infer<typeof SocialLoginRequestSchema>;

// Same TokenResponse shape as /login (refreshToken in body, AT in cookie).
export const SocialLoginResponseSchema = LoginResponseSchema;
export type SocialLoginResponse = LoginResponse;
