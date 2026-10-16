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
  Sparkles,
  Flame,
  AlertTriangle,
  X,
} from 'lucide-react';
import './ChallengeCard.css';

interface ChallengeCardProps {
  challenge: Challenge;
  currentMemberId?: number;
  isOwnerOrAdmin?: boolean;
  onRespond?: (challenge: Challenge) => void;
}

const TYPE_CONFIG: Record<
  string,
  { label: string; icon: string; LucideIcon: React.ElementType }
> = {
  WEEKLY_RANK: { label: 'Posición Semanal', icon: '📈', LucideIcon: TrendingUp },
  GENERAL_RANK: { label: 'Posición General', icon: '🏆', LucideIcon: Trophy },
  MATCH_WINNER: { label: 'Directo al Partido', icon: '🥊', LucideIcon: Swords },
  EXACT_SCORE: { label: 'Marcador Exacto', icon: '🎯', LucideIcon: Target },
  SUDDEN_DEATH: { label: 'Muerte Súbita', icon: '💀', LucideIcon: Skull },
  TOTAL_GOALS: { label: 'Total de Goles', icon: '⚽', LucideIcon: CircleDot },
};

export const ChallengeCard: React.FC<ChallengeCardProps> = ({
  challenge,
  currentMemberId,
  isOwnerOrAdmin = false,
  onRespond,
}) => {
  const [settleDebt, { isLoading: isSettling }] = useSettleChallengeDebtMutation();
  const [cancelChallenge, { isLoading: isCancelling }] = useCancelChallengeMutation();
  const [feedback, setFeedback] = useState<string | null>(null);

  const typeInfo = TYPE_CONFIG[challenge.challengeType] || {
    label: challenge.challengeType,
    icon: '⚔️',
    LucideIcon: Swords,
  };

  const isWinnerTakesAll = challenge.payoutMode === 'WINNER_TAKES_ALL';

  // Participantes
  const acceptedParticipants = challenge.participants.filter(
    (p) => p.status === 'ACCEPTED'
  );
  const nonAcceptedParticipants = challenge.participants.filter(
    (p) => p.status === 'DECLINED' || p.status === 'EXPIRED'
  );
  const pendingParticipants = challenge.participants.filter(
    (p) => p.status === 'PENDING'
  );

  // Usuario actual
  const currentParticipant = challenge.participants.find(
    (p) => p.memberId === currentMemberId
  );
  const isCreator = challenge.creatorMemberId === currentMemberId;
  const isPendingForCurrentUser = currentParticipant?.status === 'PENDING';
  const isCurrentUserWinner = challenge.participants.some(
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
      setFeedback('¡Apuesta confirmada como pagada! 🤝');
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

  return (
    <article className="challenge-card">
      {/* Header con insignias */}
      <header className="challenge-card__header">
        <div className="challenge-card__badges">
          <span className="challenge-card__type-badge">
            <span role="img" aria-hidden="true">
              {typeInfo.icon}
            </span>
            <span>{typeInfo.label}</span>
          </span>

          <span
            className={`challenge-card__payout-mode ${
              isWinnerTakesAll
                ? 'challenge-card__payout-mode--crown'
                : 'challenge-card__payout-mode--clown'
            }`}
          >
            {isWinnerTakesAll ? '👑 El Rey Cobra' : '🤡 El Último Paga'}
          </span>

          {challenge.status === 'PENDING_ACCEPTANCE' && (
            <span className="challenge-card__status-badge challenge-card__status-badge--pending-acceptance">
              Esperando aceptación
            </span>
          )}
          {challenge.status === 'ACTIVE' && (
            <span className="challenge-card__status-badge challenge-card__status-badge--active">
              En juego
            </span>
          )}
          {challenge.status === 'RESOLVED_WITH_WINNER' && (
            <span className="challenge-card__status-badge challenge-card__status-badge--resolved-with-winner">
              Finalizado
            </span>
          )}
          {challenge.status === 'RESOLVED_NO_WINNER' && (
            <span className="challenge-card__status-badge challenge-card__status-badge--resolved-no-winner">
              Sin Ganador
            </span>
          )}
          {challenge.status === 'UNACCEPTED_EXPIRED' && (
            <span className="challenge-card__status-badge challenge-card__status-badge--expired">
              Expirado
            </span>
          )}
        </div>

        {challenge.targetMatchLabel && (
          <span className="challenge-card__match-label">
            {challenge.targetMatchLabel}
            {challenge.targetMatchScore ? ` (${challenge.targetMatchScore})` : ''}
          </span>
        )}
      </header>

      {/* Apuesta / Premio */}
      <div className="challenge-card__stakes">
        <span className="challenge-card__stakes-label">Apuesta en juego:</span>
        <span className="challenge-card__stakes-value">
          "{challenge.stakesDescription}"
        </span>
      </div>

      {/* Banner de Doble Vida */}
      {challenge.doubleLifeEvents && challenge.doubleLifeEvents.length > 0 && (
        <div className="challenge-card__double-life" role="alert">
          <div className="challenge-card__double-life-title">
            <Flame size={16} />
            <strong>❤️‍🔥 ¡Doble Vida Activada!</strong>
          </div>
          <ul className="challenge-card__double-life-list">
            {challenge.doubleLifeEvents.map((evt, idx) => (
              <li key={idx}>{evt}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Termómetro de Total de Goles (Price is Right) */}
      {challenge.challengeType === 'TOTAL_GOALS' && (
        <div className="challenge-card__thermometer">
          <div className="challenge-card__thermometer-goals">
            <span>⚽ Goles actuales en la jornada:</span>
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

      {/* Participantes aceptados */}
      <div className="challenge-card__participants">
        <span className="challenge-card__participants-title">
          Participantes ({acceptedParticipants.length}):
        </span>

        {acceptedParticipants.map((p) => {
          const isWinner = p.outcome === 'WINNER';
          const isLoser = p.outcome === 'LOSER';
          const isBusted =
            p.isBusted ||
            (challenge.challengeType === 'TOTAL_GOALS' &&
              p.predictedTotalGoals !== null &&
              p.predictedTotalGoals !== undefined &&
              currentGoals > p.predictedTotalGoals);

          return (
            <div
              key={p.id}
              className={`challenge-card__participant ${
                isWinner ? 'challenge-card__participant--winner' : ''
              } ${isLoser ? 'challenge-card__participant--loser' : ''} ${
                isBusted ? 'challenge-card__participant--disqualified' : ''
              }`}
            >
              <div className="challenge-card__participant-avatar">
                <UserAvatar src={p.avatarUrl} alt={p.alias} size="sm" />
              </div>

              <div className="challenge-card__participant-info">
                <span className="challenge-card__participant-alias">
                  {p.alias}
                  {p.isCreator && (
                    <span className="challenge-card__creator-tag"> (Creador)</span>
                  )}
                </span>

                {/* Pronóstico específico */}
                {p.predictedWinnerAbbr && (
                  <span className="challenge-card__participant-pick">
                    Pronóstico: <strong>{p.predictedWinnerAbbr}</strong>
                  </span>
                )}
                {p.predictedHomeScore !== null &&
                  p.predictedHomeScore !== undefined &&
                  p.predictedAwayScore !== null &&
                  p.predictedAwayScore !== undefined && (
                    <span className="challenge-card__participant-pick">
                      Marcador: <strong>{p.predictedHomeScore} - {p.predictedAwayScore}</strong>
                    </span>
                  )}
                {p.predictedTotalGoals !== null &&
                  p.predictedTotalGoals !== undefined && (
                    <span className="challenge-card__participant-pick">
                      Predijo: <strong>{p.predictedTotalGoals} goles</strong>
                    </span>
                  )}

                {/* Estado en vivo / eliminación */}
                {p.currentLiveValue && (
                  <span className="challenge-card__participant-status">
                    {p.currentLiveValue}
                  </span>
                )}
                {p.eliminatedAtMatchLabel && (
                  <span className="challenge-card__participant-status">
                    Eliminado en: {p.eliminatedAtMatchLabel}
                  </span>
                )}
              </div>

              {/* Badges de resultado y pago */}
              <div className="challenge-card__participant-badges">
                {isBusted && (
                  <span className="challenge-card__busted">💥 ¡Se pasó!</span>
                )}

                {isWinner && (
                  <span className="challenge-card__winner-badge">
                    🏆 Ganador
                  </span>
                )}

                {challenge.status === 'RESOLVED_WITH_WINNER' && isLoser && (
                  <>
                    {p.isDebtSettled ? (
                      <span className="challenge-card__settled">
                        🤝 Apuesta Cumplida
                      </span>
                    ) : (
                      <>
                        <span className="challenge-card__debt-pending">
                          ⏳ Pendiente de pagar
                        </span>
                        {canConfirmPayment && (
                          <button
                            type="button"
                            className="challenge-card__settle-btn"
                            disabled={isSettling}
                            onClick={() => handleSettle(p.memberId)}
                            title="Confirmar que este participante ya cumplió la apuesta"
                          >
                            <Check size={14} />
                            <span>Confirmar Pago</span>
                          </button>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Participantes que declinaron o no respondieron a tiempo */}
      {nonAcceptedParticipants.length > 0 && (
        <div className="challenge-card__non-accepted">
          {nonAcceptedParticipants.map((p) => (
            <span key={p.id} className="challenge-card__declined">
              <UserAvatar src={p.avatarUrl} alt={p.alias} size="xs" />
              <span>{p.alias}: </span>
              <em>
                {p.status === 'DECLINED'
                  ? 'Pasó del reto'
                  : 'No respondió a tiempo'}
              </em>
            </span>
          ))}
        </div>
      )}

      {/* Participantes aún pendientes de responder */}
      {pendingParticipants.length > 0 && (
        <div className="challenge-card__pending-list">
          <Clock size={13} />
          <span>
            Esperando respuesta de:{' '}
            {pendingParticipants.map((p) => p.alias).join(', ')}
          </span>
        </div>
      )}

      {/* Banner humorístico cuando nadie ganó */}
      {challenge.status === 'RESOLVED_NO_WINNER' && (
        <div className="challenge-card__no-winner">
          <span className="challenge-card__no-winner-emoji">🤡</span>
          <div>
            <strong>¡Nadie le atinó!</strong>
            <p>
              {challenge.resolutionSummary ||
                'Todos los participantes fallaron su pronóstico o se pasaron de goles.'}
            </p>
          </div>
        </div>
      )}

      {/* Feedback Toast */}
      {feedback && (
        <div className="challenge-card__feedback" role="status">
          {feedback}
        </div>
      )}

      {/* Acciones del usuario */}
      <footer className="challenge-card__actions">
        {isPendingForCurrentUser && onRespond && (
          <button
            type="button"
            className="challenge-btn challenge-btn--primary"
            onClick={() => onRespond(challenge)}
          >
            <Swords size={15} />
            <span>Responder Invitación</span>
          </button>
        )}

        {isCreator && challenge.status === 'PENDING_ACCEPTANCE' && (
          <button
            type="button"
            className="challenge-btn challenge-btn--secondary"
            disabled={isCancelling}
            onClick={handleCancel}
          >
            <X size={15} />
            <span>Cancelar Reto</span>
          </button>
        )}
      </footer>
    </article>
  );
};
