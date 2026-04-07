export interface Session {
  id: string;
  user_id: string;
  title: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateSessionInput {
  user_id: string;
  title: string;
}
