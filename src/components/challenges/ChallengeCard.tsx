import React, { useState } from 'react';
import type { Challenge, ChallengeParticipant } from '../../types';
import { UserAvatar } from '../common/UserAvatar';
import {
  useSettleChallengeDebtMutation,
  useCancelChallengeMutation,
} from '../../services/api';
import {
  TrendingUp,
  Trophy,
  Swords,
  Target,
  Skull,
  CircleDot,
  Check,
  Clock,
  Flame,
  AlertTriangle,
  AlertCircle,
  Crown,
  Coins,
  X,
} from 'lucide-react';
import './ChallengeCard.css';

interface ChallengeCardProps {
  challenge: Challenge;
  currentMemberId?: number;
  isOwnerOrAdmin?: boolean;
  onRespond?: (challenge: Challenge) => void;
}

/** Configuración clara de criterios de victoria en lenguaje humano */
function getChallengeCriteria(type: string, matchLabel?: string | null): {
  title: string;
  description: string;
  Icon: React.ElementType;
  color: string;
} {
  switch (type) {
    case 'WEEKLY_RANK':
      return {
        title: 'Mejor posición en la jornada',
        description: 'Gana quien sume más puntos en la jornada semanal.',
        Icon: TrendingUp,
        color: '#38bdf8',
      };
    case 'GENERAL_RANK':
      return {
        title: 'Mejor posición general',
        description: 'Gana quien quede más arriba en la tabla acumulada.',
        Icon: Trophy,
        color: '#eab308',
      };
    case 'MATCH_WINNER':
      return {
        title: 'Ganador de partido',
        description: matchLabel
          ? `Acierta al ganador de ${matchLabel}.`
          : 'Acierta al equipo que gane el encuentro.',
        Icon: Swords,
        color: '#f97316',
      };
    case 'EXACT_SCORE':
      return {
        title: 'Marcador exacto',
        description: matchLabel
          ? `Acierta el marcador exacto de ${matchLabel}.`
          : 'Acierta los goles exactos del encuentro.',
        Icon: Target,
        color: '#ec4899',
      };
    case 'TOTAL_GOALS':
      return {
        title: 'Total de goles (Sin pasarse)',
        description: 'Quien más se acerque a los goles totales sin pasarse.',
        Icon: CircleDot,
        color: '#10b981',
      };
    case 'SUDDEN_DEATH':
      return {
        title: 'Muerte súbita',
        description: 'Quien acierte más partidos seguidos sin fallar.',
        Icon: Skull,
        color: '#94a3b8',
      };
    default:
      return {
        title: type,
        description: 'Reto personalizado entre participantes.',
        Icon: Swords,
        color: '#10b981',
      };
  }
}

/** Configuración clara de cómo se paga y quién cobra */
function getPayoutModeInfo(mode: string): {
  title: string;
  description: string;
  Icon: React.ElementType;
  color: string;
} {
  if (mode === 'WINNER_TAKES_ALL') {
    return {
      title: 'El ganador se lleva todo',
      description: 'Todos los que pierdan le pagan la apuesta al 1er lugar.',
      Icon: Crown,
      color: '#eab308',
    };
  }
  return {
    title: 'El último lugar paga',
    description: 'El peor posicionado le cumple la apuesta a todos.',
    Icon: Coins,
    color: '#f43f5e',
  };
}

export const ChallengeCard: React.FC<ChallengeCardProps> = ({
  challenge,
  currentMemberId,
  isOwnerOrAdmin = false,
  onRespond,
}) => {
  const [settleDebt, { isLoading: isSettling }] = useSettleChallengeDebtMutation();
  const [cancelChallenge, { isLoading: isCancelling }] = useCancelChallengeMutation();
  const [feedback, setFeedback] = useState<string | null>(null);

  const criteria = getChallengeCriteria(challenge.challengeType, challenge.targetMatchLabel);
  const payout = getPayoutModeInfo(challenge.payoutMode);

  // Participantes organizados
  const participants = challenge.participants || [];
  const sortedParticipants = [...participants].sort((a, b) => {
    if (a.isCreator) return -1;
    if (b.isCreator) return 1;
    if (a.status === 'ACCEPTED' && b.status !== 'ACCEPTED') return -1;
    if (a.status !== 'ACCEPTED' && b.status === 'ACCEPTED') return 1;
    return a.alias.localeCompare(b.alias);
  });

  const acceptedCount = participants.filter((p) => p.status === 'ACCEPTED').length;
  const totalCount = participants.length;

  // Estado del usuario actual en este reto
  const currentParticipant = participants.find((p) => p.memberId === currentMemberId);
  const isCreator = challenge.creatorMemberId === currentMemberId;
  const isPendingForCurrentUser = currentParticipant?.status === 'PENDING';
  const isCurrentUserWinner = participants.some(
    (p) => p.memberId === currentMemberId && p.outcome === 'WINNER'
  );
  const canConfirmPayment = isCurrentUserWinner || isOwnerOrAdmin;

  const handleSettle = async (memberId: number) => {
    try {
      await settleDebt({
        quinielaId: challenge.quinielaId,
        challengeId: challenge.id,
        memberId,
      }).unwrap();
      setFeedback('¡Apuesta confirmada como pagada!');
      setTimeout(() => setFeedback(null), 3500);
    } catch (err: any) {
      setFeedback(err?.data?.message || 'Error al confirmar pago');
      setTimeout(() => setFeedback(null), 3500);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('¿Seguro que deseas cancelar este reto?')) return;
    try {
      await cancelChallenge({
        quinielaId: challenge.quinielaId,
        challengeId: challenge.id,
      }).unwrap();
    } catch (err: any) {
      alert(err?.data?.message || 'Error al cancelar reto');
    }
  };

  const currentGoals = challenge.actualTotalGoals ?? challenge.currentTotalGoals ?? 0;

  // Etiqueta de estado del reto
  const renderStatusTag = () => {
    switch (challenge.status) {
      case 'PENDING_ACCEPTANCE':
        return (
          <span className="challenge-card__status challenge-card__status--pending">
            <span className="challenge-card__status-dot" />
            <span>Esperando respuestas</span>
          </span>
        );
      case 'ACTIVE':
        return (
          <span className="challenge-card__status challenge-card__status--active">
            <span className="challenge-card__status-dot" />
            <span>En juego</span>
          </span>
        );
      case 'RESOLVED_WITH_WINNER':
        return (
          <span className="challenge-card__status challenge-card__status--resolved">
            <Trophy size={12} />
            <span>Finalizado</span>
          </span>
        );
      case 'RESOLVED_NO_WINNER':
        return (
          <span className="challenge-card__status challenge-card__status--no-winner">
            <AlertCircle size={12} />
            <span>Sin ganador</span>
          </span>
        );
      case 'UNACCEPTED_EXPIRED':
        return (
          <span className="challenge-card__status challenge-card__status--expired">
            <span>Expirado</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="challenge-card__status challenge-card__status--cancelled">
            <span>Cancelado</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <article className="challenge-card">
      {/* 1. Header: Etiqueta de apuesta y estado del reto */}
      <header className="challenge-card__top">
        <div className="challenge-card__badge-row">
          <div className="challenge-card__stakes-badge">
            <Flame size={13} color="#f59e0b" />
            <span>Apuesta en juego</span>
          </div>
          {challenge.targetMatchLabel && (
            <span className="challenge-card__match-pill">
              {challenge.targetMatchLabel}
              {challenge.targetMatchScore ? ` (${challenge.targetMatchScore})` : ''}
            </span>
          )}
        </div>
        {renderStatusTag()}
      </header>

      {/* 2. Título de la apuesta (Lo que se apostó) */}
      <div className="challenge-card__stakes-hero">
        <h3 className="challenge-card__stakes-title">
          "{challenge.stakesDescription}"
        </h3>
      </div>

      {/* 3. Panel de Reglas: Criterio de Victoria y Modo de Pago */}
      <div className="challenge-card__rules">
        <div className="challenge-card__rule-item">
          <div className="challenge-card__rule-icon" style={{ color: criteria.color }}>
            <criteria.Icon size={16} />
          </div>
          <div className="challenge-card__rule-texts">
            <span className="challenge-card__rule-label">Criterio para ganar</span>
            <strong className="challenge-card__rule-name">{criteria.title}</strong>
            <span className="challenge-card__rule-desc">{criteria.description}</span>
          </div>
        </div>

        <div className="challenge-card__rule-divider" />

        <div className="challenge-card__rule-item">
          <div className="challenge-card__rule-icon" style={{ color: payout.color }}>
            <payout.Icon size={16} />
          </div>
          <div className="challenge-card__rule-texts">
            <span className="challenge-card__rule-label">Cómo se cobra</span>
            <strong className="challenge-card__rule-name">{payout.title}</strong>
            <span className="challenge-card__rule-desc">{payout.description}</span>
          </div>
        </div>
      </div>

      {/* Termómetro de Total de Goles (Price is Right) si aplica */}
      {challenge.challengeType === 'TOTAL_GOALS' && (
        <div className="challenge-card__thermometer">
          <div className="challenge-card__thermometer-goals">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <CircleDot size={13} color="#10b981" />
              <span>Goles acumulados en la jornada:</span>
            </span>
            <strong>{currentGoals}</strong>
          </div>
          <div className="challenge-card__thermometer-track">
            <div
              className="challenge-card__thermometer-fill"
              style={{
                width: `${Math.min(100, (currentGoals / 35) * 100)}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Banner de Doble Vida si aplica */}
      {challenge.doubleLifeEvents && challenge.doubleLifeEvents.length > 0 && (
        <div className="challenge-card__double-life" role="alert">
          <div className="challenge-card__double-life-title">
            <Flame size={15} />
            <span>¡Doble Vida Activada!</span>
          </div>
          <ul className="challenge-card__double-life-list">
            {challenge.doubleLifeEvents.map((evt, idx) => (
              <li key={idx}>{evt}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 4. Participantes Involucrados (TODOS con foto de perfil) */}
      <div className="challenge-card__participants-section">
        <div className="challenge-card__section-header">
          <span className="challenge-card__section-title">
            Participantes involucrados
          </span>
          <span className="challenge-card__section-meta">
            {acceptedCount} de {totalCount} listos
          </span>
        </div>

        <div className="challenge-card__participants-list">
          {sortedParticipants.map((p) => {
            const isWinner = p.outcome === 'WINNER';
            const isLoser = p.outcome === 'LOSER';
            const isPending = p.status === 'PENDING';
            const isDeclined = p.status === 'DECLINED' || p.status === 'EXPIRED';
            const isBusted =
              p.isBusted ||
              (challenge.challengeType === 'TOTAL_GOALS' &&
                p.predictedTotalGoals !== null &&
                p.predictedTotalGoals !== undefined &&
                currentGoals > p.predictedTotalGoals);

            return (
              <div
                key={p.id}
                className={`challenge-card__participant-row ${
                  isWinner ? 'challenge-card__participant-row--winner' : ''
                } ${isPending ? 'challenge-card__participant-row--pending' : ''} ${
                  isDeclined ? 'challenge-card__participant-row--declined' : ''
                }`}
              >
                {/* Lado izquierdo: Avatar + Nombre + Estado */}
                <div className="challenge-card__participant-main">
                  <div className="challenge-card__avatar-wrap">
                    <UserAvatar src={p.avatarUrl} alt={p.alias} size="sm" />
                    {isWinner && (
                      <span className="challenge-card__winner-crown" title="Ganador del reto">
                        <Crown size={12} color="#000" />
                      </span>
                    )}
                  </div>

                  <div className="challenge-card__participant-details">
                    <div className="challenge-card__name-line">
                      <span className="challenge-card__alias">{p.alias}</span>
                      {p.isCreator && (
                        <span className="challenge-card__creator-badge">Creador</span>
                      )}
                    </div>

                    <div className="challenge-card__status-line">
                      {isPending && (
                        <span className="challenge-card__pending-text">
                          <Clock size={11} />
                          <span>Invitado · Esperando respuesta</span>
                        </span>
                      )}

                      {isDeclined && (
                        <span className="challenge-card__declined-text">
                          <X size={11} />
                          <span>{p.status === 'DECLINED' ? 'Rechazó la invitación' : 'Expiró sin responder'}</span>
                        </span>
                      )}

                      {!isPending && !isDeclined && (
                        <>
                          {/* Pronósticos específicos */}
                          {p.predictedWinnerAbbr && (
                            <span className="challenge-card__pick-pill">
                              Elige: <strong>{p.predictedWinnerAbbr}</strong>
                            </span>
                          )}
                          {p.predictedHomeScore !== null &&
                            p.predictedHomeScore !== undefined &&
                            p.predictedAwayScore !== null &&
                            p.predictedAwayScore !== undefined && (
                              <span className="challenge-card__pick-pill">
                                Marcador: <strong>{p.predictedHomeScore} - {p.predictedAwayScore}</strong>
                              </span>
                            )}
                          {p.predictedTotalGoals !== null &&
                            p.predictedTotalGoals !== undefined && (
                              <span className="challenge-card__pick-pill">
                                Predijo: <strong>{p.predictedTotalGoals} goles</strong>
                              </span>
                            )}

                          {/* Estado en vivo o posición */}
                          {p.currentLiveValue && (
                            <span className="challenge-card__live-pill">
                              {p.currentLiveValue}
                            </span>
                          )}

                          {/* Si aún no arranca la jornada y no hay live value */}
                          {!p.currentLiveValue &&
                            !p.predictedWinnerAbbr &&
                            p.predictedHomeScore === null &&
                            p.predictedTotalGoals === null && (
                              <span className="challenge-card__ready-pill">
                                <Check size={11} />
                                <span>Aceptado · Listo</span>
                              </span>
                            )}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Lado derecho: Badges de resultado o pago */}
                <div className="challenge-card__participant-right">
                  {isBusted && (
                    <span className="challenge-card__busted-tag">
                      <AlertTriangle size={11} />
                      <span>¡Se pasó!</span>
                    </span>
                  )}

                  {isWinner && (
                    <span className="challenge-card__winner-tag">
                      <Trophy size={12} />
                      <span>Ganador</span>
                    </span>
                  )}

                  {challenge.status === 'RESOLVED_WITH_WINNER' && isLoser && (
                    <>
                      {p.isDebtSettled ? (
                        <span className="challenge-card__settled-tag">
                          <Check size={12} />
                          <span>Apuesta Cumplida</span>
                        </span>
                      ) : (
                        <div className="challenge-card__debt-group">
                          <span className="challenge-card__debt-tag">
                            <Clock size={11} />
                            <span>Debe cumplir</span>
                          </span>
                          {canConfirmPayment && (
                            <button
                              type="button"
                              className="challenge-card__confirm-btn"
                              disabled={isSettling}
                              onClick={() => handleSettle(p.memberId)}
                              title="Confirmar que este participante ya cumplió su apuesta"
                            >
                              <Check size={13} />
                              <span>Confirmar</span>
                            </button>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Banner de Nadie le atinó */}
      {challenge.status === 'RESOLVED_NO_WINNER' && (
        <div className="challenge-card__no-winner">
          <AlertCircle size={20} color="#f59e0b" style={{ flexShrink: 0 }} />
          <div>
            <strong>¡Nadie le atinó!</strong>
            <p>
              {challenge.resolutionSummary ||
                'Todos los participantes fallaron su pronóstico o se pasaron de goles.'}
            </p>
          </div>
        </div>
      )}

      {/* Toast Feedback */}
      {feedback && (
        <div className="challenge-card__feedback" role="status">
          {feedback}
        </div>
      )}

      {/* Acciones principales: Responder o Cancelar */}
      {((isPendingForCurrentUser && onRespond) || (isCreator && challenge.status === 'PENDING_ACCEPTANCE')) && (
        <footer className="challenge-card__actions">
          {isPendingForCurrentUser && onRespond && (
            <button
              type="button"
              className="challenge-btn challenge-btn--primary"
              onClick={() => onRespond(challenge)}
            >
              <Swords size={16} />
              <span>Responder Invitación</span>
            </button>
          )}

          {isCreator && challenge.status === 'PENDING_ACCEPTANCE' && (
            <button
              type="button"
              className="challenge-btn challenge-btn--cancel"
              disabled={isCancelling}
              onClick={handleCancel}
            >
              <X size={14} />
              <span>Cancelar Reto</span>
            </button>
          )}
        </footer>
      )}
    </article>
  );
};
