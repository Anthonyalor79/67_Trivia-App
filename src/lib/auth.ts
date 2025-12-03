import jwt from "jsonwebtoken";

// Name of the cookie where JWT will be stored
export const COOKIE_NAME = "taptap_admin_token";

// Load secret from environment
const JWT_SECRET = process.env.JWT_SECRET!;
if (!JWT_SECRET) {
  throw new Error("Missing JWT_SECRET in environment variables.");
}

// ------------------------------------------------------------
// Sign JWT (used after successful login)
// ------------------------------------------------------------
export function signToken(adminId: number) {
  return jwt.sign({ adminId }, JWT_SECRET, {
    expiresIn: "1hr",
  });
}

// ------------------------------------------------------------
// Verify JWT and return { adminId } or null
// ------------------------------------------------------------
export function verifyToken(token: string): { adminId: number } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { adminId: number };
  } catch {
    return null;
  }
}
