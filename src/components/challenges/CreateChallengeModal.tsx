import React, { useState } from 'react';
import type {
  QuinielaMember,
  Match,
  ChallengeType,
  PayoutMode,
  CreateChallengeRequest,
} from '../../types';
import { useCreateChallengeMutation } from '../../services/api';
import { UserAvatar } from '../common/UserAvatar';
import {
  Swords,
  X,
  Trophy,
  TrendingUp,
  Target,
  Skull,
  CircleDot,
  Check,
  AlertCircle,
} from 'lucide-react';
import './CreateChallengeModal.css';

interface CreateChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  quinielaId: number;
  weekId: number;
  members: QuinielaMember[];
  currentMemberId?: number;
  weekMatches: Match[];
}

const CHALLENGE_TYPES: Array<{
  type: ChallengeType;
  title: string;
  icon: string;
  desc: string;
}> = [
  {
    type: 'WEEKLY_RANK',
    title: 'Posición Semanal',
    icon: '📈',
    desc: 'Compite por quién queda más alto en la jornada con sus picks habituales.',
  },
  {
    type: 'GENERAL_RANK',
    title: 'Posición General',
    icon: '🏆',
    desc: 'Compite por quién queda mejor en el acumulado global al cierre.',
  },
  {
    type: 'MATCH_WINNER',
    title: 'Directo al Partido',
    icon: '🥊',
    desc: 'Elige un partido estelar (Local, Empate o Visita). Máximo 3 retados.',
  },
  {
    type: 'EXACT_SCORE',
    title: 'Marcador Exacto',
    icon: '🎯',
    desc: 'Predice el resultado exacto (ej. 2-1). No se pueden repetir marcadores.',
  },
  {
    type: 'SUDDEN_DEATH',
    title: 'Muerte Súbita',
    icon: '💀',
    desc: 'El primero que falle un partido en orden cronológico queda eliminado.',
  },
  {
    type: 'TOTAL_GOALS',
    title: 'Total de Goles',
    icon: '⚽',
    desc: 'Regla estricta: el que se pase pierde. Gana el más cercano sin pasarse.',
  },
];

export const CreateChallengeModal: React.FC<CreateChallengeModalProps> = ({
  isOpen,
  onClose,
  quinielaId,
  weekId,
  members,
  currentMemberId,
  weekMatches,
}) => {
  const [createChallenge, { isLoading }] = useCreateChallengeMutation();

  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  const [challengeType, setChallengeType] = useState<ChallengeType>('WEEKLY_RANK');
  const [payoutMode, setPayoutMode] = useState<PayoutMode>('WINNER_TAKES_ALL');
  const [stakesDescription, setStakesDescription] = useState('');

  // Predicciones específicas según tipo
  const [targetMatchId, setTargetMatchId] = useState<number | undefined>(
    weekMatches[0]?.id
  );
  const [predictedWinnerAbbr, setPredictedWinnerAbbr] = useState<string>('');
  const [predictedHomeScore, setPredictedHomeScore] = useState<number | ''>('');
  const [predictedAwayScore, setPredictedAwayScore] = useState<number | ''>('');
  const [predictedTotalGoals, setPredictedTotalGoals] = useState<number | ''>('');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filtrar miembros para no incluirse a uno mismo
  const availableMembers = members.filter((m) => m.id !== currentMemberId);

  const toggleMember = (memberId: number) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  const selectedMatch = weekMatches.find((m) => m.id === targetMatchId) || weekMatches[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (selectedMembers.length === 0) {
      setErrorMsg('Debes seleccionar al menos un compañero para retar.');
      return;
    }

    if (!stakesDescription.trim()) {
      setErrorMsg('Debes especificar qué se apuesta (ej. "Unos tacos y un six").');
      return;
    }

    if (challengeType === 'MATCH_WINNER') {
      if (!targetMatchId) {
        setErrorMsg('Selecciona un partido para el reto.');
        return;
      }
      if (!predictedWinnerAbbr) {
        setErrorMsg('Elige tu pronóstico para el partido (Local, Empate o Visita).');
        return;
      }
      if (selectedMembers.length > 2) {
        setErrorMsg('El reto Directo al Partido admite máximo 3 participantes en total (tú y 2 invitados).');
        return;
      }
    }

    if (challengeType === 'EXACT_SCORE') {
      if (!targetMatchId) {
        setErrorMsg('Selecciona un partido para el reto.');
        return;
      }
      if (predictedHomeScore === '' || predictedAwayScore === '') {
        setErrorMsg('Ingresa tu marcador exacto pronosticado.');
        return;
      }
    }

    if (challengeType === 'TOTAL_GOALS') {
      if (predictedTotalGoals === '' || Number(predictedTotalGoals) < 0) {
        setErrorMsg('Ingresa tu pronóstico de goles totales de la jornada.');
        return;
      }
    }

    const payload: CreateChallengeRequest = {
      quinielaId,
      weekId,
      invitedMemberIds: selectedMembers,
      challengeType,
      payoutMode,
      stakesDescription: stakesDescription.trim(),
      targetMatchId:
        challengeType === 'MATCH_WINNER' || challengeType === 'EXACT_SCORE'
          ? targetMatchId
          : undefined,
      creatorPredictedWinnerAbbr:
        challengeType === 'MATCH_WINNER' ? predictedWinnerAbbr : undefined,
      predictedWinnerAbbr:
        challengeType === 'MATCH_WINNER' ? predictedWinnerAbbr : undefined,
      creatorPredictedHomeScore:
        challengeType === 'EXACT_SCORE' ? Number(predictedHomeScore) : undefined,
      predictedHomeScore:
        challengeType === 'EXACT_SCORE' ? Number(predictedHomeScore) : undefined,
      creatorPredictedAwayScore:
        challengeType === 'EXACT_SCORE' ? Number(predictedAwayScore) : undefined,
      predictedAwayScore:
        challengeType === 'EXACT_SCORE' ? Number(predictedAwayScore) : undefined,
      creatorPredictedTotalGoals:
        challengeType === 'TOTAL_GOALS' ? Number(predictedTotalGoals) : undefined,
      predictedTotalGoals:
        challengeType === 'TOTAL_GOALS' ? Number(predictedTotalGoals) : undefined,
    };

    try {
      await createChallenge(payload).unwrap();
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.data?.message || 'Error al lanzar el reto');
    }
  };

  return (
    <div className="challenge-modal-overlay" onClick={onClose}>
      <div
        className="challenge-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="challenge-modal-title"
      >
        <header className="challenge-modal__header">
          <div className="challenge-modal__title-group">
            <span className="challenge-modal__title-icon">⚔️</span>
            <h2 id="challenge-modal-title" className="challenge-modal__title">
              Lanzar Nuevo Reto
            </h2>
          </div>
          <button
            type="button"
            className="challenge-modal__close-btn"
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            <X size={20} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="challenge-modal__body">
          {errorMsg && (
            <div className="challenge-card__feedback" style={{ background: 'rgba(239, 68, 68, 0.2)', borderColor: 'var(--color-danger)' }}>
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Seleccionar Invitados */}
          <div className="challenge-form-group">
            <label className="challenge-form-label">
              <span>1. ¿A quién retas?</span>
              <span className="challenge-form-label-hint">
                {selectedMembers.length} seleccionado{selectedMembers.length !== 1 ? 's' : ''}
              </span>
            </label>
            <div className="challenge-members-list">
              {availableMembers.map((m) => {
                const isSelected = selectedMembers.includes(m.id);
                return (
                  <div
                    key={m.id}
                    className={`challenge-member-chip ${
                      isSelected ? 'challenge-member-chip--selected' : ''
                    }`}
                    onClick={() => toggleMember(m.id)}
                  >
                    <UserAvatar src={m.avatarUrl} alt={m.alias} size="xs" />
                    <span className="challenge-member-chip__alias">{m.alias}</span>
                    {isSelected && <Check size={14} />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Tipo de Reto */}
          <div className="challenge-form-group">
            <label className="challenge-form-label">2. Tipo de Reto</label>
            <div className="challenge-type-grid">
              {CHALLENGE_TYPES.map((t) => {
                const isSelected = challengeType === t.type;
                return (
                  <button
                    key={t.type}
                    type="button"
                    className={`challenge-type-option ${
                      isSelected ? 'challenge-type-option--selected' : ''
                    }`}
                    onClick={() => setChallengeType(t.type)}
                  >
                    <span className="challenge-type-option__icon">{t.icon}</span>
                    <div>
                      <div className="challenge-type-option__title">{t.title}</div>
                      <div className="challenge-type-option__desc">{t.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Modalidad de Pago */}
          <div className="challenge-form-group">
            <label className="challenge-form-label">3. Modalidad de Pago</label>
            <div className="challenge-payout-toggle">
              <button
                type="button"
                className={`challenge-payout-btn ${
                  payoutMode === 'WINNER_TAKES_ALL'
                    ? 'challenge-payout-btn--selected-winner'
                    : ''
                }`}
                onClick={() => setPayoutMode('WINNER_TAKES_ALL')}
              >
                <span className="challenge-payout-btn__title">👑 El Rey Cobra</span>
                <span className="challenge-payout-btn__desc">
                  El 1.° cobra todo. Los demás le pagan.
                </span>
              </button>
              <button
                type="button"
                className={`challenge-payout-btn ${
                  payoutMode === 'LAST_PLACE_PAYS'
                    ? 'challenge-payout-btn--selected-loser'
                    : ''
                }`}
                onClick={() => setPayoutMode('LAST_PLACE_PAYS')}
              >
                <span className="challenge-payout-btn__title">🤡 El Último Paga</span>
                <span className="challenge-payout-btn__desc">
                  Solo el peor paga la apuesta a los demás.
                </span>
              </button>
            </div>
          </div>

          {/* 4. La Apuesta (Stakes) */}
          <div className="challenge-form-group">
            <label className="challenge-form-label" htmlFor="stakes-input">
              4. ¿Qué se apuestan?
            </label>
            <div className="challenge-stakes-wrapper">
              <input
                id="stakes-input"
                type="text"
                className="challenge-input"
                maxLength={200}
                placeholder="Ej: Unos tacos al pastor y un six de chelas"
                value={stakesDescription}
                onChange={(e) => setStakesDescription(e.target.value)}
              />
              <span className="challenge-stakes-counter">
                {stakesDescription.length}/200
              </span>
            </div>
          </div>

          {/* 5. Predicción requerida del creador (según tipo) */}
          {(challengeType === 'MATCH_WINNER' || challengeType === 'EXACT_SCORE') && (
            <div className="challenge-prediction-box">
              <label className="challenge-form-label">
                Partido seleccionado para el reto:
              </label>
              <select
                className="challenge-select"
                value={targetMatchId}
                onChange={(e) => {
                  setTargetMatchId(Number(e.target.value));
                  setPredictedWinnerAbbr('');
                }}
              >
                {weekMatches.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.homeTeam.displayName || m.homeTeam.name} vs{' '}
                    {m.awayTeam.displayName || m.awayTeam.name}
                  </option>
                ))}
              </select>

              {challengeType === 'MATCH_WINNER' && selectedMatch && (
                <div style={{ marginTop: '8px' }}>
                  <label className="challenge-form-label">Tu pronóstico de ganador:</label>
                  <div className="challenge-match-options">
                    <button
                      type="button"
                      className={`challenge-match-btn ${
                        predictedWinnerAbbr === selectedMatch.homeTeam.abbreviation
                          ? 'challenge-match-btn--selected'
                          : ''
                      }`}
                      onClick={() =>
                        setPredictedWinnerAbbr(selectedMatch.homeTeam.abbreviation)
                      }
                    >
                      {selectedMatch.homeTeam.abbreviation || 'Local'}
                    </button>
                    <button
                      type="button"
                      className={`challenge-match-btn ${
                        predictedWinnerAbbr === 'EMPATE'
                          ? 'challenge-match-btn--selected'
                          : ''
                      }`}
                      onClick={() => setPredictedWinnerAbbr('EMPATE')}
                    >
                      EMPATE
                    </button>
                    <button
                      type="button"
                      className={`challenge-match-btn ${
                        predictedWinnerAbbr === selectedMatch.awayTeam.abbreviation
                          ? 'challenge-match-btn--selected'
                          : ''
                      }`}
                      onClick={() =>
                        setPredictedWinnerAbbr(selectedMatch.awayTeam.abbreviation)
                      }
                    >
                      {selectedMatch.awayTeam.abbreviation || 'Visita'}
                    </button>
                  </div>
                </div>
              )}

              {challengeType === 'EXACT_SCORE' && selectedMatch && (
                <div style={{ marginTop: '8px' }}>
                  <label className="challenge-form-label">Tu marcador exacto:</label>
                  <div className="challenge-score-inputs">
                    <div className="challenge-score-box">
                      <span className="challenge-score-label">
                        {selectedMatch.homeTeam.abbreviation || 'Local'}
                      </span>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        className="challenge-input challenge-score-input"
                        value={predictedHomeScore}
                        onChange={(e) =>
                          setPredictedHomeScore(
                            e.target.value === '' ? '' : Number(e.target.value)
                          )
                        }
                      />
                    </div>
                    <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>-</span>
                    <div className="challenge-score-box">
                      <span className="challenge-score-label">
                        {selectedMatch.awayTeam.abbreviation || 'Visita'}
                      </span>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        className="challenge-input challenge-score-input"
                        value={predictedAwayScore}
                        onChange={(e) =>
                          setPredictedAwayScore(
                            e.target.value === '' ? '' : Number(e.target.value)
                          )
                        }
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {challengeType === 'TOTAL_GOALS' && (
            <div className="challenge-prediction-box">
              <label className="challenge-form-label" htmlFor="goals-input">
                Tu pronóstico de goles totales en la jornada:
              </label>
              <input
                id="goals-input"
                type="number"
                min="0"
                max="100"
                className="challenge-input"
                placeholder="Ej. 26"
                value={predictedTotalGoals}
                onChange={(e) =>
                  setPredictedTotalGoals(
                    e.target.value === '' ? '' : Number(e.target.value)
                  )
                }
              />
              <span className="challenge-form-label-hint">
                Recuerda la regla *Price is Right*: si la suma final de goles es menor a lo que pronosticaste, ¡te pasas y quedas descalificado!
              </span>
            </div>
          )}

          <footer className="challenge-modal__footer">
            <button
              type="button"
              className="challenge-btn challenge-btn--secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="challenge-btn challenge-btn--primary"
              disabled={isLoading}
            >
              <Swords size={16} />
              <span>{isLoading ? 'Lanzando Reto...' : '¡Lanzar Reto!'}</span>
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};
