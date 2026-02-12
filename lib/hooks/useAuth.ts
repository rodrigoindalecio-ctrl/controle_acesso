import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthUser } from '@/lib/types';
import { apiClient } from '@/lib/api-client';

export function useAuth() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Verificar sessão ao montar componente
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getMe();
      setUser(response.data.user);
    } catch (err) {
      setUser(null);
      setError('Não autenticado');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.login(email, password);
      
      if (response.data.success) {
        await checkAuth();
        return { success: true };
      }
    } catch (err: any) {
      const message = err.response?.data?.error || 'Erro ao fazer login';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await apiClient.logout();
      setUser(null);
      router.push('/');
    } catch (err) {
      setError('Erro ao fazer logout');
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    error,
    login,
    logout,
    checkAuth,
  };
}
