import React from 'react';
import { Lock, Check, X } from 'lucide-react';
import type { Match, PickItem } from '../../types';
import './MatchPicker.css';

interface MatchPickerProps {
  match: Match;
  currentPick?: PickItem;
  allowsDraw?: boolean;
  isWeekLocked?: boolean;
  isSubmitting?: boolean;
  onSelectPick: (matchId: number, pickAbbr: string) => void;
}

export const MatchPicker: React.FC<MatchPickerProps> = ({
  match,
  currentPick,
  allowsDraw = true,
  isWeekLocked = false,
  isSubmitting = false,
  onSelectPick,
}) => {
  const isMatchStarted = match.statusState !== 'pre';
  const isMatchFinished = match.statusState === 'post';
  const isMatchLive = match.statusState === 'in';
  const isLocked = isWeekLocked || isMatchStarted;

  const homeAbbr = match.homeTeam.abbreviation;
  const awayAbbr = match.awayTeam.abbreviation;
  const selectedAbbr = currentPick?.pickAbbr;
  const winnerAbbr = match.winnerAbbr?.trim().toUpperCase();

  // Evaluación estricta de acierto o fallo
  const hasPick = Boolean(selectedAbbr);
  const isHit =
    hasPick &&
    (currentPick?.isHit === true ||
      (isMatchFinished && Boolean(winnerAbbr) && selectedAbbr === winnerAbbr));
  const isMiss =
    hasPick &&
    (currentPick?.isHit === false ||
      (isMatchFinished && Boolean(winnerAbbr) && selectedAbbr !== winnerAbbr));

  const handleClick = (abbr: string) => {
    if (isLocked || isSubmitting) return;
    if (selectedAbbr === abbr) return; // ya seleccionado
    onSelectPick(match.id, abbr);
  };

  const renderOptionBtn = (optionAbbr: string, label: string, sublabel: string) => {
    const isSelected = selectedAbbr === optionAbbr;
    const isActualWinner = isMatchFinished && winnerAbbr === optionAbbr;

    let btnClass = 'match-picker__btn';
    if (isSelected) {
      if (isHit) {
        btnClass += ' match-picker__btn--hit';
      } else if (isMiss) {
        btnClass += ' match-picker__btn--miss';
      } else {
        btnClass += ' match-picker__btn--selected';
      }
    } else if (isActualWinner && hasPick) {
      btnClass += ' match-picker__btn--winner-outcome';
    }

    return (
      <button
        type="button"
        disabled={isLocked}
        onClick={() => handleClick(optionAbbr)}
        className={btnClass}
        title={isSelected ? `Tu selección: ${optionAbbr}` : `Pronosticar ${optionAbbr}`}
      >
        <span className="match-picker__label">{label}</span>
        <span className="match-picker__sublabel">
          {isSelected && isHit
            ? '✓ Acertaste'
            : isSelected && isMiss
            ? '✗ Fallaste'
            : isActualWinner && !isSelected
            ? 'Ganador 🏆'
            : sublabel}
        </span>
        {isSelected && (
          <span
            className={`match-picker__check ${
              isHit
                ? 'match-picker__check--hit'
                : isMiss
                ? 'match-picker__check--miss'
                : ''
            }`}
          >
            {isHit ? <Check size={14} /> : isMiss ? <X size={14} /> : <Check size={14} />}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="match-picker-container">
      <div className={`match-picker ${isLocked ? 'match-picker--locked' : ''}`}>
        {/* Botón Local */}
        {renderOptionBtn(homeAbbr, homeAbbr, 'Local')}

        {/* Botón Empate */}
        {allowsDraw && renderOptionBtn('EMPATE', 'X', 'Empate')}

        {/* Botón Visita */}
        {renderOptionBtn(awayAbbr, awayAbbr, 'Visita')}

        {isLocked && !isMatchFinished && (
          <div className="match-picker__lock-indicator" title="Pronósticos bloqueados para este partido">
            <Lock size={12} />
          </div>
        )}
      </div>

      {/* Banner / Píldora de resultado y feedback visual */}
      {isHit && (
        <div className="match-picker__result-banner match-picker__result-banner--hit">
          <div className="match-picker__result-left">
            <span className="match-picker__result-badge match-picker__result-badge--hit">
              ✓ ¡ACIERTO! +1 PT
            </span>
            {currentPick?.isUpsetHit && (
              <span className="match-picker__result-tag match-picker__result-tag--upset">
                🔮 Sorpresa
              </span>
            )}
          </div>
          <span className="match-picker__result-text">
            Pronosticaste <strong>{selectedAbbr}</strong> y fue el ganador oficial
          </span>
        </div>
      )}

      {isMiss && (
        <div className="match-picker__result-banner match-picker__result-banner--miss">
          <div className="match-picker__result-left">
            <span className="match-picker__result-badge match-picker__result-badge--miss">
              ✗ FALLO (0 PTS)
            </span>
            {currentPick?.isHumillacion && (
              <span className="match-picker__result-tag match-picker__result-tag--humillacion">
                🤡 Humillado
              </span>
            )}
            {currentPick?.isSomnifero && (
              <span className="match-picker__result-tag match-picker__result-tag--somnifero">
                😴 Somnífero 0-0
              </span>
            )}
            {currentPick?.isEmpateFallido && (
              <span className="match-picker__result-tag match-picker__result-tag--empate">
                ⚡ Empate fallido
              </span>
            )}
          </div>
          <span className="match-picker__result-text">
            Elegiste <strong>{selectedAbbr}</strong> • Resultado oficial: <strong>{winnerAbbr}</strong>
          </span>
        </div>
      )}

      {isMatchFinished && !hasPick && (
        <div className="match-picker__result-banner match-picker__result-banner--none">
          <span className="match-picker__result-badge match-picker__result-badge--none">
            SIN PRONÓSTICO
          </span>
          <span className="match-picker__result-text">
            No registraste voto para este juego • Ganador: <strong>{winnerAbbr || 'Empate'}</strong>
          </span>
        </div>
      )}

      {isMatchLive && (
        <div className="match-picker__result-banner match-picker__result-banner--live">
          <span className="match-picker__result-badge match-picker__result-badge--live">
            ● EN JUEGO
          </span>
          <span className="match-picker__result-text">
            Marcador: {match.homeScore} - {match.awayScore} • Tu elección:{' '}
            <strong>{selectedAbbr || 'Ninguna'}</strong>
          </span>
        </div>
      )}

      {!isMatchFinished && !isMatchLive && isLocked && hasPick && (
        <div className="match-picker__result-banner match-picker__result-banner--locked">
          <span className="match-picker__result-badge match-picker__result-badge--locked">
            🔒 BLOQUEADO
          </span>
          <span className="match-picker__result-text">
            Tu pronóstico registrado: <strong>{selectedAbbr}</strong>
          </span>
        </div>
      )}
    </div>
  );
};
