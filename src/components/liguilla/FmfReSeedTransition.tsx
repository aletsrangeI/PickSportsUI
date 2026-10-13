import React from 'react';
import { Sparkles, Check, Lock } from 'lucide-react';
import type { LiguillaTeam } from '../../types';
import '../matches/MatchCard.css';
import '../picks/MatchPicker.css';

interface FmfReSeedTransitionProps {
  selectedQfTeams: LiguillaTeam[];
  selectedSfWinners: Record<number, number>; // 1 (Semi1) -> teamId, 2 (Semi2) -> teamId
  onSelectSfWinner: (semiIndex: number, team: LiguillaTeam) => void;
  isReadOnly?: boolean;
}

export const FmfReSeedTransition: React.FC<FmfReSeedTransitionProps> = ({
  selectedQfTeams,
  selectedSfWinners,
  onSelectSfWinner,
  isReadOnly = false,
}) => {
  const triggerHaptic = () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(15);
      } catch {
        // Ignorar
      }
    }
  };

  // Re-sembrado dinámico por posición en la tabla
  const sorted = [...selectedQfTeams].sort((a, b) => a.seed - b.seed);

  const semi1 = {
    top: sorted[0],
    bottom: sorted[3],
  };

  const semi2 = {
    top: sorted[1],
    bottom: sorted[2],
  };

  // Sin leyendas de reglas de negocio en la UI
  const matchups = [
    { id: 1, label: 'Semifinal 1', teamA: semi1.top, teamB: semi1.bottom },
    { id: 2, label: 'Semifinal 2', teamA: semi2.top, teamB: semi2.bottom },
  ];

  return (
    <div className="reseed-transition">
      <div className="reseed-transition__header">
        <span className="reseed-transition__badge">
          <Sparkles size={14} className="reseed-transition__badge-icon" /> Fase 2: Semifinales
        </span>
        <h3 className="reseed-transition__title">Duelos de Semifinales</h3>
        <p className="reseed-transition__desc">
          Selecciona a los dos equipos que disputarán la Gran Final.
        </p>
      </div>

      <div className="reseed-transition__grid">
        {matchups.map((matchup) => {
          const selectedTeamId = selectedSfWinners[matchup.id];
          const teamA = matchup.teamA;
          const teamB = matchup.teamB;

          const isTeamAWinner = selectedTeamId === teamA?.teamId;
          const isTeamBWinner = selectedTeamId === teamB?.teamId;

          const teamAClasses = [
            'match-card__team',
            isTeamAWinner ? 'match-card__team--winner' : '',
            isTeamBWinner ? 'match-card__team--loser' : '',
          ].filter(Boolean).join(' ');

          const teamBClasses = [
            'match-card__team match-card__team--away',
            isTeamBWinner ? 'match-card__team--winner' : '',
            isTeamAWinner ? 'match-card__team--loser' : '',
          ].filter(Boolean).join(' ');

          return (
            <div key={matchup.id} className="match-card liguilla-match-card">
              {/* Fila de Equipos (Homologada con MatchCard de Quiniela) */}
              <div className="match-card__teams">
                {/* Equipo A */}
                {teamA && (
                  <div className={teamAClasses}>
                    <div className="match-card__logo">
                      {teamA.logoUrl ? (
                        <img
                          src={teamA.logoUrl}
                          alt={teamA.shortName || teamA.name}
                          className="match-card__logo-img"
                          loading="lazy"
                        />
                      ) : (
                        <div className="match-card__logo-placeholder">
                          {(teamA.shortName || teamA.name)[0]}
                        </div>
                      )}
                    </div>
                    <div className="liguilla-match-team-header">
                      <span className="match-card__team-abbr">{teamA.shortName || teamA.name}</span>
                      <span className="liguilla-match-seed">#{teamA.seed}</span>
                    </div>
                    <span className="match-card__team-name">{teamA.name}</span>
                  </div>
                )}

                {/* Centro: Semifinal X / Ida y Vuelta */}
                <div className="match-card__center">
                  <div className="match-card__time">
                    <span className="match-card__time-date">{matchup.label}</span>
                    <span className="match-card__time-hour">Ida y Vuelta</span>
                  </div>
                  <div className="match-card__venue">Semifinales</div>
                </div>

                {/* Equipo B */}
                {teamB && (
                  <div className={teamBClasses}>
                    <div className="match-card__logo">
                      {teamB.logoUrl ? (
                        <img
                          src={teamB.logoUrl}
                          alt={teamB.shortName || teamB.name}
                          className="match-card__logo-img"
                          loading="lazy"
                        />
                      ) : (
                        <div className="match-card__logo-placeholder">
                          {(teamB.shortName || teamB.name)[0]}
                        </div>
                      )}
                    </div>
                    <div className="liguilla-match-team-header">
                      <span className="match-card__team-abbr">{teamB.shortName || teamB.name}</span>
                      <span className="liguilla-match-seed">#{teamB.seed}</span>
                    </div>
                    <span className="match-card__team-name">{teamB.name}</span>
                  </div>
                )}
              </div>

              {/* Cápsula Match Picker (Homologada con MatchPicker) */}
              <div className="match-picker-container">
                {isReadOnly && (
                  <div className="match-picker__lock-indicator" title="Pronóstico confirmado">
                    <Lock size={12} strokeWidth={2.5} />
                    <span>Confirmado</span>
                  </div>
                )}
                <div className="match-picker">
                  {/* Botón Equipo A */}
                  {teamA && (
                    <button
                      type="button"
                      disabled={isReadOnly}
                      onClick={() => {
                        triggerHaptic();
                        onSelectSfWinner(matchup.id, teamA);
                      }}
                      className={`match-picker__btn ${isTeamAWinner ? 'match-picker__btn--selected' : ''}`}
                    >
                      <span className="match-picker__label">{teamA.shortName || teamA.name}</span>
                      <span className="match-picker__sublabel">LOCAL</span>
                      {isTeamAWinner && (
                        <span className="match-picker__check match-picker__check--hit">
                          <Check size={14} />
                        </span>
                      )}
                    </button>
                  )}

                  {/* Botón Equipo B */}
                  {teamB && (
                    <button
                      type="button"
                      disabled={isReadOnly}
                      onClick={() => {
                        triggerHaptic();
                        onSelectSfWinner(matchup.id, teamB);
                      }}
                      className={`match-picker__btn ${isTeamBWinner ? 'match-picker__btn--selected' : ''}`}
                    >
                      <span className="match-picker__label">{teamB.shortName || teamB.name}</span>
                      <span className="match-picker__sublabel">VISITA</span>
                      {isTeamBWinner && (
                        <span className="match-picker__check match-picker__check--hit">
                          <Check size={14} />
                        </span>
                      )}
                    </button>
                  )}
                </div>

                <div className="liguilla-picker-helper">
                  Selecciona el equipo que avanzará a la Gran Final
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
