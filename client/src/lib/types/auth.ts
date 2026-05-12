export interface AuthResponse {
  token: string;
  name: string;
  role: "user" | "admin";
  userId: string;
}
