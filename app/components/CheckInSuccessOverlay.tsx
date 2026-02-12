'use client';

import React, { useEffect } from 'react';
import styles from './CheckInSuccessOverlay.module.css';

interface Guest {
  id: string;
  fullName: string;
  checkedInAt: string | null;
  category?: string;
  tableNumber?: string | null;
}

interface CheckInSuccessOverlayProps {
  guest: Guest | null;
  onClose: () => void;
}

/**
 * P3.1: Full-screen success overlay after check-in
 * Displays a welcoming message with guest name and optional table number
 * Auto-closes after ~2500ms
 */
export default function CheckInSuccessOverlay({ guest, onClose }: CheckInSuccessOverlayProps) {
  useEffect(() => {
    if (!guest) return;

    // Auto-close after 2500ms
    const timer = setTimeout(() => {
      onClose();
    }, 2500);

    return () => clearTimeout(timer);
  }, [guest, onClose]);

  if (!guest) return null;

  // Check if guest is a special category (Padrinho/Madrinha)
  const isSpecialGuest = (): boolean => {
    const category = guest.category?.toLowerCase().trim() || '';
    return ['padrinho', 'padrinhos', 'madrinha', 'madrinhas'].includes(category);
  };

  // Helper: detect gender (naive heuristic based on common Portuguese names)
  // Returns: 'male', 'female', or 'unknown'
  const detectGender = (fullName: string): 'male' | 'female' | 'unknown' => {
    const nameLower = fullName.toLowerCase().trim();
    const firstName = nameLower.split(/\s+/)[0];

    // Common male endings in Portuguese
    const maleEndings = ['o', 'os', 'ar', 'or', 'ei'];
    // Common female endings in Portuguese
    const femaleEndings = ['a', 'as', 'ia', 'ie', 'ela'];

    if (femaleEndings.some((ending) => firstName.endsWith(ending))) return 'female';
    if (maleEndings.some((ending) => firstName.endsWith(ending))) return 'male';
    return 'unknown';
  };

  // Generate welcome message based on category
  const getWelcomeMessage = (): string => {
    const category = guest.category?.toLowerCase() || '';
    const gender = detectGender(guest.fullName);

    if (['padrinho', 'padrinhos'].includes(category)) {
      return `Bem-vindo, Padrinho ${guest.fullName}`;
    }
    if (['madrinha', 'madrinhas'].includes(category)) {
      return `Bem-vinda, Madrinha ${guest.fullName}`;
    }

    // Default greeting for all other categories
    return `Bem-vindo(a), ${guest.fullName}`;
  };

  const specialGuest = isSpecialGuest();

  return (
    <div className={`${styles.overlay} ${specialGuest ? styles.overlayGolden : ''}`} role="status" aria-live="polite">
      <div className={styles.content}>
        <div className={styles.icon}>{specialGuest ? '⭐' : '✅'}</div>
        <h1 className={`${styles.title} ${specialGuest ? styles.titleGolden : ''}`}>{getWelcomeMessage()}</h1>

        {guest.tableNumber && (
          <div className={`${styles.subtitle} ${specialGuest ? styles.subtitleGolden : ''}`}>
            Mesa {guest.tableNumber}
          </div>
        )}
      </div>
    </div>
  );
}
