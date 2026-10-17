import React, { useState, useEffect, useMemo } from 'react';
import {
  Trophy,
  Calendar,
  Clock,
  Plus,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Shield,
  Award,
  Users,
  Edit3,
  Sparkles,
  Check,
  Lock,
  Unlock,
  Eye,
  RotateCw,
} from 'lucide-react';
import {
  useGetEventRoundsQuery,
  useGetEventRoundDetailQuery,
  useSubmitEventPicksMutation,
} from '../../services/api';
import type {
  Quiniela,
  QuinielaDetail,
  EventRoundSummaryDto,
  EventQuestionDto,
  EventOptionDto,
} from '../../types';
import {
  CreateOrEditRoundModal,
  AddQuestionModal,
  ResolveRoundModal,
} from './CustomEventAdminModal';
import './CustomEventsArena.css';

interface CustomEventsArenaProps {
  quiniela: Quiniela | QuinielaDetail;
  activeMode?: 'picks' | 'matrix';
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE: CUENTA REGRESIVA EN VIVO
// ─────────────────────────────────────────────────────────────────────────────

interface CountdownProps {
  lockDateUtc: string;
  isLocked: boolean;
}

const CountdownTimer: React.FC<CountdownProps> = ({ lockDateUtc, isLocked }) => {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isPast: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: false });

  useEffect(() => {
    const calculateTime = () => {
      const target = new Date(lockDateUtc).getTime();
      const now = new Date().getTime();
      const difference = target - now;

      if (difference <= 0 || isLocked) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, isPast: false });
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [lockDateUtc, isLocked]);

  if (timeLeft.isPast || isLocked) {
    return (
      <div className="custom-events-countdown custom-events-countdown--locked">
        <Lock size={15} />
        <span>Pronósticos Cerrados</span>
      </div>
    );
  }

  return (
    <div className="custom-events-countdown">
      <Clock size={15} style={{ color: 'var(--color-primary)' }} />
      <span>Cierra en:</span>
      <div className="custom-events-countdown__digits">
        {timeLeft.days > 0 && (
          <span className="custom-events-countdown__digit">
            <strong>{timeLeft.days}</strong>d
          </span>
        )}
        <span className="custom-events-countdown__digit">
          <strong>{String(timeLeft.hours).padStart(2, '0')}</strong>h
        </span>
        <span className="custom-events-countdown__digit">
          <strong>{String(timeLeft.minutes).padStart(2, '0')}</strong>m
        </span>
        <span className="custom-events-countdown__digit">
          <strong>{String(timeLeft.seconds).padStart(2, '0')}</strong>s
        </span>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL: ARENA DE EVENTOS PERSONALIZADOS
// ─────────────────────────────────────────────────────────────────────────────

export const CustomEventsArena: React.FC<CustomEventsArenaProps> = ({
  quiniela,
  activeMode = 'picks',
}) => {
  const isOwnerOrAdmin =
    quiniela.userRole === 'OWNER' || quiniela.userRole === 'ADMIN';

  // Modales de administración
  const [showCreateRoundModal, setShowCreateRoundModal] = useState(false);
  const [showEditRoundModal, setShowEditRoundModal] = useState(false);
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);

  // Consulta de rondas de la quiniela
  const {
    data: roundsResponse,
    isLoading: isRoundsLoading,
    refetch: refetchRounds,
  } = useGetEventRoundsQuery(quiniela.id);

  const rounds = roundsResponse?.data || [];

  // Ronda seleccionada
  const [selectedRoundId, setSelectedRoundId] = useState<number | null>(null);

  // Auto-seleccionar ronda más relevante (primera abierta o última creada)
  useEffect(() => {
    if (rounds.length > 0) {
      if (
        selectedRoundId === null ||
        !rounds.some((r) => r.id === selectedRoundId)
      ) {
        const openRound = rounds.find((r) => r.status === 'Open' && !r.isLocked);
        const resolvedRound = [...rounds].reverse().find((r) => r.status === 'Resolved');
        setSelectedRoundId(openRound?.id ?? resolvedRound?.id ?? rounds[0].id);
      }
    }
  }, [rounds, selectedRoundId]);

  // Consulta de detalle de la ronda seleccionada
  const {
    data: roundDetailResponse,
    isLoading: isDetailLoading,
    refetch: refetchDetail,
  } = useGetEventRoundDetailQuery(
    { quinielaId: quiniela.id, roundId: selectedRoundId! },
    { skip: !selectedRoundId }
  );

  const roundDetail = roundDetailResponse?.data;
  const currentRoundSummary = rounds.find((r) => r.id === selectedRoundId);

  // Mutación para enviar picks
  const [submitPicks, { isLoading: isSubmittingPick }] =
    useSubmitEventPicksMutation();

  // Toast / feedback visual
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Estado local para selecciones optimistas
  const [localPicks, setLocalPicks] = useState<Record<number, number>>({});

  // Sincronizar selecciones del backend cuando cambie el detalle
  useEffect(() => {
    if (roundDetail?.questions) {
      const picksMap: Record<number, number> = {};
      roundDetail.questions.forEach((q) => {
        if (q.userSelectedOptionId) {
          picksMap[q.id] = q.userSelectedOptionId;
        }
      });
      setLocalPicks(picksMap);
    }
  }, [roundDetail]);

  // Manejador de selección de voto
  const handleSelectOption = async (questionId: number, optionId: number) => {
    if (!roundDetail || roundDetail.isLocked || roundDetail.status === 'Locked' || roundDetail.status === 'Resolved') {
      return;
    }

    // Actualización optimista inmediata
    const updated = { ...localPicks, [questionId]: optionId };
    setLocalPicks(updated);

    try {
      const picksPayload = Object.entries(updated).map(([qId, optId]) => ({
        eventQuestionId: Number(qId),
        eventOptionId: optId,
      }));

      await submitPicks({
        quinielaId: quiniela.id,
        roundId: roundDetail.id,
        body: { picks: picksPayload },
      }).unwrap();

      setToastMessage('Pronóstico guardado ✓');
      setTimeout(() => setToastMessage(null), 2500);
      refetchDetail();
      refetchRounds();
    } catch (err: any) {
      setToastMessage(
        err?.data?.message || err?.message || 'Error al guardar el pronóstico.'
      );
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  // Cálculo de estadísticas y progreso
  const totalQuestions = roundDetail?.questions?.length || 0;
  const answeredQuestions = Object.keys(localPicks).length;
  const progressPercentage =
    totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;

  // Estado visual formateado de la ronda
  const getRoundStatusBadge = (status: string, isLocked: boolean) => {
    if (status === 'Resolved') {
      return (
        <span className="round-status-badge round-status-badge--resolved">
          <CheckCircle2 size={13} />
          <span>Finalizada</span>
        </span>
      );
    }
    if (isLocked || status === 'Locked') {
      return (
        <span className="round-status-badge round-status-badge--locked">
          <Lock size={13} />
          <span>Bloqueada</span>
        </span>
      );
    }
    return (
      <span className="round-status-badge round-status-badge--open">
        <Sparkles size={13} />
        <span>Abierta</span>
      </span>
    );
  };

  if (isRoundsLoading) {
    return (
      <div className="custom-events-arena__loading">
        <RotateCw className="spin" size={24} />
        <p>Cargando rondas y eventos...</p>
      </div>
    );
  }

  if (rounds.length === 0) {
    return (
      <div className="card custom-events-arena__empty">
        <div className="custom-events-arena__empty-icon">
          <Trophy size={48} />
        </div>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>
          ¡Bienvenido a la Quiniela de Eventos Personalizados!
        </h3>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '540px', margin: '0 auto 20px' }}>
          Aún no se ha publicado ninguna ronda para esta quiniela.
          {isOwnerOrAdmin
            ? ' Como organizador, crea tu primera ronda semanal (ej. Gala de Eliminación, Premios) y añade preguntas con sus opciones.'
            : ' El organizador publicará muy pronto la primera ronda con preguntas para pronosticar.'}
        </p>

        {isOwnerOrAdmin && (
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => setShowCreateRoundModal(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={18} />
            <span>Crear Primera Ronda de Eventos</span>
          </button>
        )}

        {showCreateRoundModal && (
          <CreateOrEditRoundModal
            quinielaId={quiniela.id}
            onClose={() => setShowCreateRoundModal(false)}
            onSuccess={() => refetchRounds()}
          />
        )}
      </div>
    );
  }

  return (
    <div className="custom-events-arena">
      {/* Toast flotante */}
      {toastMessage && (
        <div className="custom-events-toast">
          <Check size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ─── NAVEGADOR DE RONDAS (TABS) ────────────────────────────────────── */}
      <div className="custom-events-arena__rounds-nav">
        <div className="custom-events-arena__rounds-scroll">
          {rounds.map((round) => {
            const isActive = round.id === selectedRoundId;
            return (
              <button
                key={round.id}
                type="button"
                className={`custom-events-round-tab ${
                  isActive ? 'custom-events-round-tab--active' : ''
                }`}
                onClick={() => setSelectedRoundId(round.id)}
              >
                <span className="custom-events-round-tab__title">{round.title}</span>
                {getRoundStatusBadge(round.status, round.isLocked)}
              </button>
            );
          })}
        </div>

        {/* Acciones de Organizador para rondas */}
        {isOwnerOrAdmin && (
          <div className="custom-events-arena__admin-quick-add">
            <button
              type="button"
              className="btn btn--outline btn--sm"
              onClick={() => setShowCreateRoundModal(true)}
              title="Crear nueva ronda"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              <Plus size={14} />
              <span>Nueva Ronda</span>
            </button>
          </div>
        )}
      </div>

      {/* ─── CABECERA DE LA RONDA ACTIVA ─────────────────────────────────── */}
      {roundDetail && (
        <div className="custom-events-arena__header card">
          <div className="custom-events-arena__header-main">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span className="badge badge--primary">Ronda #{roundDetail.roundOrder}</span>
                {getRoundStatusBadge(roundDetail.status, roundDetail.isLocked)}
                {roundDetail.status === 'Resolved' && (
                  <span className="badge badge--accent">
                    {currentRoundSummary?.userPointsEarned ?? 0} Pts Ganados
                  </span>
                )}
              </div>
              <h2 style={{ fontSize: '1.375rem', margin: 0 }}>{roundDetail.title}</h2>
            </div>

            <div className="custom-events-arena__countdown-box">
              <CountdownTimer
                lockDateUtc={roundDetail.lockDateUtc}
                isLocked={roundDetail.isLocked}
              />
            </div>
          </div>

          {/* Barra de progreso de preguntas respondidas */}
          {activeMode === 'picks' && totalQuestions > 0 && (
            <div className="custom-events-progress">
              <div className="custom-events-progress__label">
                <span>
                  Progreso: <strong>{answeredQuestions}</strong> de {totalQuestions} preguntas respondidas
                </span>
                <span className="custom-events-progress__pct">{progressPercentage}%</span>
              </div>
              <div className="custom-events-progress__track">
                <div
                  className="custom-events-progress__fill"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          )}

          {/* Barra de herramientas para Administrador/Organizador */}
          {isOwnerOrAdmin && (
            <div className="custom-events-admin-toolbar">
              <span className="custom-events-admin-toolbar__badge">
                <Shield size={14} /> Panel Organizador
              </span>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn--outline btn--sm"
                  onClick={() => setShowEditRoundModal(true)}
                >
                  <Edit3 size={14} />
                  <span>Editar Ronda</span>
                </button>
                <button
                  type="button"
                  className="btn btn--outline btn--sm"
                  onClick={() => setShowAddQuestionModal(true)}
                >
                  <Plus size={14} />
                  <span>+ Agregar Pregunta</span>
                </button>
                <button
                  type="button"
                  className="btn btn--primary btn--sm"
                  onClick={() => setShowResolveModal(true)}
                  style={{
                    backgroundColor:
                      roundDetail.status === 'Resolved'
                        ? 'var(--bg-elevated)'
                        : 'var(--color-primary)',
                  }}
                >
                  <Trophy size={14} />
                  <span>
                    {roundDetail.status === 'Resolved'
                      ? 'Re-dictaminar Ganadores'
                      : 'Dictaminar Resultados'}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── VISTA 1: PRONÓSTICOS DE LA RONDA (PICKS) ─────────────────────── */}
      {activeMode === 'picks' && roundDetail && (
        <div className="custom-events-picks-section">
          {totalQuestions === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '36px 16px' }}>
              <HelpCircle size={36} style={{ color: 'var(--text-muted)', marginBottom: '8px' }} />
              <h4 style={{ margin: '0 0 6px 0' }}>Esta ronda aún no tiene preguntas</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
                {isOwnerOrAdmin
                  ? 'Haz clic en "+ Agregar Pregunta" arriba para capturar los nominados u opciones.'
                  : 'El organizador agregará preguntas a esta ronda en breve.'}
              </p>
            </div>
          ) : (
            <div className="custom-events-questions-grid">
              {roundDetail.questions.map((question, qIdx) => {
                const userSelectedOptionId = localPicks[question.id];
                const isRoundResolved = roundDetail.status === 'Resolved';
                const isRoundLocked = roundDetail.isLocked || isRoundResolved;

                return (
                  <div key={question.id} className="event-question-card">
                    <div className="event-question-card__header">
                      <div className="event-question-card__meta">
                        <span className="event-question-card__number">
                          #{qIdx + 1}
                        </span>
                        <div>
                          <h3 className="event-question-card__title">
                            {question.questionText}
                          </h3>
                          {question.description && (
                            <p className="event-question-card__desc">
                              {question.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="event-question-card__points-badge">
                        +{question.points} pt{question.points > 1 ? 's' : ''}
                      </div>
                    </div>

                    {/* Grid de opciones tipo ficha */}
                    <div className="event-options-grid">
                      {question.options.map((option) => {
                        const isSelected = userSelectedOptionId === option.id;
                        const isWinner = isRoundResolved && option.isCorrect === true;
                        const isWrongSelection =
                          isRoundResolved && isSelected && option.isCorrect === false;

                        let chipStateClass = '';
                        if (isWinner) chipStateClass = 'event-option-chip--correct';
                        else if (isWrongSelection) chipStateClass = 'event-option-chip--wrong';
                        else if (isSelected) chipStateClass = 'event-option-chip--selected';

                        if (isRoundLocked) {
                          chipStateClass += ' event-option-chip--locked';
                        }

                        return (
                          <button
                            key={option.id}
                            type="button"
                            className={`event-option-chip ${chipStateClass}`}
                            onClick={() => handleSelectOption(question.id, option.id)}
                            disabled={isRoundLocked || isSubmittingPick}
                            aria-label={`Seleccionar ${option.optionText}`}
                          >
                            {/* Avatar o póster de la opción */}
                            {option.imageUrl ? (
                              <img
                                src={option.imageUrl}
                                alt={option.optionText}
                                className="event-option-chip__avatar"
                              />
                            ) : (
                              <div className="event-option-chip__initials">
                                {option.optionText.slice(0, 2).toUpperCase()}
                              </div>
                            )}

                            {/* Contenido textual de la opción */}
                            <div className="event-option-chip__content">
                              <span className="event-option-chip__text">
                                {option.optionText}
                              </span>

                              {/* Barra y porcentaje de votos de la comunidad cuando está cerrada/resuelta */}
                              {isRoundLocked && (
                                <div className="event-option-chip__community-bar-wrap">
                                  <div
                                    className="event-option-chip__bar"
                                    style={{
                                      width: `${Math.min(option.pickPercentage, 100)}%`,
                                      backgroundColor: isWinner
                                        ? 'var(--color-primary)'
                                        : 'var(--color-secondary)',
                                    }}
                                  />
                                  <span className="event-option-chip__vote-pct">
                                    {Math.round(option.pickPercentage)}% ({option.picksCount})
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Badges de resultado o selección */}
                            {isWinner && (
                              <span className="badge badge--primary event-option-chip__badge">
                                ✓ Ganador
                              </span>
                            )}
                            {isWrongSelection && (
                              <span className="badge badge--danger event-option-chip__badge">
                                ✗ Fallo
                              </span>
                            )}
                            {!isRoundResolved && isSelected && (
                              <span className="badge badge--primary event-option-chip__badge">
                                ✓ Tu Pick
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── VISTA 2: MATRIZ DE RIVALES ────────────────────────────────────── */}
      {activeMode === 'matrix' && roundDetail && (
        <div className="custom-events-matrix card">
          <div className="custom-events-matrix__header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={18} style={{ color: 'var(--color-primary)' }} />
              <h3 style={{ fontSize: '1.125rem', margin: 0 }}>
                Matriz de Pronósticos de Rivales — {roundDetail.title}
              </h3>
            </div>
            {getRoundStatusBadge(roundDetail.status, roundDetail.isLocked)}
          </div>

          {!roundDetail.isLocked && roundDetail.status !== 'Resolved' ? (
            <div className="custom-events-matrix__locked-notice">
              <Shield size={32} style={{ color: 'var(--color-accent)' }} />
              <h4>Juego Limpio Activo</h4>
              <p>
                Los pronósticos de los demás participantes se revelarán en esta tabla una vez que
                el reloj llegue a la fecha límite de cierre:{' '}
                <strong>{new Date(roundDetail.lockDateUtc).toLocaleString('es-MX')}</strong>.
              </p>
            </div>
          ) : (
            <div className="custom-events-matrix__table-wrap">
              <table className="custom-events-matrix__table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>#</th>
                    <th>Participante</th>
                    {roundDetail.questions.map((q, idx) => (
                      <th key={q.id} title={q.questionText}>
                        P{idx + 1} ({q.points}p)
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(('members' in quiniela && Array.isArray(quiniela.members)) ? quiniela.members : []).map((member, mIdx) => {
                    const isCurrentUser = member.id === roundDetail.currentUserMemberId;
                    return (
                      <tr
                        key={member.id}
                        className={isCurrentUser ? 'custom-events-matrix__row--current' : ''}
                      >
                        <td style={{ color: 'var(--text-muted)', fontWeight: 600 }}>
                          {mIdx + 1}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <strong style={{ color: 'var(--text-main)' }}>
                              {member.alias}
                            </strong>
                            {isCurrentUser && (
                              <span className="badge badge--accent" style={{ fontSize: '0.65rem' }}>
                                Tú
                              </span>
                            )}
                          </div>
                        </td>
                        {roundDetail.questions.map((q) => {
                          const pick = roundDetail.allMemberPicks?.find(
                            (p) => p.memberId === member.id && p.eventQuestionId === q.id
                          );

                          if (!pick) {
                            return (
                              <td key={q.id} style={{ color: 'var(--text-muted)' }}>
                                —
                              </td>
                            );
                          }

                          let cellBadgeClass = 'badge--secondary';
                          if (pick.isHit === true) cellBadgeClass = 'badge--primary';
                          if (pick.isHit === false) cellBadgeClass = 'badge--danger';

                          return (
                            <td key={q.id}>
                              <span
                                className={`badge ${cellBadgeClass}`}
                                style={{
                                  fontSize: '0.75rem',
                                  display: 'inline-block',
                                  maxWidth: '140px',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                                title={pick.optionText}
                              >
                                {pick.optionText}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── MODALES DE ADMINISTRACIÓN ─────────────────────────────────────── */}
      {showCreateRoundModal && (
        <CreateOrEditRoundModal
          quinielaId={quiniela.id}
          onClose={() => setShowCreateRoundModal(false)}
          onSuccess={() => refetchRounds()}
        />
      )}

      {showEditRoundModal && roundDetail && (
        <CreateOrEditRoundModal
          quinielaId={quiniela.id}
          existingRound={roundDetail}
          onClose={() => setShowEditRoundModal(false)}
          onSuccess={() => {
            refetchRounds();
            refetchDetail();
          }}
        />
      )}

      {showAddQuestionModal && roundDetail && (
        <AddQuestionModal
          quinielaId={quiniela.id}
          roundId={roundDetail.id}
          existingQuestionsCount={roundDetail.questions?.length || 0}
          onClose={() => setShowAddQuestionModal(false)}
          onSuccess={() => refetchDetail()}
        />
      )}

      {showResolveModal && roundDetail && (
        <ResolveRoundModal
          quinielaId={quiniela.id}
          round={roundDetail}
          onClose={() => setShowResolveModal(false)}
          onSuccess={() => {
            refetchRounds();
            refetchDetail();
          }}
        />
      )}
    </div>
  );
};
