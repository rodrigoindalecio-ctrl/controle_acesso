import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';
const TOKEN_EXPIRY = '7d';

export interface JWTPayload {
  userId: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'USER';
  iat?: number;
  exp?: number;
}

export const generateToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
};

export const verifyToken = (token: string): JWTPayload | null => {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return payload;
  } catch (error) {
    return null;
  }
};

export const setAuthCookie = (response: NextResponse, token: string) => {
  response.cookies.set({
    name: 'auth-token',
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 dias em segundos
    path: '/'
  });
};

export const clearAuthCookie = (response: NextResponse) => {
  response.cookies.delete('auth-token');
};

export const getTokenFromCookies = async () => {
  try {
    const cookieStore = await cookies();
    return cookieStore.get('auth-token')?.value || null;
  } catch (error) {
    return null;
  }
};

export const verifyAuth = async (request: NextRequest): Promise<JWTPayload | null> => {
  try {
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return null;
    }

    return verifyToken(token);
  } catch (error) {
    return null;
  }
};
