import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import {
  useGetLeaguesQuery,
  useGetQuinielasQuery,
  useGetSeasonsQuery,
  useGetWeeksBySeasonQuery,
  useGetMatchesByWeekQuery,
  useSyncFullSeasonMutation,
  useSyncWeekFromEspnMutation,
  useImportManualJsonMutation,
  useEnsureAperturaMutation,
} from '../../services/api';
import { MatchCard } from '../../components/matches/MatchCard';
import { ApiHealthBadge } from '../../components/admin/ApiHealthBadge';
import { AlertCircle, RotateCw, DownloadCloud, FileJson } from 'lucide-react';
import './FixturesPage.css';

type ToastType = 'success' | 'warning' | 'error';

export const FixturesPage: React.FC = () => {
  const [selectedLeagueId, setSelectedLeagueId] = useState<number | null>(null);
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | null>(null);
  const [selectedWeekId, setSelectedWeekId]     = useState<number | null>(null);
  const [showImportModal, setShowImportModal]   = useState(false);
  const [importJsonText, setImportJsonText]     = useState('');
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  // ─── Active Quiniela & Leagues ──────────────────────────────────────────────
  const { user } = useSelector((state: RootState) => state.auth);
  const activeQuinielaId = useSelector((state: RootState) => state.quiniela.activeQuinielaId);
  const { data: quinielasResponse } = useGetQuinielasQuery();
  const quinielas = quinielasResponse?.data || [];
  const activeQuiniela = quinielas.find((q) => q.id === activeQuinielaId);

  const isOwnerOrAdmin =
    user?.role?.toUpperCase() === 'ADMIN' ||
    user?.role?.toUpperCase() === 'OWNER' ||
    activeQuiniela?.userRole === 'OWNER' ||
    activeQuiniela?.userRole === 'ADMIN' ||
    quinielas.some((q) => q.userRole === 'OWNER' || q.userRole === 'ADMIN');

  const { data: leaguesResponse } = useGetLeaguesQuery();
  const leagues = leaguesResponse?.data ?? [];

  // Sincronizar liga seleccionada con la quiniela activa o primera liga
  useEffect(() => {
    if (activeQuiniela?.leagueId) {
      setSelectedLeagueId(activeQuiniela.leagueId);
    } else if (leagues.length > 0 && selectedLeagueId === null) {
      setSelectedLeagueId(leagues[0].id);
    }
  }, [activeQuiniela?.leagueId, leagues]);

  // ─── Queries ────────────────────────────────────────────────────────────────
  const { data: seasonsData } = useGetSeasonsQuery(selectedLeagueId ?? undefined);
  const allSeasons = seasonsData?.data ?? [];
  // Filtro estricto por liga seleccionada
  const seasons = selectedLeagueId ? allSeasons.filter((s) => s.leagueId === selectedLeagueId) : allSeasons;

  const { data: weeksData } = useGetWeeksBySeasonQuery(selectedSeasonId!, {
    skip: !selectedSeasonId,
  });
  const weeks = weeksData?.data ?? [];

  const { data: matchesData, isLoading: loadingMatches } = useGetMatchesByWeekQuery(selectedWeekId!, {
    skip: !selectedWeekId,
  });
  const matches = matchesData?.data ?? [];

  // ─── Mutations ──────────────────────────────────────────────────────────────
  const [syncFullSeason, { isLoading: syncingFull }]   = useSyncFullSeasonMutation();
  const [syncWeek,       { isLoading: syncingWeek }]   = useSyncWeekFromEspnMutation();
  const [triggerImport,  { isLoading: importing }]     = useImportManualJsonMutation();
  const [ensureApertura, { isLoading: ensuringApertura }] = useEnsureAperturaMutation();

  // ─── Auto-select defaults (Prioriza el torneo activo no terminado de ESTA liga)
  useEffect(() => {
    if (seasons.length > 0) {
      const isValid = seasons.some((s) => s.id === selectedSeasonId);
      if (!isValid) {
        const current =
          seasons.find((s) => s.isCurrent && !s.isFinished) ??
          seasons.find((s) => s.isCurrent) ??
          seasons.find((s) => !s.isFinished) ??
          seasons[0];
        setSelectedSeasonId(current.id);
        setSelectedWeekId(null);
      }
    } else {
      setSelectedSeasonId(null);
      setSelectedWeekId(null);
    }
  }, [seasons, selectedSeasonId]);

  useEffect(() => {
    if (weeks.length > 0) {
      const isValid = weeks.some((w) => w.id === selectedWeekId);
      if (!isValid) {
        const active = weeks.find((w) => w.status === 'PUBLISHED' || w.status === 'LOCKED') ?? weeks[0];
        setSelectedWeekId(active.id);
      }
    } else {
      setSelectedWeekId(null);
    }
  }, [weeks, selectedWeekId]);

  // ─── Toast helper ───────────────────────────────────────────────────────────
  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  // ─── Handlers ───────────────────────────────────────────────────────────────
  const handleLeagueChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLeagueId = Number(e.target.value);
    setSelectedLeagueId(newLeagueId);
    setSelectedSeasonId(null);
    setSelectedWeekId(null);
  };

  const handleSyncFull = async () => {
    if (!selectedSeasonId) return;
    try {
      const result = await syncFullSeason(selectedSeasonId).unwrap();
      const level = result.data?.fallbackLevel;
      const type: ToastType = level === 'L3_CONFIG' ? 'warning' : 'success';
      showToast(result.message, type);
    } catch {
      showToast('Error al sincronizar la temporada.', 'error');
    }
  };

  const handleSyncWeek = async () => {
    if (!selectedWeekId) return;
    try {
      const result = await syncWeek(selectedWeekId).unwrap();
      showToast(result.message, 'success');
    } catch {
      showToast('Error al sincronizar la jornada.', 'error');
    }
  };

  const handleImport = async () => {
    if (!selectedWeekId || !importJsonText.trim()) return;
    try {
      const result = await triggerImport({ weekId: selectedWeekId, rawJson: importJsonText }).unwrap();
      showToast(result.message, 'success');
      setShowImportModal(false);
      setImportJsonText('');
    } catch {
      showToast('Error al importar el JSON.', 'error');
    }
  };

  const handleEnsureApertura = async () => {
    try {
      const res = await ensureApertura().unwrap();
      if (res.data?.id) {
        setSelectedLeagueId(res.data.leagueId);
        setSelectedSeasonId(res.data.id);
        setSelectedWeekId(null);
      }
      showToast('Torneo Apertura 2026 configurado y activo.', 'success');
    } catch {
      showToast('Error al activar el Torneo Apertura.', 'error');
    }
  };

  const handleSeasonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSeasonId(Number(e.target.value));
    setSelectedWeekId(null); // reset semana al cambiar temporada
  };

  // ─── Derived ────────────────────────────────────────────────────────────────
  const selectedLeague = leagues.find((l) => l.id === selectedLeagueId);
  const selectedSeason = seasons.find((s) => s.id === selectedSeasonId);
  const selectedWeek   = weeks.find((w) => w.id === selectedWeekId);
  const hasPostponed   = matches.some((m) => m.statusState === 'postponed');
  const postponedCount = matches.filter((m) => m.statusState === 'postponed').length;
  const isLigaMx       = selectedLeague?.code === 'mex.1' || selectedLeague?.name.toLowerCase().includes('liga mx');
  const hasApertura    = isLigaMx && seasons.some((s) => s.name.toLowerCase().includes('apertura'));

  return (
    <div className="fixtures-page">
      {/* Header */}
      <div className="fixtures-page__header">
        <div className="fixtures-page__header-left">
          <h1 className="fixtures-page__title">Calendario de Partidos</h1>
          <p className="fixtures-page__subtitle">
            {selectedLeague ? `${selectedLeague.name} · ` : ''}
            {selectedWeek
              ? `${selectedWeek.name} · ${selectedWeek.matchesCount} partidos`
              : 'Selecciona una jornada'}
          </p>
        </div>
        {isOwnerOrAdmin && (
          <ApiHealthBadge onContingencyClick={() => setShowImportModal(true)} />
        )}
      </div>

      {/* Controles */}
      <div className="fixtures-page__selectors">
        {/* Selector de Liga / Deporte */}
        <div className="fixtures-page__selector-group">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
            <label className="fixtures-page__label">Liga / Deporte</label>
            {activeQuiniela && selectedLeagueId === activeQuiniela.leagueId && (
              <span
                className="badge badge--accent"
                style={{ fontSize: '0.625rem', padding: '1px 5px', fontWeight: 600 }}
                title={`Quiniela activa: ${activeQuiniela.name}`}
              >
                Quiniela: {activeQuiniela.name}
              </span>
            )}
          </div>
          <select
            className="fixtures-page__select"
            value={selectedLeagueId ?? ''}
            onChange={handleLeagueChange}
          >
            {leagues.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name} {l.country ? `(${l.country})` : ''} - {l.sportName}
              </option>
            ))}
          </select>
        </div>

        {/* Selector de Temporada */}
        <div className="fixtures-page__selector-group">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
            <label className="fixtures-page__label">Temporada</label>
            {isOwnerOrAdmin && isLigaMx && !hasApertura && (
              <button
                type="button"
                className="btn btn--outline btn--sm"
                style={{ fontSize: '0.6875rem', padding: '1px 6px' }}
                onClick={handleEnsureApertura}
                disabled={ensuringApertura}
              >
                {ensuringApertura ? 'Activando...' : '+ Apertura 2026'}
              </button>
            )}
          </div>
          <select className="fixtures-page__select" value={selectedSeasonId ?? ''} onChange={handleSeasonChange}>
            {seasons.length === 0 ? (
              <option value="">No hay temporadas para esta liga</option>
            ) : (
              seasons.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.isFinished ? '— (Concluido)' : s.isCurrent ? '(En Curso)' : ''}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Selector de Jornada */}
        <div className="fixtures-page__selector-group">
          <label className="fixtures-page__label">Jornada</label>
          <select
            className="fixtures-page__select"
            value={selectedWeekId ?? ''}
            onChange={(e) => setSelectedWeekId(Number(e.target.value))}
          >
            {weeks.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}{w.postponedCount > 0 ? ` (${w.postponedCount} pospuestos)` : ''}
              </option>
            ))}
          </select>
        </div>

        {isOwnerOrAdmin && (
          <div className="fixtures-page__actions">
            <button
              type="button"
              className="btn btn--outline btn--sm"
              onClick={handleSyncWeek}
              disabled={!selectedWeekId || syncingWeek}
            >
              <RotateCw size={14} className={syncingWeek ? 'fixtures-spin' : ''} style={{ marginRight: '6px' }} />
              {syncingWeek ? 'Sincronizando...' : 'Sync Jornada'}
            </button>

            <button
              type="button"
              className="btn btn--primary btn--sm"
              onClick={handleSyncFull}
              disabled={!selectedSeasonId || syncingFull}
            >
              <DownloadCloud size={14} style={{ marginRight: '6px' }} />
              {syncingFull ? 'Cargando temporada...' : 'Cargar Temporada Completa'}
            </button>

            <button
              type="button"
              className="btn btn--outline btn--sm"
              onClick={() => setShowImportModal(true)}
              title="Pegar JSON copiado del navegador"
            >
              <FileJson size={14} style={{ marginRight: '6px' }} />
              Importar JSON
            </button>
          </div>
        )}
      </div>

      {/* Colchón de seguridad / Aviso de torneo concluido */}
      {selectedSeason?.isFinished && (
        <div
          className="alert alert--warning"
          style={{
            margin: '0 0 var(--space-md) 0',
            padding: '10px 14px',
            fontSize: '0.8125rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} color="var(--color-warning)" style={{ flexShrink: 0 }} />
            <span>
              <strong>{selectedSeason.name}</strong> es un torneo que ya concluyó. Los resultados mostrados son históricos.
            </span>
          </div>
          {seasons.find((s) => s.isCurrent && !s.isFinished) && (
            <button
              type="button"
              className="btn btn--primary btn--sm"
              style={{ fontSize: '0.75rem', padding: '3px 10px', whiteSpace: 'nowrap' }}
              onClick={() => {
                const current = seasons.find((s) => s.isCurrent && !s.isFinished);
                if (current) {
                  setSelectedSeasonId(current.id);
                  setSelectedWeekId(null);
                }
              }}
            >
              Cambiar al Torneo Actual ({seasons.find((s) => s.isCurrent && !s.isFinished)?.name})
            </button>
          )}
        </div>
      )}

      {/* Aviso de partidos pospuestos */}
      {hasPostponed && (
        <div className="fixtures-page__postponed-alert">
          <AlertCircle size={18} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>
            Esta jornada tiene <strong>{postponedCount} partido{postponedCount > 1 ? 's' : ''} pospuesto{postponedCount > 1 ? 's' : ''}</strong>.
            {' '}Estos partidos <strong>no cuentan como empate</strong> y serán evaluados cuando se jueguen.
          </span>
        </div>
      )}

      {/* Grid de partidos */}
      {loadingMatches ? (
        <div className="fixtures-page__loading">Cargando partidos...</div>
      ) : matches.length === 0 ? (
        <div className="fixtures-page__empty">
          <p>No hay partidos en esta jornada.</p>
          {isOwnerOrAdmin ? (
            <p>
              Usa <strong>Sync Jornada</strong> o <strong>Cargar Temporada Completa</strong> para
              obtener los partidos desde ESPN.
            </p>
          ) : (
            <p>Los partidos de esta jornada aún no han sido sincronizados.</p>
          )}
        </div>
      ) : (
        <div className="fixtures-page__grid">
          {matches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixtures-page__toast fixtures-page__toast--${toast.type}`}>
          {toast.message}
        </div>
      )}

      {/* Modal importación manual */}
      {showImportModal && (
        <div className="fixtures-page__modal-overlay" onClick={() => setShowImportModal(false)}>
          <div className="fixtures-page__modal" onClick={(e) => e.stopPropagation()}>
            <div className="fixtures-page__modal-header">
              <h2>Importar JSON Manual</h2>
              <button type="button" onClick={() => setShowImportModal(false)} className="fixtures-page__modal-close">
                ✕
              </button>
            </div>
            <p className="fixtures-page__modal-desc">
              Pega aquí el JSON del scoreboard de ESPN (copia desde el navegador en modo contingencia).
            </p>
            <textarea
              className="fixtures-page__json-input"
              placeholder='{ "events": [...] }'
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              rows={12}
            />
            <div className="fixtures-page__modal-actions">
              <button type="button" className="btn btn--outline" onClick={() => setShowImportModal(false)}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn--primary"
                onClick={handleImport}
                disabled={!importJsonText.trim() || importing}
              >
                {importing ? 'Importando...' : 'Importar Partidos'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
