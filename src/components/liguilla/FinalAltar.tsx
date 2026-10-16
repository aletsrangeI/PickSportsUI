import React from 'react';
import { Trophy, Crown, Lock } from 'lucide-react';
import type { LiguillaTeam } from '../../types';
import '../matches/MatchCard.css';
import '../picks/MatchPicker.css';

interface FinalAltarProps {
  finalist1?: LiguillaTeam;
  finalist2?: LiguillaTeam;
  selectedChampionId?: number;
  onSelectChampion: (team: LiguillaTeam) => void;
  isReadOnly?: boolean;
}

export const FinalAltar: React.FC<FinalAltarProps> = ({
  finalist1,
  finalist2,
  selectedChampionId,
  onSelectChampion,
  isReadOnly = false,
}) => {
  const triggerHaptic = () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(25);
      } catch {
        // Ignorar
      }
    }
  };

  const isFinalist1Champ = selectedChampionId === finalist1?.teamId;
  const isFinalist2Champ = selectedChampionId === finalist2?.teamId;

  const team1Classes = [
    'match-card__team',
    isFinalist1Champ ? 'match-card__team--winner' : '',
    isFinalist2Champ ? 'match-card__team--loser' : '',
  ].filter(Boolean).join(' ');

  const team2Classes = [
    'match-card__team match-card__team--away',
    isFinalist2Champ ? 'match-card__team--winner' : '',
    isFinalist1Champ ? 'match-card__team--loser' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className="final-altar">
      <div className="final-altar__header">
        <span className="final-altar__badge">
          <Crown size={14} className="final-altar__crown-icon" /> Fase 3: La Gran Final
        </span>
        <h3 className="final-altar__title">El Altar del Campeón</h3>
        <p className="final-altar__subtitle">
          Selecciona al equipo que levantará la Copa y se coronará Campeón (+50 pts).
        </p>
      </div>

      <div className="match-card liguilla-match-card liguilla-match-card--final">
        <div className="match-card__teams">
          {/* Finalista 1 */}
          {finalist1 && (
            <div className={team1Classes}>
              <div className="match-card__logo">
                {finalist1.logoUrl ? (
                  <img
                    src={finalist1.logoUrl}
                    alt={finalist1.shortName || finalist1.name}
                    className="match-card__logo-img"
                    loading="lazy"
                  />
                ) : (
                  <div className="match-card__logo-placeholder">
                    {(finalist1.shortName || finalist1.name)[0]}
                  </div>
                )}
              </div>
              <div className="liguilla-match-team-header">
                <span className="match-card__team-abbr">{finalist1.shortName || finalist1.name}</span>
                <span className="liguilla-match-seed">#{finalist1.seed}</span>
              </div>
              <span className="match-card__team-name">{finalist1.name}</span>
            </div>
          )}

          {/* Trofeo Central */}
          <div className="match-card__center liguilla-final-trophy-center">
            <Trophy size={42} className="liguilla-final-trophy-icon" />
            <div className="match-card__time">
              <span className="match-card__time-date">La Gran Final</span>
              <span className="match-card__time-hour">LIGA MX</span>
            </div>
            <div className="match-card__venue">Por el Título</div>
          </div>

          {/* Finalista 2 */}
          {finalist2 && (
            <div className={team2Classes}>
              <div className="match-card__logo">
                {finalist2.logoUrl ? (
                  <img
                    src={finalist2.logoUrl}
                    alt={finalist2.shortName || finalist2.name}
                    className="match-card__logo-img"
                    loading="lazy"
                  />
                ) : (
                  <div className="match-card__logo-placeholder">
                    {(finalist2.shortName || finalist2.name)[0]}
                  </div>
                )}
              </div>
              <div className="liguilla-match-team-header">
                <span className="match-card__team-abbr">{finalist2.shortName || finalist2.name}</span>
                <span className="liguilla-match-seed">#{finalist2.seed}</span>
              </div>
              <span className="match-card__team-name">{finalist2.name}</span>
            </div>
          )}
        </div>

        {/* Cápsula de selección de Campeón */}
        <div className="match-picker-container">
          {isReadOnly && (
            <div className="match-picker__lock-indicator" title="Pronóstico confirmado">
              <Lock size={12} strokeWidth={2.5} />
              <span>Confirmado</span>
            </div>
          )}
          <div className="match-picker">
            {finalist1 && (
              <button
                type="button"
                disabled={isReadOnly}
                onClick={() => {
                  triggerHaptic();
                  onSelectChampion(finalist1);
                }}
                className={`match-picker__btn ${isFinalist1Champ ? 'match-picker__btn--selected liguilla-champion-selected' : ''}`}
              >
                <span className="match-picker__label">{finalist1.shortName || finalist1.name}</span>
                <span className="match-picker__sublabel">CAMPEÓN</span>
                {isFinalist1Champ && (
                  <span className="match-picker__check match-picker__check--hit">
                    <Crown size={14} />
                  </span>
                )}
              </button>
            )}

            {finalist2 && (
              <button
                type="button"
                disabled={isReadOnly}
                onClick={() => {
                  triggerHaptic();
                  onSelectChampion(finalist2);
                }}
                className={`match-picker__btn ${isFinalist2Champ ? 'match-picker__btn--selected liguilla-champion-selected' : ''}`}
              >
                <span className="match-picker__label">{finalist2.shortName || finalist2.name}</span>
                <span className="match-picker__sublabel">CAMPEÓN</span>
                {isFinalist2Champ && (
                  <span className="match-picker__check match-picker__check--hit">
                    <Crown size={14} />
                  </span>
                )}
              </button>
            )}
          </div>

          <div className="liguilla-picker-helper">
            Selecciona al Campeón de la Liga MX (+50 pts)
          </div>
        </div>
      </div>
    </div>
  );
};
