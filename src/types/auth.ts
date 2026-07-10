export interface AdminSession {
  accessToken: string;
  email: string;
  userId: string;
  role: "super_admin" | "admin" | "visualizador";
  nome?: string | null;
}
