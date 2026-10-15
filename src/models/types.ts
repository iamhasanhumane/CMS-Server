export type UserRole = "admin" | "doctor" | "staff";

export interface UserAttributes {
  id: string;
  name: string;
  username: string;
  password: string;
  role: UserRole;
  phone: string | null;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
