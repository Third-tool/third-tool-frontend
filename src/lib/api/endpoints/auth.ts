import { apiClient } from '@/lib/api/client';
import {
  LoginRequestSchema,
  LoginResponseSchema,
  RefreshRequestSchema,
  RefreshResponseSchema,
  SignupRequestSchema,
  SignupResponseSchema,
  UserSchema,
  type LoginRequest,
  type LoginResponse,
  type RefreshRequest,
  type RefreshResponse,
  type SignupRequest,
  type User,
} from '@/lib/api/schemas/auth';

export async function login(payload: LoginRequest): Promise<LoginResponse> {
  const validated = LoginRequestSchema.parse(payload);
  const { data } = await apiClient.post('/login', validated);
  return LoginResponseSchema.parse(data);
}

export async function getCurrentUser(): Promise<User> {
  const { data } = await apiClient.get('/user');
  return UserSchema.parse(data);
}

export async function refreshToken(payload: RefreshRequest): Promise<RefreshResponse> {
  const validated = RefreshRequestSchema.parse(payload);
  const { data } = await apiClient.post('/jwt/refresh', validated);
  return RefreshResponseSchema.parse(data);
}

// Backend POST /user returns { userEntityId } only — auto-login afterward so the
// caller still receives a refreshToken and the existing useSignup flow keeps working.
export async function signup(payload: SignupRequest): Promise<LoginResponse> {
  const validated = SignupRequestSchema.parse(payload);
  const { data: signupData } = await apiClient.post('/user', validated);
  SignupResponseSchema.parse(signupData);
  return login({ username: validated.username, password: validated.password });
}
