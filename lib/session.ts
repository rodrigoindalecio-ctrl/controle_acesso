import { getTokenFromCookies, verifyToken } from './auth';

export const getAuthSession = async () => {
  const token = await getTokenFromCookies();
  
  if (!token) {
    return null;
  }

  const payload = verifyToken(token);
  
  if (!payload) {
    return null;
  }

  return payload;
};
