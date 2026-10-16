import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { useOutletContext, Link, useSearchParams } from 'react-router-dom';
import {
  useGetQuinielasQuery,
  useGetQuinielaByIdQuery,
  useGetSeasonsQuery,
  useGetWeeksBySeasonQuery,
  useGetMatchesByWeekQuery,
  useGetStandingsQuery,
  useGetAwardsQuery,
  useScoreWeekMutation,
  useGetLiguillaOverviewQuery,
  useGetWeekChallengesQuery,
  useGetPendingChallengesQuery,
} from '../../services/api';
import { StandingsTable } from './StandingsTable';
import { Trophy, Award, Info, CheckCircle2, AlertCircle, RefreshCw, Flame, Swords, Plus } from 'lucide-react';
import { AWARD_META } from '../Awards/AwardsPage';
import { UserAvatar } from '../../components/common/UserAvatar';
import { getMostRelevantWeekForStandings } from '../../utils/weekSelection';
import { LiquidGlass } from '@sohumsuthar/liquid-glass';
import { ChallengeCard } from '../../components/challenges/ChallengeCard';
import { CreateChallengeModal } from '../../components/challenges/CreateChallengeModal';
import { RespondChallengeModal } from '../../components/challenges/RespondChallengeModal';
import type { Challenge } from '../../types';
import '../Awards/AwardsPage.css';
import './StandingsPage.css';

export const StandingsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'challenges' ? 'challenges' : 'standings';
  const [mainTab, setMainTab] = useState<'standings' | 'challenges' | 'awards'>(initialTab);
  const [standingsTab, setStandingsTab] = useState<'weekly' | 'general'>('weekly');
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | null>(null);
  const [selectedWeekId, setSelectedWeekId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [respondingChallenge, setRespondingChallenge] = useState<Challenge | null>(null);

  const currentUser = useSelector((state: RootState) => state.auth.user);
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

  const formatWeekStatus = (status?: string | null): string => {
    switch (status?.toUpperCase()) {
      case 'SCORED':
        return 'Finalizada';
      case 'LOCKED':
      case 'IN_PROGRESS':
        return 'En Juego';
      case 'PUBLISHED':
        return 'Abierta';
      case 'DRAFT':
        return 'Próxima';
      default:
        return '';
    }
  };

  const { data: weeksData } = useGetWeeksBySeasonQuery(selectedSeasonId!, {
    skip: !selectedSeasonId,
  });
  const weeks = weeksData?.data ?? [];

  // Ocultar jornadas en DRAFT y ordenar de más reciente a más antigua
  const displayWeeks = React.useMemo(() => {
    const filtered = weeks.filter((w) => w.status?.toUpperCase() !== 'DRAFT');
    const source = filtered.length > 0 ? filtered : weeks;
    return [...source].sort((a, b) => b.weekNumber - a.weekNumber);
  }, [weeks]);

  useEffect(() => {
    if (weeks.length > 0 && (selectedWeekId === null || !weeks.some((w) => w.id === selectedWeekId))) {
      const activeWeek = getMostRelevantWeekForStandings(displayWeeks.length > 0 ? displayWeeks : weeks);
      if (activeWeek) {
        setSelectedWeekId(activeWeek.id);
      }
    }
  }, [weeks, displayWeeks, selectedWeekId]);

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
  const isWeekLocked =
    isWeekAlreadyScored ||
    currentWeek?.status?.toUpperCase() === 'LOCKED' ||
    currentWeek?.status?.toUpperCase() === 'IN_PROGRESS';

  // Retos y Apuestas Sociales (SPEC-022)
  const { data: quinielaDetailResponse } = useGetQuinielaByIdQuery(quinielaId, {
    skip: !quinielaId,
  });
  const quinielaMembers = quinielaDetailResponse?.data?.members || [];
  const currentMember = quinielaMembers.find(
    (m) =>
      m.id === quinielaDetailResponse?.data?.currentUserMemberId ||
      m.userId === currentUser?.id
  );

  const { data: matchesResponse } = useGetMatchesByWeekQuery(selectedWeekId!, {
    skip: !selectedWeekId,
  });
  const weekMatches = matchesResponse?.data || [];

  const {
    data: weekChallengesResponse,
    isLoading: loadingChallenges,
  } = useGetWeekChallengesQuery(
    { quinielaId, weekId: selectedWeekId! },
    { skip: !quinielaId || !selectedWeekId }
  );
  const weekChallenges = weekChallengesResponse?.data || [];

  const { data: pendingChallengesResponse } = useGetPendingChallengesQuery(
    quinielaId,
    { skip: !quinielaId }
  );
  const pendingChallenges = pendingChallengesResponse?.data || [];
  const pendingChallengesCount = pendingChallenges.length;

  const userPendingChallenges = weekChallenges.filter((c) =>
    c.participants.some(
      (p) => p.memberId === currentMember?.id && p.status === 'PENDING'
    )
  );

  useEffect(() => {
    const challengeIdParam = searchParams.get('challengeId');
    if (challengeIdParam && weekChallenges.length > 0) {
      const ch = weekChallenges.find((c) => c.id === Number(challengeIdParam));
      if (ch) {
        setRespondingChallenge(ch);
        setMainTab('challenges');
      }
    }
  }, [searchParams, weekChallenges]);

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

  const { data: liguillaOverviewData } = useGetLiguillaOverviewQuery(quinielaId, {
    skip: !quinielaId,
  });
  const liguillaOverview = liguillaOverviewData?.data;
  const isLiguillaVisible = isOwnerOrAdmin || (liguillaOverview && (liguillaOverview.isAvailable || liguillaOverview.status !== 'HIDDEN'));

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
            {mainTab === 'standings'
              ? 'Tabla de Posiciones'
              : mainTab === 'challenges'
              ? 'Retos y Apuestas Sociales'
              : 'Premios y Galardones'}
          </h1>
          <p className="standings-page__subtitle">
            {activeQuiniela?.name} •{' '}
            {mainTab === 'standings'
              ? 'Criterio de desempate en cascada estricto'
              : mainTab === 'challenges'
              ? 'Duelos y apuestas paralelas entre compañeros'
              : 'Reconocimientos y distinciones por jornada'}
          </p>
        </div>

        <div className="standings-page__header-actions">
          {mainTab === 'challenges' && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              disabled={isWeekLocked || !selectedWeekId}
              className={`standings-page__score-btn ${
                isWeekLocked ? 'standings-page__score-btn--disabled' : ''
              }`}
              style={isWeekLocked ? undefined : { background: 'var(--color-primary)' }}
              title={
                isWeekLocked
                  ? 'Esta jornada ya se encuentra cerrada o finalizada, no se pueden lanzar nuevos retos'
                  : 'Lanza un nuevo reto o apuesta a tus amigos'
              }
            >
              <Swords size={15} />
              <span>+ Lanzar Reto</span>
            </button>
          )}

          {isOwnerOrAdmin && mainTab === 'standings' && (
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
          )}
        </div>
      </div>

      {/* Segmented Control Principal: Posiciones vs Retos vs Premios */}
      <LiquidGlass
        className="standings-page__main-tabs"
        contentClassName="standings-page__main-tabs-content"
        macro={true}
        variant="clear"
        role="tablist"
        aria-label="Secciones de posiciones, retos y premios"
      >
        <button
          role="tab"
          aria-selected={mainTab === 'standings'}
          className={`standings-page__main-tab ${
            mainTab === 'standings' ? 'standings-page__main-tab--active' : ''
          }`}
          onClick={() => setMainTab('standings')}
        >
          <Trophy size={16} />
          <span>Posiciones</span>
        </button>
        <button
          role="tab"
          aria-selected={mainTab === 'challenges'}
          className={`standings-page__main-tab ${
            mainTab === 'challenges' ? 'standings-page__main-tab--active' : ''
          }`}
          onClick={() => setMainTab('challenges')}
        >
          <Swords size={16} />
          <span>Retos</span>
          {pendingChallengesCount > 0 && (
            <span className="standings-page__tab-badge">{pendingChallengesCount}</span>
          )}
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
          <span>Premios</span>
        </button>
      </LiquidGlass>

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
            {displayWeeks.map((w) => {
              const statusLabel = formatWeekStatus(w.status);
              return (
                <option key={w.id} value={w.id}>
                  {w.name} {statusLabel ? `· ${statusLabel}` : ''}
                </option>
              );
            })}
          </select>
        </div>

        {/* Pestañas Semanal vs General (Solo visibles en modo Tabla) */}
        {mainTab === 'standings' && (
          <LiquidGlass
            className="standings-page__tabs"
            contentClassName="standings-page__tabs-content"
            macro={true}
            variant="clear"
          >
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
          </LiquidGlass>
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
                      <div className="awards-card__notes">
                        <span className="awards-card__notes-label">Detalle</span>
                        {award.matchDetails && award.matchDetails.length > 0 ? (
                          <div className="awards-card__triggers">
                            {award.notes && (
                              <span className="awards-card__trigger-summary">
                                {award.notes.split('. Partidos:')[0]}
                              </span>
                            )}
                            {award.matchDetails.map((det, idx) => (
                              <div key={idx} className="awards-card__trigger-row">
                                <div className="awards-card__trigger-top">
                                  <span className="awards-card__trigger-match">{det.teamsAbbr || det.matchTitle}</span>
                                  <span className="awards-card__trigger-score">{det.score}</span>
                                  <span className="awards-card__trigger-pick">Pronóstico: {det.pickAbbr}</span>
                                </div>
                                {det.contextText && (
                                  <span className="awards-card__trigger-context">{det.contextText}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span>{award.notes}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VISTA 3: RETOS Y APUESTAS SOCIALES (SPEC-022) */}
      {mainTab === 'challenges' && (
        <div className="standings-page__challenges-container" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          {/* Si el usuario tiene invitaciones pendientes en esta jornada, destacarlas */}
          {userPendingChallenges.length > 0 && (
            <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              <h2
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  color: 'var(--color-accent)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  margin: 0,
                }}
              >
                <span>📬 Mis Invitaciones Pendientes</span>
                <span className="standings-page__tab-badge">{userPendingChallenges.length}</span>
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                {userPendingChallenges.map((c) => (
                  <ChallengeCard
                    key={c.id}
                    challenge={c}
                    currentMemberId={currentMember?.id}
                    isOwnerOrAdmin={isOwnerOrAdmin}
                    onRespond={(ch) => setRespondingChallenge(ch)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Muro público de Retos de la Jornada */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Swords size={20} />
                <span>Retos de la Jornada {currentWeek?.name ? `(${currentWeek.name})` : ''}</span>
              </h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {weekChallenges.length} reto{weekChallenges.length !== 1 ? 's' : ''} registrado{weekChallenges.length !== 1 ? 's' : ''}
              </span>
            </div>

            {loadingChallenges ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <RefreshCw size={24} className="standings-page__spin" style={{ margin: '0 auto 8px' }} />
                <p>Cargando retos de la jornada...</p>
              </div>
            ) : weekChallenges.length === 0 ? (
              <div
                style={{
                  padding: '48px 24px',
                  textAlign: 'center',
                  background: 'var(--bg-card)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px dashed var(--border-medium)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <div style={{ fontSize: '2.5rem' }}>⚔️</div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-main)' }}>
                  Aún no hay retos lanzados para esta jornada
                </h3>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '440px', lineHeight: 1.5 }}>
                  {isWeekLocked
                    ? 'Esta jornada ya se encuentra cerrada o concluida. Los retos solo pueden lanzarse antes del inicio del primer partido.'
                    : '¡Ponte a prueba con tus compañeros! Reta a quién saca más puntos, el marcador exacto del clásico o quién resiste más en muerte súbita.'}
                </p>
                {!isWeekLocked && selectedWeekId && (
                  <button
                    type="button"
                    className="challenge-btn challenge-btn--primary"
                    onClick={() => setIsCreateModalOpen(true)}
                    style={{ marginTop: '8px' }}
                  >
                    <Swords size={16} />
                    <span>¡Lanzar Reto Ahora!</span>
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                {weekChallenges.map((c) => (
                  <ChallengeCard
                    key={c.id}
                    challenge={c}
                    currentMemberId={currentMember?.id}
                    isOwnerOrAdmin={isOwnerOrAdmin}
                    onRespond={(ch) => setRespondingChallenge(ch)}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* Modales de Retos */}
      {selectedWeekId && (
        <CreateChallengeModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          quinielaId={quinielaId}
          weekId={selectedWeekId}
          members={quinielaMembers}
          currentMemberId={currentMember?.id}
          weekMatches={weekMatches}
        />
      )}

      {respondingChallenge && (
        <RespondChallengeModal
          isOpen={!!respondingChallenge}
          onClose={() => setRespondingChallenge(null)}
          challenge={respondingChallenge}
          weekMatches={weekMatches}
        />
      )}
    </div>
  );
};
