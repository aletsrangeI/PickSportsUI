import React from 'react';
import { Zap, Check, Lock } from 'lucide-react';
import type { LiguillaNode, LiguillaTeam } from '../../types';
import '../matches/MatchCard.css';
import '../picks/MatchPicker.css';

interface ArenaClashViewerProps {
  nodes: LiguillaNode[];
  selectedQfWinners: Record<number, number>; // nodeNumber (1..4) -> teamId
  onSelectWinner: (nodeNumber: number, team: LiguillaTeam) => void;
  isReadOnly?: boolean;
}

export const ArenaClashViewer: React.FC<ArenaClashViewerProps> = ({
  nodes,
  selectedQfWinners,
  onSelectWinner,
  isReadOnly = false,
}) => {
  const triggerHaptic = () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(15);
      } catch {
        // Ignorar si el navegador no permite vibración
      }
    }
  };

  const qfNodes = nodes.filter((n) => n.nodeNumber >= 1 && n.nodeNumber <= 4);

  return (
    <div className="arena-clash">
      <div className="arena-clash__header">
        <span className="arena-clash__badge">
          <Zap size={14} className="arena-clash__badge-icon" /> Fase 1: Cuartos de Final
        </span>
        <h3 className="arena-clash__title">Duelos de Cuartos de Final</h3>
        <p className="arena-clash__subtitle">
          Selecciona al equipo que ganará el marcador global y avanzará a Semifinales.
        </p>
      </div>

      <div className="arena-clash__grid">
        {qfNodes.map((node) => {
          const selectedTeamId = selectedQfWinners[node.nodeNumber];
          const teamA = node.teamA;
          const teamB = node.teamB;

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
            <div key={node.id} className="match-card liguilla-match-card">
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

                {/* Centro: Serie / Ida y Vuelta */}
                <div className="match-card__center">
                  <div className="match-card__time">
                    <span className="match-card__time-date">Serie {node.nodeNumber}</span>
                    <span className="match-card__time-hour">Ida y Vuelta</span>
                  </div>
                  <div className="match-card__venue">Cuartos de Final</div>
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
                        onSelectWinner(node.nodeNumber, teamA);
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
                        onSelectWinner(node.nodeNumber, teamB);
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
                  Selecciona el equipo que avanzará a Semifinales
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
