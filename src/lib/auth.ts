import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const TOKEN_NAME = 'todo_token';

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function createToken(userId: string) {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: '30d' });
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as { sub: string; iat: number; exp: number };
  } catch (e) {
    return null;
  }
}

export function createAuthCookie(token: string) {
  const maxAge = 60 * 60 * 24 * 30; // 30 days
  const secure = process.env.NODE_ENV === 'production';
  return `${TOKEN_NAME}=${token}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Lax${
    secure ? '; Secure' : ''
  }`;
}

export function clearAuthCookie() {
  return `${TOKEN_NAME}=deleted; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`;
}

export function getTokenFromCookie(cookieHeader?: string) {
  if (!cookieHeader) return null;
  const pairs = cookieHeader.split(';').map((s) => s.trim());
  for (const p of pairs) {
    if (p.startsWith(`${TOKEN_NAME}=`)) return p.split('=')[1];
  }
  return null;
}
