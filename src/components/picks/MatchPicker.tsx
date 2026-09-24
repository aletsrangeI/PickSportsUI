import React from 'react';
import { Lock, Check } from 'lucide-react';
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
  const isLocked = isWeekLocked || isMatchStarted;

  const homeAbbr = match.homeTeam.abbreviation;
  const awayAbbr = match.awayTeam.abbreviation;
  const selectedAbbr = currentPick?.pickAbbr;

  const isHomeSelected = selectedAbbr === homeAbbr;
  const isDrawSelected = selectedAbbr === 'EMPATE';
  const isAwaySelected = selectedAbbr === awayAbbr;

  const handleClick = (abbr: string) => {
    if (isLocked || isSubmitting) return;
    if (selectedAbbr === abbr) return; // ya seleccionado
    onSelectPick(match.id, abbr);
  };

  return (
    <div className={`match-picker ${isLocked ? 'match-picker--locked' : ''}`}>
      {/* Botón Local */}
      <button
        type="button"
        disabled={isLocked}
        onClick={() => handleClick(homeAbbr)}
        className={`match-picker__btn match-picker__btn--home ${
          isHomeSelected ? 'match-picker__btn--selected' : ''
        }`}
        title={`Pronosticar victoria de ${match.homeTeam.displayName}`}
      >
        <span className="match-picker__label">{homeAbbr}</span>
        <span className="match-picker__sublabel">Local</span>
        {isHomeSelected && (
          <span className="match-picker__check">
            <Check size={14} />
          </span>
        )}
      </button>

      {/* Botón Empate (solo fútbol o deportes con empate) */}
      {allowsDraw && (
        <button
          type="button"
          disabled={isLocked}
          onClick={() => handleClick('EMPATE')}
          className={`match-picker__btn match-picker__btn--draw ${
            isDrawSelected ? 'match-picker__btn--selected' : ''
          }`}
          title="Pronosticar Empate (X)"
        >
          <span className="match-picker__label">X</span>
          <span className="match-picker__sublabel">Empate</span>
          {isDrawSelected && (
            <span className="match-picker__check">
              <Check size={14} />
            </span>
          )}
        </button>
      )}

      {/* Botón Visita */}
      <button
        type="button"
        disabled={isLocked}
        onClick={() => handleClick(awayAbbr)}
        className={`match-picker__btn match-picker__btn--away ${
          isAwaySelected ? 'match-picker__btn--selected' : ''
        }`}
        title={`Pronosticar victoria de ${match.awayTeam.displayName}`}
      >
        <span className="match-picker__label">{awayAbbr}</span>
        <span className="match-picker__sublabel">Visita</span>
        {isAwaySelected && (
          <span className="match-picker__check">
            <Check size={14} />
          </span>
        )}
      </button>

      {isLocked && (
        <div className="match-picker__lock-indicator" title="Pronósticos bloqueados para este partido">
          <Lock size={12} />
        </div>
      )}
    </div>
  );
};
