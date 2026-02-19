'use client';

import { useEffect, useState, useCallback } from 'react';
import styles from './ReportsModal.module.css';

interface Event {
  id: number;
  name: string;
  date: string;
  status: string;
}

interface ConvidadoImpressao {
  id: string;
  nome: string;
  categoria: string;
  mesa: string;
  presente: boolean;
  crianca: boolean;
}

interface EventReport {
  evento: {
    id: number;
    nome: string;
    data: string;
    status: string;
  };
  resumo: {
    total: number;
    presentes: number;
    ausentes: number;
    taxaComparecimento: number;
    criancas: number;
    pagantes: number;
  };
  distribuicao: {
    categorias: Array<{ nome: string; total: number; checkedIn: number; taxa: number }>;
    mesas: Array<{ nome: string; total: number; checkedIn: number; taxa: number }>;
  };
  checkInsPorHora: Array<{ hora: string; quantidade: number }>;
  listaConvidados: ConvidadoImpressao[];
}

interface ComparativoEvento {
  id: number;
  nome: string;
  data: string;
  status: string;
  total: number;
  presentes: number;
  ausentes: number;
  taxa: number;
}

interface HistoricoMensal {
  mesAno: string;
  label: string;
  eventos: number;
  convidados: number;
  presentes: number;
  taxa: number;
}

interface NoShowEvento {
  eventoId: number;
  eventoNome: string;
  eventoData: string;
  totalConvidados: number;
  totalAusentes: number;
  ausentes: Array<{ id: string; nome: string; categoria: string }>;
}

interface AtividadeUsuario {
  userId: string;
  nome: string;
  email: string;
  checkins: number;
  unchecks: number;
  edicoes: number;
  criacoes: number;
  exclusoes: number;
  total: number;
}

interface LogCritico {
  id: string;
  acao: string;
  tipo: string;
  usuario: string;
  justificativa: string | null;
  data: string;
}

interface Auditoria {
  logsCriticos: LogCritico[];
  resumoAcoes: Array<{ acao: string; quantidade: number }>;
  totalAcoes: number;
}

interface ConsolidatedReport {
  comparativo: ComparativoEvento[];
  historicoMensal: HistoricoMensal[];
  noShows: NoShowEvento[];
  atividadeUsuarios: AtividadeUsuario[];
  auditoria: Auditoria;
}

interface ReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: Event[];
}

type MainSection = 'evento' | 'consolidado';
type EventTabType = 'resumo' | 'distribuicao' | 'horarios' | 'impressao';
type ConsolidatedTabType = 'comparativo' | 'historico' | 'noshows' | 'atividade' | 'auditoria';

export default function ReportsModal({ isOpen, onClose, events }: ReportsModalProps) {
  const [mainSection, setMainSection] = useState<MainSection>('evento');
  const [selectedEventId, setSelectedEventId] = useState<number | ''>('');
  const [report, setReport] = useState<EventReport | null>(null);
  const [consolidatedReport, setConsolidatedReport] = useState<ConsolidatedReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeEventTab, setActiveEventTab] = useState<EventTabType>('resumo');
  const [activeConsolidatedTab, setActiveConsolidatedTab] = useState<ConsolidatedTabType>('comparativo');

  const loadReport = useCallback(async (eventId: number) => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`/api/reports/event/${eventId}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Erro ao carregar relatório');
      const data = await res.json();
      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadConsolidatedReport = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/reports/consolidated', { credentials: 'include' });
      if (!res.ok) throw new Error('Erro ao carregar relatório consolidado');
      const data = await res.json();
      setConsolidatedReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setConsolidatedReport(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedEventId && mainSection === 'evento') {
      void loadReport(selectedEventId);
    }
  }, [selectedEventId, mainSection, loadReport]);

  useEffect(() => {
    if (mainSection === 'consolidado' && isOpen && !consolidatedReport) {
      void loadConsolidatedReport();
    }
  }, [mainSection, isOpen, consolidatedReport, loadConsolidatedReport]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>📈 Relatórios</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <div className={styles.content}>
          <div className={styles.mainNav}>
            <button className={`${styles.mainNavBtn} ${mainSection === 'evento' ? styles.active : ''}`} onClick={() => setMainSection('evento')}>📅 Por Evento</button>
            <button className={`${styles.mainNavBtn} ${mainSection === 'consolidado' ? styles.active : ''}`} onClick={() => setMainSection('consolidado')}>📊 Consolidados</button>
          </div>

          {loading && <div className={styles.loading}><p>Carregando...</p></div>}
          {error && <div className={styles.error}><p>{error}</p></div>}

          {mainSection === 'evento' && !loading && (
            <>
              <div className={styles.eventSelector}>
                <label>Selecione um evento</label>
                <select value={selectedEventId} onChange={(e) => setSelectedEventId(e.target.value ? Number(e.target.value) : '')}>
                  <option value="">-- Escolha um evento --</option>
                  {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
                </select>
              </div>

              {report && (
                <div className={styles.reportContent}>
                  <div className={styles.statsGrid}>
                    <div className={styles.statCard}><h3>{report.resumo.total}</h3><p>Convidados</p></div>
                    <div className={styles.statCard}><h3>{report.resumo.presentes}</h3><p>Presentes</p></div>
                    <div className={styles.statCard}><h3>{report.resumo.taxaComparecimento}%</h3><p>Taxa</p></div>
                  </div>
                </div>
              )}
            </>
          )}

          {mainSection === 'consolidado' && !loading && consolidatedReport && (
            <div className={styles.consolidatedContent}>
              <table className={styles.distTable}>
                <thead><tr><th>Evento</th><th>Total</th><th>Presentes</th><th>Taxa</th></tr></thead>
                <tbody>
                  {consolidatedReport.comparativo.map(ev => (
                    <tr key={ev.id}><td>{ev.nome}</td><td>{ev.total}</td><td>{ev.presentes}</td><td>{ev.taxa}%</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
