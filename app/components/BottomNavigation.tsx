'use client';

import { useRouter, usePathname } from 'next/navigation';
import styles from './BottomNavigation.module.css';
import { useAuth } from '@/lib/hooks/useAuth';
import { Home, Plus, BarChart3, User, Sparkles } from 'lucide-react';

interface BottomNavigationProps {
    onOpenReports?: () => void;
    onOpenUsers?: () => void;
    onOpenProfile?: () => void;
    onOpenAdd?: () => void;
}

export default function BottomNavigation({
    onOpenReports,
    onOpenUsers,
    onOpenProfile,
    onOpenAdd
}: BottomNavigationProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { user } = useAuth();

    // Don't show on login page
    if (pathname === '/' || !user) return null;

    const isDashboard = pathname === '/dashboard';
    const isEventPage = pathname.startsWith('/events/');

    return (
        <nav className={styles.nav}>
            <div className={styles.container}>
                <button
                    className={`${styles.item} ${isDashboard ? styles.active : ''}`}
                    onClick={() => router.push('/dashboard')}
                >
                    <Home className={styles.icon} size={24} strokeWidth={1.5} />
                    <span className={styles.label}>Início</span>
                </button>

                {isEventPage && onOpenAdd && (
                    <button className={styles.item} onClick={onOpenAdd}>
                        <Plus className={styles.icon} size={24} strokeWidth={1.5} />
                        <span className={styles.label}>Convidado</span>
                    </button>
                )}

                {isDashboard && user.role === 'ADMIN' && (
                    <button className={styles.item} onClick={onOpenAdd}>
                        <Sparkles className={styles.icon} size={24} strokeWidth={1.5} />
                        <span className={styles.label}>Novo Evento</span>
                    </button>
                )}

                <button className={styles.item} onClick={onOpenReports}>
                    <BarChart3 className={styles.icon} size={24} strokeWidth={1.5} />
                    <span className={styles.label}>Relatórios</span>
                </button>

                <button className={styles.item} onClick={onOpenProfile}>
                    <User className={styles.icon} size={24} strokeWidth={1.5} />
                    <span className={styles.label}>Perfil</span>
                </button>
            </div>
        </nav>
    );
}
