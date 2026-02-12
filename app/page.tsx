'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import styles from './page.module.css';
import LoginTransition from './components/LoginTransition';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showTransition, setShowTransition] = useState(false);

  useEffect(() => {
    // Verificar se usuário já está logado
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();
      
      if (data.user) {
        router.push('/dashboard');
      }
    } catch (error) {
      // Usuário não autenticado, continuar na página de login
    }
  };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Erro ao fazer login');
        setLoading(false);
        return;
      }

      // Login bem-sucedido — mostrar transição
      setShowTransition(true);
    } catch (error) {
      setError('Erro ao conectar com o servidor');
      console.error('Erro no login:', error);
      setLoading(false);
    }
  };

  const handleTransitionComplete = () => {
    window.location.href = '/dashboard';
  };

  if (showTransition) {
    return <LoginTransition onComplete={handleTransitionComplete} />;
  }

  return (
    <div className={styles.loginContainer}>
      <div className={styles.background}></div>

      <div className={styles.content}>
        <div className={styles.card}>
          {/* Logo/Header */}
          <div className={styles.header}>
            <div className={styles.logo}>
              <Image
                src="/logo-vb.png"
                alt="VB Assessoria"
                width={200}
                height={60}
                priority
              />
            </div>
            <p className={styles.subtitle}>Sistema de Eventos Sociais</p>
          </div>

          {/* Formulário */}
          <div className={styles.form}>
            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.formGroup}>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                autoComplete="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="password">Senha</label>
              <input
                id="password"
                autoComplete="current-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              className={`${styles.submitButton} btn-primary`}
              disabled={loading}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
