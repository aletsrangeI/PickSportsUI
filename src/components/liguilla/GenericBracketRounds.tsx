import React from 'react';
import { Zap, Check, Lock, Crown, Shield } from 'lucide-react';
import type { LiguillaNode, LiguillaRound, LiguillaTeam } from '../../types';
import type { GenericBracketState } from './useLiguillaGenericBracket';
import '../matches/MatchCard.css';
import '../picks/MatchPicker.css';
import './GenericBracketRounds.css';

const ROUND_TITLES: Record<string, string> = {
  R1: 'Primera Ronda',
  R2: 'Segunda Ronda',
  CF: 'Final de Conferencia',
  FINAL: 'Gran Final',
  WC: 'Wild Card',
  DIV: 'Divisional',
  CONF: 'Campeonato de Conferencia',
  SB: 'Super Bowl',
  R16: 'Octavos de Final',
  QF: 'Cuartos de Final',
  SF: 'Semifinales',
};

const FORMAT_SUBTITLES: Record<string, string> = {
  NHL_BEST_OF_7: 'Serie al mejor de 7',
  NFL_RESEEDED_SINGLE_GAME: 'Partido único',
  UEFA_TWO_LEG: 'Ida y vuelta (final a partido único)',
};

const formatSubtitleOf = (formatCode?: string | null): string =>
  formatCode ? (FORMAT_SUBTITLES[formatCode] ?? '') : '';

export const roundTitleOf = (code: string): string => ROUND_TITLES[code] ?? code;

const triggerHaptic = () => {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(15);
    } catch {
      // Ignorar si el navegador no permite vibración
    }
  }
};

interface TeamLogoProps {
  team: LiguillaTeam;
  className: string;
  imgClassName: string;
}

const TeamLogo: React.FC<TeamLogoProps> = ({ team, className, imgClassName }) => (
  <div className={className}>
    {team.logoUrl ? (
      <img src={team.logoUrl} alt={team.shortName || team.name} className={imgClassName} loading="lazy" />
    ) : (
      <Shield size={18} />
    )}
  </div>
);

interface CandidateGridProps {
  roundCode: string;
  teams: LiguillaTeam[];
  selectedIds: number[];
  isFull: boolean;
  isReadOnly: boolean;
  byeIds: Set<number>;
  onSelect: (roundCode: string, teamId: number) => void;
}

const CandidateGrid: React.FC<CandidateGridProps> = ({
  roundCode,
  teams,
  selectedIds,
  isFull,
  isReadOnly,
  byeIds,
  onSelect,
}) => {
  if (teams.length === 0) {
    return <p className="generic-bracket__empty">Completa la ronda anterior para ver los equipos disponibles.</p>;
  }
  return (
    <div className="generic-bracket__candidates">
      {teams.map((team) => {
        const isSelected = selectedIds.includes(team.teamId);
        const isBlocked = !isSelected && isFull;
        const classes = [
          'generic-bracket__candidate',
          isSelected ? 'generic-bracket__candidate--selected' : '',
          isBlocked ? 'generic-bracket__candidate--dimmed' : '',
        ]
          .filter(Boolean)
          .join(' ');
        return (
          <button
            key={team.teamId}
            type="button"
            disabled={isReadOnly || isBlocked}
            className={classes}
            onClick={() => {
              triggerHaptic();
              onSelect(roundCode, team.teamId);
            }}
          >
            <TeamLogo team={team} className="generic-bracket__candidate-logo" imgClassName="generic-bracket__candidate-logo-img" />
            <span className="generic-bracket__candidate-name">{team.shortName || team.name}</span>
            <span className="generic-bracket__candidate-seed">
              #{team.seed}
              {byeIds.has(team.teamId) ? ' · Descanso' : ''}
            </span>
            {isSelected && (
              <span className="generic-bracket__candidate-check">
                <Check size={14} />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

interface MatchSideProps {
  team: LiguillaTeam;
  isAway?: boolean;
  isWinner: boolean;
  isLoser: boolean;
}

const MatchSide: React.FC<MatchSideProps> = ({ team, isAway = false, isWinner, isLoser }) => {
  const classes = [
    'match-card__team',
    isAway ? 'match-card__team--away' : '',
    isWinner ? 'match-card__team--winner' : '',
    isLoser ? 'match-card__team--loser' : '',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <div className={classes}>
      <TeamLogo team={team} className="match-card__logo" imgClassName="match-card__logo-img" />
      <div className="liguilla-match-team-header">
        <span className="match-card__team-abbr">{team.shortName || team.name}</span>
        <span className="liguilla-match-seed">#{team.seed}</span>
      </div>
      <span className="match-card__team-name">{team.name}</span>
    </div>
  );
};

interface FirstRoundCardProps {
  node: LiguillaNode;
  round: LiguillaRound;
  selectedIds: number[];
  isReadOnly: boolean;
  onSelect: (roundCode: string, teamId: number) => void;
}

const FirstRoundCard: React.FC<FirstRoundCardProps> = ({ node, round, selectedIds, isReadOnly, onSelect }) => {
  const { teamA, teamB } = node;
  const isAWinner = Boolean(teamA && selectedIds.includes(teamA.teamId));
  const isBWinner = Boolean(teamB && selectedIds.includes(teamB.teamId));

  const renderButton = (team: LiguillaTeam, isSelected: boolean) => (
    <button
      type="button"
      disabled={isReadOnly}
      onClick={() => {
        triggerHaptic();
        onSelect(round.code, team.teamId);
      }}
      className={`match-picker__btn ${isSelected ? 'match-picker__btn--selected' : ''}`}
    >
      <span className="match-picker__label">{team.shortName || team.name}</span>
      <span className="match-picker__sublabel">#{team.seed}</span>
      {isSelected && (
        <span className="match-picker__check match-picker__check--hit">
          <Check size={14} />
        </span>
      )}
    </button>
  );

  return (
    <div className="match-card liguilla-match-card generic-bracket__card">
      <div className="match-card__teams">
        {teamA && <MatchSide team={teamA} isWinner={isAWinner} isLoser={isBWinner} />}
        <div className="match-card__center">
          <div className="match-card__time">
            <span className="match-card__time-date">Cruce {node.nodeNumber}</span>
          </div>
          <div className="match-card__venue">{roundTitleOf(round.code)}</div>
        </div>
        {teamB && <MatchSide team={teamB} isAway isWinner={isBWinner} isLoser={isAWinner} />}
      </div>

      <div className="match-picker-container">
        {isReadOnly && (
          <div className="match-picker__lock-indicator" title="Pronóstico confirmado">
            <Lock size={12} strokeWidth={2.5} />
            <span>Confirmado</span>
          </div>
        )}
        <div className="match-picker">
          {teamA && renderButton(teamA, isAWinner)}
          {teamB && renderButton(teamB, isBWinner)}
        </div>
      </div>
    </div>
  );
};

interface GenericPicksSummaryProps {
  bracket: GenericBracketState;
}

/** Vista de lectura de los picks confirmados, una fila por ronda. */
export const GenericPicksSummary: React.FC<GenericPicksSummaryProps> = ({ bracket }) => (
  <div className="generic-bracket generic-bracket--summary">
    {bracket.rounds.map((round) => {
      const teams = (bracket.picksByRound[round.code] ?? [])
        .map((id) => bracket.teamMap[id])
        .filter((t): t is LiguillaTeam => Boolean(t));
      return (
        <section key={round.code} className="generic-bracket__round">
          <h3 className="generic-bracket__title">{roundTitleOf(round.code)}</h3>
          <div className="generic-bracket__candidates">
            {teams.length === 0 ? (
              <p className="generic-bracket__empty">Sin picks en esta ronda.</p>
            ) : (
              teams.map((team) => (
                <div key={team.teamId} className="generic-bracket__candidate generic-bracket__candidate--selected">
                  <TeamLogo team={team} className="generic-bracket__candidate-logo" imgClassName="generic-bracket__candidate-logo-img" />
                  <span className="generic-bracket__candidate-name">{team.shortName || team.name}</span>
                  <span className="generic-bracket__candidate-seed">#{team.seed}</span>
                </div>
              ))
            )}
          </div>
        </section>
      );
    })}
  </div>
);

interface GenericBracketRoundsProps {
  formatCode?: string | null;
  nodes: LiguillaNode[];
  bracket: GenericBracketState;
}

export const GenericBracketRounds: React.FC<GenericBracketRoundsProps> = ({ formatCode, nodes, bracket }) => {
  const { rounds, picksByRound, groupsByRound, replacesOnFull, isLocked, selectWinner } = bracket;
  const formatSubtitle = formatSubtitleOf(formatCode);
  const lastIndex = rounds.length - 1;

  return (
    <div className="generic-bracket">
      {formatSubtitle && <p className="generic-bracket__format">{formatSubtitle}</p>}

      {rounds.map((round, index) => {
        const selectedIds = picksByRound[round.code] ?? [];
        const groups = groupsByRound[round.code] ?? [];
        const isFirst = index === 0;
        const isAltar = index === lastIndex && !isFirst;
        const byeIds = new Set(
          nodes
            .filter((n) => n.round === round.code && n.teamA && !n.teamB)
            .map((n) => (n.teamA as LiguillaTeam).teamId)
        );
        const title = isAltar ? 'El Altar del Campeón' : roundTitleOf(round.code);

        return (
          <section
            key={round.code}
            className={`generic-bracket__round ${isAltar ? 'generic-bracket__round--altar' : ''}`}
          >
            <header className="generic-bracket__round-header">
              <span className="generic-bracket__badge">
                {isAltar ? <Crown size={14} /> : <Zap size={14} />} Ronda {round.order}: {roundTitleOf(round.code)}
              </span>
              <h3 className="generic-bracket__title">{title}</h3>
              <p className="generic-bracket__subtitle">
                Elige {round.winnersToPick} {round.winnersToPick === 1 ? 'ganador' : 'ganadores'}
                {' · '}
                <span className="generic-bracket__counter">
                  {selectedIds.length}/{round.winnersToPick}
                </span>
                {' · '}+{round.pointsPerHit} pts por acierto
              </p>
            </header>

            {groups.map((group) => (
              <div key={group.key} className="generic-bracket__group">
                {group.label && (
                  <div className="generic-bracket__group-header">
                    <span className="generic-bracket__group-label">{group.label}</span>
                    <span className="generic-bracket__group-counter">
                      {group.selectedIds.length}/{group.quota}
                    </span>
                  </div>
                )}
                {isFirst ? (
                  <div className="generic-bracket__grid">
                    {group.nodes.map((node) => (
                      <FirstRoundCard
                        key={node.id}
                        node={node}
                        round={round}
                        selectedIds={selectedIds}
                        isReadOnly={isLocked}
                        onSelect={selectWinner}
                      />
                    ))}
                  </div>
                ) : (
                  <CandidateGrid
                    roundCode={round.code}
                    teams={group.teams}
                    selectedIds={selectedIds}
                    isFull={!replacesOnFull && group.selectedIds.length >= group.quota}
                    isReadOnly={isLocked}
                    byeIds={byeIds}
                    onSelect={selectWinner}
                  />
                )}
              </div>
            ))}
          </section>
        );
      })}
    </div>
  );
};
