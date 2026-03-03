'use client';

import { useState } from 'react';
import { X, Copy, QrCode, CheckCircle2, Loader2, Link as LinkIcon } from 'lucide-react';
import styles from './QuickAccessModal.module.css';

interface QuickAccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    eventId: string;
}

export default function QuickAccessModal({ isOpen, onClose, eventId }: QuickAccessModalProps) {
    const [loading, setLoading] = useState(false);
    const [accessUrl, setAccessUrl] = useState('');
    const [copied, setCopied] = useState(false);

    const generateLink = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/quick-access/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ eventId })
            });
            const data = await res.json();
            if (data.success) {
                setAccessUrl(data.url);
            }
        } catch (err) {
            alert('Erro ao gerar link');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(accessUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!isOpen) return null;

    const qrCodeUrl = `https://quickchart.io/qr?text=${encodeURIComponent(accessUrl)}&size=300&margin=1&ecLevel=M`;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <button className={styles.closeBtn} onClick={onClose}>
                    <X size={24} />
                </button>

                <div className={styles.header}>
                    <div className={styles.iconContainer}>
                        <QrCode size={32} className={styles.headerIcon} />
                    </div>
                    <h2 className={styles.title}>Acesso Rápido para Ajudantes</h2>
                    <p className={styles.subtitle}>
                        Gere um link temporário (3 horas) para que outra pessoa ajude no check-in sem precisar de login oficial.
                    </p>
                </div>

                {!accessUrl ? (
                    <div className={styles.actionContainer}>
                        <button
                            className={styles.generateBtn}
                            onClick={generateLink}
                            disabled={loading}
                        >
                            {loading ? <Loader2 className={styles.spinner} /> : 'Gerar Link e QR Code'}
                        </button>
                    </div>
                ) : (
                    <div className={styles.resultContainer}>
                        <div className={styles.qrWrapper}>
                            <img src={qrCodeUrl} alt="QR Code de Acesso" className={styles.qrImage} />
                            <p className={styles.qrHint}>Peça para o ajudante escanear este código</p>
                        </div>

                        <div className={styles.urlContainer}>
                            <div className={styles.urlInput}>
                                <LinkIcon size={16} className={styles.linkIcon} />
                                <input type="text" readOnly value={accessUrl} />
                                <button className={styles.copyBtn} onClick={copyToClipboard}>
                                    {copied ? <CheckCircle2 size={20} className={styles.copiedIcon} /> : <Copy size={20} />}
                                </button>
                            </div>
                            {copied && <span className={styles.copiedMsg}>Link copiado!</span>}
                        </div>

                        <div className={styles.expirationNotice}>
                            <div className={styles.warningDot} />
                            Este acesso expirará automaticamente em 3 horas.
                        </div>

                        {accessUrl.includes('localhost') && (
                            <div className={styles.localhostWarning}>
                                <strong>Dica:</strong> Para o QR Code funcionar no celular do ajudante, você deve acessar o sistema usando o IP da sua máquina em vez de 'localhost'.
                            </div>
                        )}
                    </div>

                )}
            </div>
        </div>
    );
}
