export interface JwtPayload {
  userId: string;
  role: "admin" | "doctor" | "staff";
  type: "access" | "refresh";
  iat: number;
  exp: number;
}

export type TokenType = "access" | "refresh";
