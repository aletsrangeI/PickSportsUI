import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import {
  useGetQuinielasQuery,
  useGetSeasonsQuery,
  useGetWeeksBySeasonQuery,
  useGetStandingsQuery,
  useScoreWeekMutation,
} from '../../services/api';
import { StandingsTable } from './StandingsTable';
import { Trophy, Award, Flame, Info, CheckCircle2, AlertCircle, RefreshCw, Share2 } from 'lucide-react';
import { ClaimLinksModal } from '../../components/admin/ClaimLinksModal';
import './StandingsPage.css';

export const StandingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'weekly' | 'general'>('weekly');
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | null>(null);
  const [selectedWeekId, setSelectedWeekId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);

  const activeQuinielaId = useSelector((state: RootState) => state.quiniela.activeQuinielaId);
  const currentUserId = useSelector((state: RootState) => state.auth.user?.id);

  const { data: quinielasResponse } = useGetQuinielasQuery();
  const quinielas = quinielasResponse?.data || [];
  const activeQuiniela = quinielas.find((q) => q.id === activeQuinielaId) || quinielas[0];
  const quinielaId = activeQuiniela?.id || 0;

  const isOwnerOrAdmin = activeQuiniela?.userRole === 'OWNER' || activeQuiniela?.userRole === 'ADMIN';

  // Temporadas y jornadas
  const { data: seasonsData } = useGetSeasonsQuery(activeQuiniela?.leagueId, {
    skip: !activeQuiniela?.leagueId,
  });
  const seasons = seasonsData?.data ?? [];

  useEffect(() => {
    if (seasons.length > 0 && selectedSeasonId === null) {
      const current =
        seasons.find((s) => s.isCurrent && !s.isFinished) ??
        seasons.find((s) => s.isCurrent) ??
        seasons[0];
      setSelectedSeasonId(current.id);
    }
  }, [seasons, selectedSeasonId]);

  const { data: weeksData } = useGetWeeksBySeasonQuery(selectedSeasonId!, {
    skip: !selectedSeasonId,
  });
  const weeks = weeksData?.data ?? [];

  useEffect(() => {
    if (weeks.length > 0 && (selectedWeekId === null || !weeks.some(w => w.id === selectedWeekId))) {
      const activeWeek =
        weeks.find((w) => w.status === 'PUBLISHED') ??
        weeks.find((w) => w.status === 'LOCKED') ??
        weeks.find((w) => w.status === 'SCORED') ??
        weeks[0];
      setSelectedWeekId(activeWeek.id);
    }
  }, [weeks, selectedWeekId]);

  // Consulta de Posiciones
  const {
    data: standingsResponse,
    isLoading: loadingStandings,
    refetch,
  } = useGetStandingsQuery(
    { quinielaId, weekId: selectedWeekId! },
    { skip: !quinielaId || !selectedWeekId }
  );

  const [scoreWeek, { isLoading: scoringWeek }] = useScoreWeekMutation();

  const standingsData = standingsResponse?.data;
  const currentWeek = weeks.find((w) => w.id === selectedWeekId);

  const handleScoreWeek = async () => {
    if (!quinielaId || !selectedWeekId) return;
    try {
      const res = await scoreWeek({ quinielaId, weekId: selectedWeekId }).unwrap();
      setToast({ message: res.message || 'Jornada calificada con éxito.', type: 'success' });
      refetch();
    } catch (err: any) {
      setToast({
        message: err?.data?.message || 'Error al calificar la jornada.',
        type: 'error',
      });
    }
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  if (!quinielaId) {
    return (
      <div className="standings-page__no-quiniela">
        <AlertCircle size={40} />
        <h2>No tienes ninguna quiniela seleccionada</h2>
        <p>Crea o únete a una quiniela para consultar la tabla de posiciones.</p>
      </div>
    );
  }

  return (
    <div className="standings-page">
      {/* Toast */}
      {toast && (
        <div className={`standings-page__toast standings-page__toast--${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="standings-page__header">
        <div>
          <h1 className="standings-page__title">Tabla de Posiciones</h1>
          <p className="standings-page__subtitle">
            {activeQuiniela?.name} • Criterio de desempate en cascada estricto
          </p>
        </div>

        {isOwnerOrAdmin && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => setIsClaimModalOpen(true)}
              className="btn btn--outline"
              style={{
                borderColor: '#25d366',
                color: '#25d366',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.8125rem',
                fontWeight: 700,
              }}
              title="Copiar y enviar enlaces personalizados para WhatsApp a participantes migrados"
            >
              <Share2 size={15} />
              <span>Activar Cuentas (WhatsApp)</span>
            </button>

            <button
              onClick={handleScoreWeek}
              disabled={scoringWeek || !selectedWeekId}
              className="standings-page__score-btn"
              title="Evalúa partidos, asigna aciertos, galardones y actualiza la tabla"
            >
              <RefreshCw size={16} className={scoringWeek ? 'standings-page__spin' : ''} />
              {scoringWeek ? 'Calificando...' : 'Calificar Jornada'}
            </button>
          </div>
        )}
      </div>

      {/* Selectores de Temporada y Jornada */}
      <div className="standings-page__controls">
        {seasons.length > 1 && (
          <div className="standings-page__selector-group">
            <label className="standings-page__label">Temporada</label>
            <select
              value={selectedSeasonId || ''}
              onChange={(e) => {
                setSelectedSeasonId(Number(e.target.value));
                setSelectedWeekId(null);
              }}
              className="standings-page__select"
            >
              {seasons.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.isCurrent ? '★ (En Curso)' : s.isFinished ? '— (Concluido)' : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="standings-page__selector-group">
          <label className="standings-page__label">Jornada</label>
          <select
            value={selectedWeekId || ''}
            onChange={(e) => setSelectedWeekId(Number(e.target.value))}
            className="standings-page__select"
          >
            {weeks.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} ({w.status})
              </option>
            ))}
          </select>
        </div>

        {/* Pestañas Semanal vs General */}
        <div className="standings-page__tabs">
          <button
            className={`standings-page__tab ${activeTab === 'weekly' ? 'standings-page__tab--active' : ''}`}
            onClick={() => setActiveTab('weekly')}
          >
            <Trophy size={16} />
            <span>Jornada {currentWeek?.weekNumber || ''}</span>
          </button>
          <button
            className={`standings-page__tab ${activeTab === 'general' ? 'standings-page__tab--active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            <Award size={16} />
            <span>Tabla General</span>
          </button>
        </div>
      </div>

      {/* Banner explicativo del desempate en cascada */}
      <div className="standings-page__rules-banner">
        <Info size={18} className="standings-page__rules-icon" />
        <div className="standings-page__rules-text">
          <strong>Regla de Desempate Oficial:</strong> 1° Más aciertos totales (Hits) → 2° Más sorpresas acertadas (🔮 Upsets ≤25%) → 3° Menos humillaciones (🤡 derrotas por 3+ goles).
        </div>
      </div>

      {/* Tabla de Posiciones */}
      {loadingStandings ? (
        <div className="standings-page__loading">
          <RefreshCw size={28} className="standings-page__spin" />
          <p>Cargando posiciones...</p>
        </div>
      ) : (
        <StandingsTable
          data={
            activeTab === 'weekly'
              ? standingsData?.weeklyStandings ?? []
              : standingsData?.generalStandings ?? []
          }
          isWeeklyView={activeTab === 'weekly'}
        />
      )}

      <ClaimLinksModal
        quinielaId={quinielaId}
        quinielaName={activeQuiniela?.name}
        isOpen={isClaimModalOpen}
        onClose={() => setIsClaimModalOpen(false)}
      />
    </div>
  );
};
