import React, { useState } from 'react';
import type { Challenge, Match, RespondChallengeRequest } from '../../types';
import { useRespondChallengeMutation } from '../../services/api';
import { UserAvatar } from '../common/UserAvatar';
import {
  Swords,
  X,
  Check,
  AlertTriangle,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import './CreateChallengeModal.css';

interface RespondChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  challenge: Challenge | null;
  weekMatches: Match[];
}

export const RespondChallengeModal: React.FC<RespondChallengeModalProps> = ({
  isOpen,
  onClose,
  challenge,
  weekMatches,
}) => {
  const [respondChallenge, { isLoading }] = useRespondChallengeMutation();

  const [predictedWinnerAbbr, setPredictedWinnerAbbr] = useState<string>('');
  const [predictedHomeScore, setPredictedHomeScore] = useState<number | ''>('');
  const [predictedAwayScore, setPredictedAwayScore] = useState<number | ''>('');
  const [predictedTotalGoals, setPredictedTotalGoals] = useState<number | ''>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !challenge) return null;

  // Participantes aceptados actuales
  const acceptedParticipants = challenge.participants.filter(
    (p) => p.status === 'ACCEPTED'
  );

  const targetMatch = weekMatches.find((m) => m.id === challenge.targetMatchId);
  const homeAbbr = targetMatch?.homeTeam.abbreviation || 'LOC';
  const awayAbbr = targetMatch?.awayTeam.abbreviation || 'VIS';

  // Verificar opciones ocupadas para MATCH_WINNER
  const getMatchWinnerOccupant = (abbr: string): string | null => {
    const occupant = acceptedParticipants.find(
      (p) => p.predictedWinnerAbbr?.toUpperCase() === abbr.toUpperCase()
    );
    return occupant ? occupant.alias : null;
  };

  // Verificar opciones ocupadas para EXACT_SCORE
  const getExactScoreOccupant = (h: number, a: number): string | null => {
    const occupant = acceptedParticipants.find(
      (p) => p.predictedHomeScore === h && p.predictedAwayScore === a
    );
    return occupant ? occupant.alias : null;
  };

  // Verificar opciones ocupadas para TOTAL_GOALS
  const getTotalGoalsOccupant = (goals: number): string | null => {
    const occupant = acceptedParticipants.find(
      (p) => p.predictedTotalGoals === goals
    );
    return occupant ? occupant.alias : null;
  };

  // Validaciones en vivo
  let duplicateWarning: string | null = null;
  if (challenge.challengeType === 'EXACT_SCORE') {
    if (predictedHomeScore !== '' && predictedAwayScore !== '') {
      const occupant = getExactScoreOccupant(
        Number(predictedHomeScore),
        Number(predictedAwayScore)
      );
      if (occupant) {
        duplicateWarning = `El marcador ${predictedHomeScore}-${predictedAwayScore} ya está ocupado por ${occupant}. Debes elegir otro.`;
      }
    }
  } else if (challenge.challengeType === 'TOTAL_GOALS') {
    if (predictedTotalGoals !== '') {
      const occupant = getTotalGoalsOccupant(Number(predictedTotalGoals));
      if (occupant) {
        duplicateWarning = `La cifra de ${predictedTotalGoals} goles ya está ocupada por ${occupant}. Debes elegir otra cantidad.`;
      }
    }
  }

  const handleAction = async (action: 'ACCEPT' | 'DECLINE') => {
    setErrorMsg(null);

    if (action === 'ACCEPT') {
      if (challenge.challengeType === 'MATCH_WINNER') {
        if (!predictedWinnerAbbr) {
          setErrorMsg('Selecciona una opción disponible para aceptar.');
          return;
        }
        if (getMatchWinnerOccupant(predictedWinnerAbbr)) {
          setErrorMsg('Esa opción ya fue ocupada por otro participante.');
          return;
        }
      }

      if (challenge.challengeType === 'EXACT_SCORE') {
        if (predictedHomeScore === '' || predictedAwayScore === '') {
          setErrorMsg('Ingresa tu marcador exacto.');
          return;
        }
        if (getExactScoreOccupant(Number(predictedHomeScore), Number(predictedAwayScore))) {
          setErrorMsg(duplicateWarning || 'Ese marcador ya está ocupado.');
          return;
        }
      }

      if (challenge.challengeType === 'TOTAL_GOALS') {
        if (predictedTotalGoals === '' || Number(predictedTotalGoals) < 0) {
          setErrorMsg('Ingresa tu predicción de goles.');
          return;
        }
        if (getTotalGoalsOccupant(Number(predictedTotalGoals))) {
          setErrorMsg(duplicateWarning || 'Esa cantidad de goles ya está ocupada.');
          return;
        }
      }
    }

    const payload: RespondChallengeRequest = {
      quinielaId: challenge.quinielaId,
      challengeId: challenge.id,
      action,
      response: action,
      predictedWinnerAbbr:
        action === 'ACCEPT' && challenge.challengeType === 'MATCH_WINNER'
          ? predictedWinnerAbbr
          : undefined,
      predictedHomeScore:
        action === 'ACCEPT' && challenge.challengeType === 'EXACT_SCORE'
          ? Number(predictedHomeScore)
          : undefined,
      predictedAwayScore:
        action === 'ACCEPT' && challenge.challengeType === 'EXACT_SCORE'
          ? Number(predictedAwayScore)
          : undefined,
      predictedTotalGoals:
        action === 'ACCEPT' && challenge.challengeType === 'TOTAL_GOALS'
          ? Number(predictedTotalGoals)
          : undefined,
    };

    try {
      await respondChallenge(payload).unwrap();
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.data?.message || 'Error al responder al reto');
    }
  };

  return (
    <div className="challenge-modal-overlay" onClick={onClose}>
      <div
        className="challenge-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="respond-challenge-modal-title"
      >
        <header className="challenge-modal__header">
          <div className="challenge-modal__title-group">
            <span className="challenge-modal__title-icon">⚔️</span>
            <h2 id="respond-challenge-modal-title" className="challenge-modal__title">
              Responder Reto
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

        <div className="challenge-modal__body">
          {errorMsg && (
            <div
              className="challenge-card__feedback"
              style={{
                background: 'rgba(239, 68, 68, 0.2)',
                borderColor: 'var(--color-danger)',
              }}
            >
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Información del Reto */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserAvatar
                src={challenge.creatorAvatarUrl}
                alt={challenge.creatorAlias}
                size="sm"
              />
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Reto lanzado por <strong>{challenge.creatorAlias}</strong>
              </span>
            </div>

            <div style={{ marginTop: '4px' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Apuesta en juego:
              </span>
              <div
                style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: 'var(--color-accent)',
                }}
              >
                "{challenge.stakesDescription}"
              </div>
            </div>

            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Modalidad:{' '}
              <strong>
                {challenge.payoutMode === 'WINNER_TAKES_ALL'
                  ? '👑 El Rey Cobra (El 1.° se lleva todo)'
                  : '🤡 El Último Paga (El peor invita la apuesta)'}
              </strong>
            </div>
          </div>

          {/* Opciones tomadas / selección requerida si aplica */}
          {challenge.challengeType === 'MATCH_WINNER' && (
            <div className="challenge-prediction-box">
              <label className="challenge-form-label">
                Elige tu pronóstico para: {challenge.targetMatchLabel || `${homeAbbr} vs ${awayAbbr}`}
              </label>

              <div className="challenge-match-options">
                {/* Opción Local */}
                {(() => {
                  const occupant = getMatchWinnerOccupant(homeAbbr);
                  const isOccupied = !!occupant;
                  const isSelected = predictedWinnerAbbr === homeAbbr;
                  return (
                    <button
                      type="button"
                      disabled={isOccupied}
                      className={`challenge-match-btn ${
                        isSelected ? 'challenge-match-btn--selected' : ''
                      }`}
                      onClick={() => setPredictedWinnerAbbr(homeAbbr)}
                    >
                      <div>{homeAbbr}</div>
                      {isOccupied && (
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                          Ocupado por {occupant}
                        </div>
                      )}
                    </button>
                  );
                })()}

                {/* Opción Empate */}
                {(() => {
                  const occupant = getMatchWinnerOccupant('EMPATE');
                  const isOccupied = !!occupant;
                  const isSelected = predictedWinnerAbbr === 'EMPATE';
                  return (
                    <button
                      type="button"
                      disabled={isOccupied}
                      className={`challenge-match-btn ${
                        isSelected ? 'challenge-match-btn--selected' : ''
                      }`}
                      onClick={() => setPredictedWinnerAbbr('EMPATE')}
                    >
                      <div>EMPATE</div>
                      {isOccupied && (
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                          Ocupado por {occupant}
                        </div>
                      )}
                    </button>
                  );
                })()}

                {/* Opción Visita */}
                {(() => {
                  const occupant = getMatchWinnerOccupant(awayAbbr);
                  const isOccupied = !!occupant;
                  const isSelected = predictedWinnerAbbr === awayAbbr;
                  return (
                    <button
                      type="button"
                      disabled={isOccupied}
                      className={`challenge-match-btn ${
                        isSelected ? 'challenge-match-btn--selected' : ''
                      }`}
                      onClick={() => setPredictedWinnerAbbr(awayAbbr)}
                    >
                      <div>{awayAbbr}</div>
                      {isOccupied && (
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                          Ocupado por {occupant}
                        </div>
                      )}
                    </button>
                  );
                })()}
              </div>
            </div>
          )}

          {challenge.challengeType === 'EXACT_SCORE' && (
            <div className="challenge-prediction-box">
              <label className="challenge-form-label">
                Predice tu marcador para: {challenge.targetMatchLabel || `${homeAbbr} vs ${awayAbbr}`}
              </label>

              {/* Lista de marcadores ocupados */}
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Marcadores ya ocupados en este reto:
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                  {acceptedParticipants.map((p) => (
                    <span
                      key={p.id}
                      style={{
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                        background: 'rgba(255, 255, 255, 0.08)',
                        fontSize: '0.72rem',
                      }}
                    >
                      {p.alias}: <strong>{p.predictedHomeScore}-{p.predictedAwayScore}</strong>
                    </span>
                  ))}
                </div>
              </div>

              <div className="challenge-score-inputs" style={{ marginTop: '8px' }}>
                <div className="challenge-score-box">
                  <span className="challenge-score-label">{homeAbbr}</span>
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
                  <span className="challenge-score-label">{awayAbbr}</span>
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

              {duplicateWarning && (
                <div style={{ color: 'var(--color-danger)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertTriangle size={14} />
                  <span>{duplicateWarning}</span>
                </div>
              )}
            </div>
          )}

          {challenge.challengeType === 'TOTAL_GOALS' && (
            <div className="challenge-prediction-box">
              <label className="challenge-form-label" htmlFor="respond-goals-input">
                Tu pronóstico de goles totales en la jornada:
              </label>

              {/* Lista de goles ya ocupados */}
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Predicciones ya tomadas en este reto:
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                  {acceptedParticipants.map((p) => (
                    <span
                      key={p.id}
                      style={{
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                        background: 'rgba(255, 255, 255, 0.08)',
                        fontSize: '0.72rem',
                      }}
                    >
                      {p.alias}: <strong>{p.predictedTotalGoals} goles</strong>
                    </span>
                  ))}
                </div>
              </div>

              <input
                id="respond-goals-input"
                type="number"
                min="0"
                max="100"
                className="challenge-input"
                placeholder="Ej. 27"
                value={predictedTotalGoals}
                onChange={(e) =>
                  setPredictedTotalGoals(
                    e.target.value === '' ? '' : Number(e.target.value)
                  )
                }
              />

              {duplicateWarning && (
                <div style={{ color: 'var(--color-danger)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertTriangle size={14} />
                  <span>{duplicateWarning}</span>
                </div>
              )}
            </div>
          )}

          {/* Para WEEKLY_RANK, GENERAL_RANK y SUDDEN_DEATH */}
          {(challenge.challengeType === 'WEEKLY_RANK' ||
            challenge.challengeType === 'GENERAL_RANK' ||
            challenge.challengeType === 'SUDDEN_DEATH') && (
            <div
              style={{
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
              }}
            >
              Este reto utiliza tus pronósticos regulares de la quiniela. No necesitas ingresar predicciones adicionales; solo confirma tu participación antes del bloqueo de la jornada.
            </div>
          )}
        </div>

        <footer className="challenge-modal__footer" style={{ justifyContent: 'space-between' }}>
          <button
            type="button"
            className="challenge-btn challenge-btn--secondary"
            disabled={isLoading}
            onClick={() => handleAction('DECLINE')}
            title="Declinar amablemente este reto"
          >
            <span>Pasar del Reto</span>
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="challenge-btn challenge-btn--secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              Cerrar
            </button>
            <button
              type="button"
              className="challenge-btn challenge-btn--primary"
              disabled={isLoading || !!duplicateWarning}
              onClick={() => handleAction('ACCEPT')}
            >
              <Swords size={16} />
              <span>{isLoading ? 'Aceptando...' : '¡Aceptar Reto!'}</span>
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};
