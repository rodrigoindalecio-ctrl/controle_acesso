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
  importacoes: number;
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
type PrintFilter = 'todos' | 'presentes' | 'ausentes';

export default function ReportsModal({ isOpen, onClose, events }: ReportsModalProps) {
  const [mainSection, setMainSection] = useState<MainSection>('evento');
  const [selectedEventId, setSelectedEventId] = useState<number | ''>('');
  const [report, setReport] = useState<EventReport | null>(null);
  const [consolidatedReport, setConsolidatedReport] = useState<ConsolidatedReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeEventTab, setActiveEventTab] = useState<EventTabType>('resumo');
  const [activeConsolidatedTab, setActiveConsolidatedTab] = useState<ConsolidatedTabType>('comparativo');
  const [expandedNoShow, setExpandedNoShow] = useState<number | null>(null);
  const [printFilter, setPrintFilter] = useState<PrintFilter>('todos');

  const loadReport = useCallback(async (eventId: number) => {
    if (!eventId) {
      setReport(null);
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await fetch(`/api/reports/event/${eventId}`, { credentials: 'include' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Erro ao carregar relatório');
      }
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
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Erro ao carregar relatório consolidado');
      }
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

  useEffect(() => {
    if (!isOpen) {
      setSelectedEventId('');
      setReport(null);
      setConsolidatedReport(null);
      setActiveEventTab('resumo');
      setActiveConsolidatedTab('comparativo');
      setMainSection('evento');
      setExpandedNoShow(null);
    }
  }, [isOpen]);

  // Fechar com ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getTaxaClass = (taxa: number): string => {
    if (taxa >= 70) return styles.high;
    if (taxa >= 40) return styles.medium;
    return styles.low;
  };

  const getMaxCheckIn = (): number => {
    if (!report?.checkInsPorHora.length) return 1;
    return Math.max(...report.checkInsPorHora.map(h => h.quantidade));
  };

  const getMaxHistorico = (): number => {
    if (!consolidatedReport?.historicoMensal.length) return 1;
    return Math.max(...consolidatedReport.historicoMensal.map(h => h.convidados));
  };

  const formatAcao = (acao: string): string => {
    const map: Record<string, string> = {
      'CHECKIN': 'Check-in',
      'UNCHECK': 'Desfazer Check-in',
      'EDIT_GUEST': 'Editar Convidado',
      'EDIT_EVENT': 'Editar Evento',
      'EDIT_USER': 'Editar Usuário',
      'CREATE_GUEST': 'Criar Convidado',
      'CREATE_EVENT': 'Criar Evento',
      'CREATE_USER': 'Criar Usuário',
      'DELETE_GUEST': 'Excluir Convidado',
      'DELETE_EVENT': 'Excluir Evento',
      'DELETE_USER': 'Excluir Usuário',
      'IMPORT_GUESTS': 'Importar Convidados'
    };
    return map[acao] || acao;
  };

  const getAcaoClass = (acao: string): string => {
    if (acao.startsWith('DELETE')) return styles.acaoDanger;
    if (acao === 'UNCHECK') return styles.acaoWarning;
    if (acao.startsWith('EDIT')) return styles.acaoInfo;
    return '';
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>📈 Relatórios</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <div className={styles.content}>
          {/* Navegação principal */}
          <div className={styles.mainNav}>
            <button
              type="button"
              className={`${styles.mainNavBtn} ${mainSection === 'evento' ? styles.active : ''}`}
              onClick={() => setMainSection('evento')}
            >
              📅 Por Evento
            </button>
            <button
              type="button"
              className={`${styles.mainNavBtn} ${mainSection === 'consolidado' ? styles.active : ''}`}
              onClick={() => setMainSection('consolidado')}
            >
              📊 Consolidados
            </button>
          </div>

          {/* Loading */}
          {loading && (
            <div className={styles.loading}>
              <div className={styles.spinner} />
              <p>Carregando relatório...</p>
            </div>
          )}

          {/* Erro */}
          {error && !loading && (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>⚠️</span>
              <p className={styles.emptyText}>{error}</p>
            </div>
          )}

          {/* ========== SEÇÃO: POR EVENTO ========== */}
          {mainSection === 'evento' && !loading && !error && (
            <>
              {/* Seletor de evento */}
              <div className={styles.eventSelector}>
                <label>Selecione um evento</label>
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value ? Number(e.target.value) : '')}
                >
                  <option value="">-- Escolha um evento --</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.name} - {new Date(ev.date).toLocaleDateString('pt-BR')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Estado vazio */}
              {!selectedEventId && (
                <div className={styles.emptyState}>
                  <span className={styles.emptyIcon}>📊</span>
                  <p className={styles.emptyText}>Selecione um evento para visualizar os relatórios</p>
                </div>
              )}

              {/* Relatório do evento */}
              {report && (
                <>
                  <div className={styles.tabs}>
                    <button
                      type="button"
                      className={`${styles.tab} ${activeEventTab === 'resumo' ? styles.active : ''}`}
                      onClick={() => setActiveEventTab('resumo')}
                    >
                      📋 Resumo
                    </button>
                    <button
                      type="button"
                      className={`${styles.tab} ${activeEventTab === 'distribuicao' ? styles.active : ''}`}
                      onClick={() => setActiveEventTab('distribuicao')}
                    >
                      📊 Distribuição
                    </button>
                    <button
                      type="button"
                      className={`${styles.tab} ${activeEventTab === 'horarios' ? styles.active : ''}`}
                      onClick={() => setActiveEventTab('horarios')}
                    >
                      🕐 Horários
                    </button>
                    <button
                      type="button"
                      className={`${styles.tab} ${activeEventTab === 'impressao' ? styles.active : ''}`}
                      onClick={() => setActiveEventTab('impressao')}
                    >
                      🖨️ Imprimir
                    </button>
                  </div>

                  {activeEventTab === 'resumo' && (
                    <>
                      <div className={styles.statsGrid}>
                        <div className={styles.statCard}>
                          <div className={styles.statValue}>{report.resumo.total}</div>
                          <div className={styles.statLabel}>Total Convidados</div>
                        </div>
                        <div className={styles.statCard}>
                          <div className={styles.statValue}>{report.resumo.presentes}</div>
                          <div className={styles.statLabel}>Presentes</div>
                        </div>
                        <div className={styles.statCard}>
                          <div className={styles.statValue}>{report.resumo.ausentes}</div>
                          <div className={styles.statLabel}>Ausentes</div>
                        </div>
                        <div className={`${styles.statCard} ${styles.highlight}`}>
                          <div className={styles.statValue}>{report.resumo.taxaComparecimento}%</div>
                          <div className={styles.statLabel}>Taxa Comparecimento</div>
                        </div>
                      </div>
                      <div className={styles.statsGrid}>
                        <div className={styles.statCard}>
                          <div className={styles.statValue}>{report.resumo.criancas}</div>
                          <div className={styles.statLabel}>Crianças</div>
                        </div>
                        <div className={styles.statCard}>
                          <div className={styles.statValue}>{report.resumo.pagantes}</div>
                          <div className={styles.statLabel}>Pagantes (presentes)</div>
                        </div>
                      </div>
                    </>
                  )}

                  {activeEventTab === 'distribuicao' && (
                    <>
                      <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>Por Categoria</h3>
                        {report.distribuicao.categorias.length > 0 ? (
                          <table className={styles.distTable}>
                            <thead>
                              <tr>
                                <th>Categoria</th>
                                <th>Total</th>
                                <th>Presentes</th>
                                <th>Taxa</th>
                              </tr>
                            </thead>
                            <tbody>
                              {report.distribuicao.categorias.map((cat) => (
                                <tr key={cat.nome}>
                                  <td>{cat.nome}</td>
                                  <td>{cat.total}</td>
                                  <td>{cat.checkedIn}</td>
                                  <td>
                                    <span className={`${styles.taxaBadge} ${getTaxaClass(cat.taxa)}`}>
                                      {cat.taxa}%
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <p>Nenhuma categoria encontrada</p>
                        )}
                      </div>
                      <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>Por Mesa</h3>
                        {report.distribuicao.mesas.length > 0 ? (
                          <table className={styles.distTable}>
                            <thead>
                              <tr>
                                <th>Mesa</th>
                                <th>Total</th>
                                <th>Presentes</th>
                                <th>Taxa</th>
                              </tr>
                            </thead>
                            <tbody>
                              {report.distribuicao.mesas.map((mesa) => (
                                <tr key={mesa.nome}>
                                  <td>{mesa.nome}</td>
                                  <td>{mesa.total}</td>
                                  <td>{mesa.checkedIn}</td>
                                  <td>
                                    <span className={`${styles.taxaBadge} ${getTaxaClass(mesa.taxa)}`}>
                                      {mesa.taxa}%
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <p>Nenhuma mesa encontrada</p>
                        )}
                      </div>
                    </>
                  )}

                  {activeEventTab === 'horarios' && (
                    <div className={styles.section}>
                      <h3 className={styles.sectionTitle}>Fluxo de Check-in por Hora</h3>
                      {report.checkInsPorHora?.length > 0 ? (
                        <div className={styles.barChart}>
                          {report.checkInsPorHora.map((h) => {
                            const maxVal = getMaxCheckIn();
                            const widthPercent = (h.quantidade / maxVal) * 100;
                            return (
                              <div key={h.hora} className={styles.barRow}>
                                <span className={styles.barLabel}>{h.hora}</span>
                                <div className={styles.barContainer}>
                                  <div
                                    className={styles.bar}
                                    style={{ width: `${Math.max(widthPercent, 10)}%` }}
                                  >
                                    <span className={styles.barValue}>{h.quantidade}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className={styles.emptyState}>
                          <span className={styles.emptyIcon}>🕐</span>
                          <p className={styles.emptyText}>Nenhum check-in registrado ainda</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab: Lista para Impressão */}
                  {activeEventTab === 'impressao' && (
                    <div className={styles.section}>
                      <div className={styles.printHeader}>
                        <h3 className={styles.sectionTitle}>Lista de Convidados</h3>
                        <div className={styles.printActions}>
                          <select
                            className={styles.printFilter}
                            value={printFilter}
                            onChange={(e) => setPrintFilter(e.target.value as PrintFilter)}
                          >
                            <option value="todos">Todos ({report.listaConvidados?.length || 0})</option>
                            <option value="presentes">Presentes ({report.listaConvidados?.filter(c => c.presente).length || 0})</option>
                            <option value="ausentes">Ausentes ({report.listaConvidados?.filter(c => !c.presente).length || 0})</option>
                          </select>
                          <button
                            type="button"
                            className={styles.printBtn}
                            onClick={() => {
                              const printWindow = window.open('', '_blank');
                              if (!printWindow) return;

                              const filteredList = (report.listaConvidados || []).filter(c => {
                                if (printFilter === 'presentes') return c.presente;
                                if (printFilter === 'ausentes') return !c.presente;
                                return true;
                              });

                              const filterLabel = printFilter === 'todos' ? 'Todos' :
                                printFilter === 'presentes' ? 'Presentes' : 'Ausentes';

                              printWindow.document.write(`
                                <!DOCTYPE html>
                                <html>
                                <head>
                                  <title>Lista de Convidados - ${report.evento.nome}</title>
                                  <style>
                                    body { font-family: Arial, sans-serif; padding: 20px; margin: 0; }
                                    h1 { font-size: 18px; margin-bottom: 5px; }
                                    .info { color: #666; font-size: 12px; margin-bottom: 20px; }
                                    table { width: 100%; border-collapse: collapse; font-size: 11px; }
                                    th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
                                    th { background: #f5f5f5; font-weight: 600; }
                                    tr:nth-child(even) { background: #fafafa; }
                                    .status { font-weight: 600; }
                                    .presente { color: #28a745; }
                                    .ausente { color: #dc3545; }
                                    .child { font-size: 10px; color: #666; }
                                    .footer { margin-top: 20px; font-size: 10px; color: #888; text-align: center; }
                                    @media print {
                                      body { padding: 10px; }
                                      .no-print { display: none; }
                                    }
                                  </style>
                                </head>
                                <body>
                                  <h1>📋 ${report.evento.nome}</h1>
                                  <div class="info">
                                    📅 ${new Date(report.evento.data).toLocaleDateString('pt-BR')} | 
                                    Filtro: ${filterLabel} | 
                                    Total: ${filteredList.length} convidados
                                  </div>
                                  <table>
                                    <thead>
                                      <tr>
                                        <th>#</th>
                                        <th>Nome</th>
                                        <th>Categoria</th>
                                        <th>Mesa</th>
                                        <th>Status</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      ${filteredList.map((c, i) => `
                                        <tr>
                                          <td>${i + 1}</td>
                                          <td>${c.nome}${c.crianca ? ' <span class="child">(criança)</span>' : ''}</td>
                                          <td>${c.categoria}</td>
                                          <td>${c.mesa}</td>
                                          <td class="status ${c.presente ? 'presente' : 'ausente'}">${c.presente ? '✓ Presente' : '○ Ausente'}</td>
                                        </tr>
                                      `).join('')}
                                    </tbody>
                                  </table>
                                  <div class="footer">
                                    Gerado em ${new Date().toLocaleString('pt-BR')}
                                  </div>
                                  <script>window.onload = function() { window.print(); }</script>
                                </body>
                                </html>
                              `);
                              printWindow.document.close();
                            }}
                          >
                            🖨️ Imprimir Lista
                          </button>
                        </div>
                      </div>

                      {/* Preview da lista */}
                      <div className={styles.printPreview}>
                        <table className={styles.distTable}>
                          <thead>
                            <tr>
                              <th>#</th>
                              <th>Nome</th>
                              <th>Categoria</th>
                              <th>Mesa</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {report.listaConvidados
                              .filter(c => {
                                if (printFilter === 'presentes') return c.presente;
                                if (printFilter === 'ausentes') return !c.presente;
                                return true;
                              })
                              .map((c, i) => (
                                <tr key={c.id}>
                                  <td>{i + 1}</td>
                                  <td>
                                    {c.nome}
                                    {c.crianca && <span className={styles.childBadge}> (criança)</span>}
                                  </td>
                                  <td>{c.categoria}</td>
                                  <td>{c.mesa}</td>
                                  <td>
                                    <span className={c.presente ? styles.statusPresente : styles.statusAusente}>
                                      {c.presente ? '✓ Presente' : '○ Ausente'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* ========== SEÇÃO: CONSOLIDADOS ========== */}
          {mainSection === 'consolidado' && !loading && !error && consolidatedReport && (
            <>
              <div className={styles.tabs}>
                <button
                  type="button"
                  className={`${styles.tab} ${activeConsolidatedTab === 'comparativo' ? styles.active : ''}`}
                  onClick={() => setActiveConsolidatedTab('comparativo')}
                >
                  🏆 Comparativo
                </button>
                <button
                  type="button"
                  className={`${styles.tab} ${activeConsolidatedTab === 'historico' ? styles.active : ''}`}
                  onClick={() => setActiveConsolidatedTab('historico')}
                >
                  📅 Histórico
                </button>
                <button
                  type="button"
                  className={`${styles.tab} ${activeConsolidatedTab === 'noshows' ? styles.active : ''}`}
                  onClick={() => setActiveConsolidatedTab('noshows')}
                >
                  👻 No-Shows
                </button>
                <button
                  type="button"
                  className={`${styles.tab} ${activeConsolidatedTab === 'atividade' ? styles.active : ''}`}
                  onClick={() => setActiveConsolidatedTab('atividade')}
                >
                  👥 Atividade
                </button>
                <button
                  type="button"
                  className={`${styles.tab} ${activeConsolidatedTab === 'auditoria' ? styles.active : ''}`}
                  onClick={() => setActiveConsolidatedTab('auditoria')}
                >
                  🔍 Auditoria
                </button>
              </div>

              {/* Tab: Comparativo de Eventos */}
              {activeConsolidatedTab === 'comparativo' && (
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>Ranking de Eventos por Comparecimento</h3>
                  {consolidatedReport.comparativo.length > 0 ? (
                    <table className={styles.distTable}>
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Evento</th>
                          <th>Data</th>
                          <th>Total</th>
                          <th>Presentes</th>
                          <th>Taxa</th>
                        </tr>
                      </thead>
                      <tbody>
                        {consolidatedReport.comparativo.map((ev, idx) => (
                          <tr key={ev.id}>
                            <td>
                              {idx === 0 && '🥇'}
                              {idx === 1 && '🥈'}
                              {idx === 2 && '🥉'}
                              {idx > 2 && idx + 1}
                            </td>
                            <td>{ev.nome}</td>
                            <td>{new Date(ev.data).toLocaleDateString('pt-BR')}</td>
                            <td>{ev.total}</td>
                            <td>{ev.presentes}</td>
                            <td>
                              <span className={`${styles.taxaBadge} ${getTaxaClass(ev.taxa)}`}>
                                {ev.taxa}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className={styles.emptyState}>
                      <span className={styles.emptyIcon}>📊</span>
                      <p className={styles.emptyText}>Nenhum evento encontrado</p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Histórico Mensal */}
              {activeConsolidatedTab === 'historico' && (
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>Eventos e Convidados por Mês</h3>
                  {consolidatedReport.historicoMensal.length > 0 ? (
                    <>
                      <div className={styles.barChart}>
                        {consolidatedReport.historicoMensal.map((h) => {
                          const maxVal = getMaxHistorico();
                          const widthPercent = maxVal > 0 ? (h.convidados / maxVal) * 100 : 0;
                          return (
                            <div key={h.mesAno} className={styles.barRow}>
                              <span className={styles.barLabel}>{h.label}</span>
                              <div className={styles.barContainer}>
                                <div
                                  className={styles.bar}
                                  style={{ width: `${Math.max(widthPercent, 10)}%` }}
                                >
                                  <span className={styles.barValue}>{h.convidados}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <table className={styles.distTable}>
                        <thead>
                          <tr>
                            <th>Mês</th>
                            <th>Eventos</th>
                            <th>Convidados</th>
                            <th>Presentes</th>
                            <th>Taxa</th>
                          </tr>
                        </thead>
                        <tbody>
                          {consolidatedReport.historicoMensal.map((h) => (
                            <tr key={h.mesAno}>
                              <td>{h.label}</td>
                              <td>{h.eventos}</td>
                              <td>{h.convidados}</td>
                              <td>{h.presentes}</td>
                              <td>
                                <span className={`${styles.taxaBadge} ${getTaxaClass(h.taxa)}`}>
                                  {h.taxa}%
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </>
                  ) : (
                    <div className={styles.emptyState}>
                      <span className={styles.emptyIcon}>📅</span>
                      <p className={styles.emptyText}>Nenhum histórico disponível</p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: No-Shows */}
              {activeConsolidatedTab === 'noshows' && (
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>Ausentes por Evento</h3>
                  {consolidatedReport.noShows.length > 0 ? (
                    <div className={styles.noShowsList}>
                      {consolidatedReport.noShows.map((ns) => (
                        <div key={ns.eventoId} className={styles.noShowCard}>
                          <div
                            className={styles.noShowHeader}
                            onClick={() => setExpandedNoShow(expandedNoShow === ns.eventoId ? null : ns.eventoId)}
                          >
                            <div className={styles.noShowInfo}>
                              <strong>{ns.eventoNome}</strong>
                              <span className={styles.noShowDate}>
                                {new Date(ns.eventoData).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                            <div className={styles.noShowStats}>
                              <span className={styles.noShowBadge}>
                                {ns.totalAusentes} ausentes de {ns.totalConvidados}
                              </span>
                              <span className={styles.noShowToggle}>
                                {expandedNoShow === ns.eventoId ? '▲' : '▼'}
                              </span>
                            </div>
                          </div>
                          {expandedNoShow === ns.eventoId && (
                            <div className={styles.noShowDetails}>
                              <table className={styles.distTable}>
                                <thead>
                                  <tr>
                                    <th>Nome</th>
                                    <th>Categoria</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {ns.ausentes.map((a) => (
                                    <tr key={a.id}>
                                      <td>{a.nome}</td>
                                      <td>{a.categoria}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.emptyState}>
                      <span className={styles.emptyIcon}>🎉</span>
                      <p className={styles.emptyText}>Nenhum ausente registrado!</p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Atividade de Usuários */}
              {activeConsolidatedTab === 'atividade' && (
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>Ranking de Atividade por Usuário</h3>
                  {consolidatedReport.atividadeUsuarios.length > 0 ? (
                    <table className={styles.distTable}>
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Usuário</th>
                          <th>Check-ins</th>
                          <th>Unchecks</th>
                          <th>Edições</th>
                          <th>Criações</th>
                          <th>Exclusões</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {consolidatedReport.atividadeUsuarios.map((usr, idx) => (
                          <tr key={usr.userId}>
                            <td>
                              {idx === 0 && '🥇'}
                              {idx === 1 && '🥈'}
                              {idx === 2 && '🥉'}
                              {idx > 2 && idx + 1}
                            </td>
                            <td>
                              <div className={styles.userCell}>
                                <strong>{usr.nome}</strong>
                                <span className={styles.userEmail}>{usr.email}</span>
                              </div>
                            </td>
                            <td>{usr.checkins}</td>
                            <td>{usr.unchecks}</td>
                            <td>{usr.edicoes}</td>
                            <td>{usr.criacoes}</td>
                            <td>{usr.exclusoes}</td>
                            <td><strong>{usr.total}</strong></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className={styles.emptyState}>
                      <span className={styles.emptyIcon}>👥</span>
                      <p className={styles.emptyText}>Nenhuma atividade registrada</p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Auditoria */}
              {activeConsolidatedTab === 'auditoria' && (
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>Resumo de Ações</h3>

                  {/* Cards de resumo */}
                  <div className={styles.statsGrid}>
                    <div className={`${styles.statCard} ${styles.highlight}`}>
                      <div className={styles.statValue}>{consolidatedReport.auditoria.totalAcoes}</div>
                      <div className={styles.statLabel}>Total de Ações</div>
                    </div>
                    {consolidatedReport.auditoria.resumoAcoes.slice(0, 3).map((r) => (
                      <div key={r.acao} className={styles.statCard}>
                        <div className={styles.statValue}>{r.quantidade}</div>
                        <div className={styles.statLabel}>{formatAcao(r.acao)}</div>
                      </div>
                    ))}
                  </div>

                  {/* Logs críticos */}
                  <h3 className={styles.sectionTitle} style={{ marginTop: '20px' }}>Ações Críticas Recentes</h3>
                  {consolidatedReport.auditoria.logsCriticos.length > 0 ? (
                    <table className={styles.distTable}>
                      <thead>
                        <tr>
                          <th>Ação</th>
                          <th>Tipo</th>
                          <th>Usuário</th>
                          <th>Justificativa</th>
                          <th>Data</th>
                        </tr>
                      </thead>
                      <tbody>
                        {consolidatedReport.auditoria.logsCriticos.map((log) => (
                          <tr key={log.id}>
                            <td>
                              <span className={`${styles.acaoBadge} ${getAcaoClass(log.acao)}`}>
                                {formatAcao(log.acao)}
                              </span>
                            </td>
                            <td>{log.tipo}</td>
                            <td>{log.usuario}</td>
                            <td>{log.justificativa || '-'}</td>
                            <td>{new Date(log.data).toLocaleString('pt-BR')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className={styles.emptyState}>
                      <span className={styles.emptyIcon}>✅</span>
                      <p className={styles.emptyText}>Nenhuma ação crítica registrada</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
