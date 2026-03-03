'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import styles from './page.module.css';

export default function QuickAccessLanding() {
    const params = useParams();
    const router = useRouter();
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const token = params.token as string;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/quick-access/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, name })
            });

            const data = await res.json();

            if (res.ok) {
                router.push('/quick-access/dashboard');
            } else {
                setError(data.message || 'Erro ao entrar');
            }
        } catch (err) {
            setError('Erro de conexão');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <h1 className={styles.title}>Acesso Rápido</h1>
                <p className={styles.subtitle}>Bem-vindo ao sistema de check-in.</p>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <label htmlFor="name">Seu Nome para Identificação:</label>
                        <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ex: João - Buffet"
                            required
                            autoFocus
                        />
                    </div>

                    {error && <p className={styles.error}>{error}</p>}

                    <button type="submit" disabled={loading || !name.trim()} className={styles.button}>
                        {loading ? 'Entrando...' : 'Começar a Ajudar'}
                    </button>
                </form>
            </div>
        </div>
    );
}
