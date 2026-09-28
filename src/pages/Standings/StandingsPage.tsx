import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import {
  useGetQuinielasQuery,
  useGetSeasonsQuery,
  useGetWeeksBySeasonQuery,
  useGetStandingsQuery,
  useGetAwardsQuery,
  useScoreWeekMutation,
} from '../../services/api';
import { StandingsTable } from './StandingsTable';
import { Trophy, Award, Info, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { AWARD_META } from '../Awards/AwardsPage';
import { UserAvatar } from '../../components/common/UserAvatar';
import { getMostRelevantWeekForStandings } from '../../utils/weekSelection';
import '../Awards/AwardsPage.css';
import './StandingsPage.css';

export const StandingsPage: React.FC = () => {
  const [mainTab, setMainTab] = useState<'standings' | 'awards'>('standings');
  const [standingsTab, setStandingsTab] = useState<'weekly' | 'general'>('weekly');
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | null>(null);
  const [selectedWeekId, setSelectedWeekId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const activeQuinielaId = useSelector((state: RootState) => state.quiniela.activeQuinielaId);

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
    if (weeks.length > 0 && (selectedWeekId === null || !weeks.some((w) => w.id === selectedWeekId))) {
      const activeWeek = getMostRelevantWeekForStandings(weeks);
      if (activeWeek) {
        setSelectedWeekId(activeWeek.id);
      }
    }
  }, [weeks, selectedWeekId]);

  // Consulta de Posiciones
  const {
    data: standingsResponse,
    isLoading: loadingStandings,
    refetch,
  } = useGetStandingsQuery(
    { quinielaId, weekId: selectedWeekId! },
    { skip: !quinielaId || !selectedWeekId || mainTab !== 'standings' }
  );

  // Consulta de Galardones / Premios
  const {
    data: awardsResponse,
    isLoading: loadingAwards,
  } = useGetAwardsQuery(
    { quinielaId, weekId: selectedWeekId || undefined },
    { skip: !quinielaId || mainTab !== 'awards' }
  );

  const [scoreWeek, { isLoading: scoringWeek }] = useScoreWeekMutation();

  const standingsData = standingsResponse?.data;
  const awards = awardsResponse?.data ?? [];
  const currentWeek = weeks.find((w) => w.id === selectedWeekId);
  const isWeekAlreadyScored = currentWeek?.status?.toUpperCase() === 'SCORED';

  const handleScoreWeek = async () => {
    if (!quinielaId || !selectedWeekId || isWeekAlreadyScored) return;
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

      {/* Header integrado */}
      <div className="standings-page__header">
        <div>
          <h1 className="standings-page__title">
            {mainTab === 'standings' ? 'Tabla de Posiciones' : 'Premios y Galardones'}
          </h1>
          <p className="standings-page__subtitle">
            {activeQuiniela?.name} •{' '}
            {mainTab === 'standings'
              ? 'Criterio de desempate en cascada estricto'
              : 'Reconocimientos y distinciones por jornada'}
          </p>
        </div>

        {isOwnerOrAdmin && mainTab === 'standings' && (
          <div className="standings-page__header-actions">
            <button
              onClick={handleScoreWeek}
              disabled={scoringWeek || !selectedWeekId || isWeekAlreadyScored}
              className={`standings-page__score-btn ${
                isWeekAlreadyScored ? 'standings-page__score-btn--disabled' : ''
              }`}
              title={
                isWeekAlreadyScored
                  ? 'Esta jornada ya ha sido calificada y cuenta con resultados oficiales'
                  : 'Evalúa partidos, asigna aciertos, galardones y actualiza la tabla'
              }
            >
              {scoringWeek ? (
                <>
                  <RefreshCw size={15} className="standings-page__spin" />
                  <span>Calificando...</span>
                </>
              ) : isWeekAlreadyScored ? (
                <>
                  <CheckCircle2 size={15} />
                  <span>Jornada Calificada</span>
                </>
              ) : (
                <>
                  <RefreshCw size={15} />
                  <span>Calificar Jornada</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Segmented Control Principal: Tabla vs Premios */}
      <div className="standings-page__main-tabs" role="tablist" aria-label="Secciones de posiciones y premios">
        <button
          role="tab"
          aria-selected={mainTab === 'standings'}
          className={`standings-page__main-tab ${
            mainTab === 'standings' ? 'standings-page__main-tab--active' : ''
          }`}
          onClick={() => setMainTab('standings')}
        >
          <Trophy size={16} />
          <span>Tabla de Posiciones</span>
        </button>
        <button
          role="tab"
          aria-selected={mainTab === 'awards'}
          className={`standings-page__main-tab ${
            mainTab === 'awards' ? 'standings-page__main-tab--active' : ''
          }`}
          onClick={() => setMainTab('awards')}
        >
          <Award size={16} />
          <span>Premios & Galardones</span>
        </button>
      </div>

      {/* Controles de Temporada y Jornada (Comunes a ambas vistas) */}
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

        {/* Pestañas Semanal vs General (Solo visibles en modo Tabla) */}
        {mainTab === 'standings' && (
          <div className="standings-page__tabs">
            <button
              className={`standings-page__tab ${
                standingsTab === 'weekly' ? 'standings-page__tab--active' : ''
              }`}
              onClick={() => setStandingsTab('weekly')}
            >
              <Trophy size={16} />
              <span>Jornada {currentWeek?.weekNumber || ''}</span>
            </button>
            <button
              className={`standings-page__tab ${
                standingsTab === 'general' ? 'standings-page__tab--active' : ''
              }`}
              onClick={() => setStandingsTab('general')}
            >
              <Award size={16} />
              <span>Tabla General</span>
            </button>
          </div>
        )}
      </div>

      {/* VISTA 1: TABLA DE POSICIONES */}
      {mainTab === 'standings' && (
        <>
          {/* Banner explicativo del desempate en cascada */}
          <div className="standings-page__rules-banner">
            <Info size={18} className="standings-page__rules-icon" />
            <div className="standings-page__rules-text">
              <strong>Regla de Desempate Oficial:</strong> 1° Más aciertos totales (Hits) → 2° Más sorpresas acertadas (Upsets ≤25%) → 3° Menos humillaciones (derrotas por 3+ goles).
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
                standingsTab === 'weekly'
                  ? standingsData?.weeklyStandings ?? []
                  : standingsData?.generalStandings ?? []
              }
              isWeeklyView={standingsTab === 'weekly'}
            />
          )}
        </>
      )}

      {/* VISTA 2: PREMIOS Y GALARDONES */}
      {mainTab === 'awards' && (
        <div className="standings-page__awards-container">
          {loadingAwards ? (
            <div className="awards-page__loading">
              <RefreshCw size={28} className="standings-page__spin" />
              <p>Cargando reconocimientos de la jornada...</p>
            </div>
          ) : awards.length === 0 ? (
            <div className="awards-page__empty">
              <Trophy size={48} className="awards-page__empty-icon" />
              <h3>Aún no hay galardones asignados</h3>
              <p>
                Los reconocimientos y premios se calculan automáticamente al finalizar y calificar
                los partidos de cada jornada.
              </p>
            </div>
          ) : (
            <div className="awards-page__grid">
              {awards.map((award) => {
                const meta = AWARD_META[award.awardType] || {
                  title: award.awardType,
                  icon: <Trophy size={28} />,
                  badgeClass: 'awards-card__badge--gold',
                  cardClass: '',
                };

                return (
                  <div key={award.id} className={`awards-card ${meta.cardClass}`}>
                    <div className="awards-card__header">
                      <div className="awards-card__icon-wrapper">{meta.icon}</div>
                      <span className={`awards-card__badge ${meta.badgeClass}`}>
                        {award.awardValue1} {award.awardValue2 ? `(${award.awardValue2})` : ''}
                      </span>
                    </div>

                    <div className="awards-card__content">
                      <span className="awards-card__category">{meta.title}</span>
                      <div className="awards-card__winner">
                        {award.awardType === 'PARTIDO_DIFICIL' ? (
                          <span className="awards-card__winner-alias">{award.awardValue1}</span>
                        ) : (
                          <>
                            <UserAvatar
                              src={award.avatarUrl}
                              alt={award.memberAlias}
                              size="sm"
                            />
                            <div className="awards-card__winner-info">
                              <span className="awards-card__winner-alias">{award.memberAlias}</span>
                              {award.displayName && award.displayName !== award.memberAlias && (
                                <span className="awards-card__winner-sub">{award.displayName}</span>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                      {award.notes && <p className="awards-card__notes">{award.notes}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
