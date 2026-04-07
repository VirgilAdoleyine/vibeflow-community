export interface User {
  id: string;
  email: string;
  password_hash: string;
  openrouter_api_key: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserInput {
  email: string;
  password: string;
  openrouter_api_key?: string;
}

export interface UserSession {
  id: string;
  email: string;
  openrouter_api_key: string | null;
}
