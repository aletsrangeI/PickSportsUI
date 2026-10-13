import React from 'react';
import { Trophy, Shield, Check, AlertOctagon } from 'lucide-react';
import type { LiguillaBracketDetail, LiguillaNode, LiguillaTeam } from '../../types';

interface BracketReadOnlyTreeProps {
  bracket: LiguillaBracketDetail;
  teams: Record<number, LiguillaTeam>;
  nodes: LiguillaNode[];
}

export const BracketReadOnlyTree: React.FC<BracketReadOnlyTreeProps> = ({
  bracket,
  teams,
  nodes,
}) => {
  const shatteredSet = new Set(bracket.shatteredTeamIds || []);

  const renderTeamPill = (teamId: number, expectedRound: 'QF' | 'SF' | 'FINAL') => {
    const team = teams[teamId];
    if (!team) return <span className="tree-pill tree-pill--empty">Sin selección</span>;

    const isShattered = shatteredSet.has(teamId);

    // Verificar si acertó en la ronda
    let isHit = false;
    if (expectedRound === 'QF') {
      isHit = nodes.some((n) => n.nodeNumber <= 4 && n.isResolved && n.winnerTeam?.teamId === teamId);
    } else if (expectedRound === 'SF') {
      isHit = nodes.some((n) => (n.nodeNumber === 5 || n.nodeNumber === 6) && n.isResolved && n.winnerTeam?.teamId === teamId);
    } else if (expectedRound === 'FINAL') {
      const finalNode = nodes.find((n) => n.nodeNumber === 7);
      isHit = finalNode?.isResolved && finalNode.winnerTeam?.teamId === teamId ? true : false;
    }

    return (
      <div
        className={`tree-pill ${isHit ? 'tree-pill--hit' : ''} ${
          isShattered ? 'tree-pill--shattered' : ''
        }`}
      >
        <span className="tree-pill__seed">#{team.seed}</span>
        {team.logoUrl ? (
          <img src={team.logoUrl} alt={team.name} className="tree-pill__logo" />
        ) : (
          <Shield size={14} />
        )}
        <span className="tree-pill__name">{team.shortName || team.name}</span>

        {isHit && (
          <span className="tree-pill__status-badge tree-pill__status-badge--hit" title="Acierto oficial">
            <Check size={12} strokeWidth={3} />
          </span>
        )}
        {isShattered && !isHit && (
          <span className="tree-pill__status-badge tree-pill__status-badge--shattered" title="Rama Rota: Equipo eliminado">
            <AlertOctagon size={12} />
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="bracket-readonly">
      <div className="bracket-readonly__grid">
        {/* Columna Cuartos */}
        <div className="bracket-readonly__column">
          <h4 className="bracket-readonly__col-title">Semifinalistas (+10 pts c/u)</h4>
          <div className="bracket-readonly__items">
            {renderTeamPill(bracket.qfWinner1TeamId, 'QF')}
            {renderTeamPill(bracket.qfWinner2TeamId, 'QF')}
            {renderTeamPill(bracket.qfWinner3TeamId, 'QF')}
            {renderTeamPill(bracket.qfWinner4TeamId, 'QF')}
          </div>
        </div>

        {/* Columna Semis */}
        <div className="bracket-readonly__column">
          <h4 className="bracket-readonly__col-title">Finalistas (+25 pts c/u)</h4>
          <div className="bracket-readonly__items">
            {renderTeamPill(bracket.sfWinner1TeamId, 'SF')}
            {renderTeamPill(bracket.sfWinner2TeamId, 'SF')}
          </div>
        </div>

        {/* Columna Campeón */}
        <div className="bracket-readonly__column bracket-readonly__column--champ">
          <h4 className="bracket-readonly__col-title">Campeón (+50 pts)</h4>
          <div className="bracket-readonly__items bracket-readonly__items--center">
            {renderTeamPill(bracket.championTeamId, 'FINAL')}
            <div className="bracket-readonly__trophy-icon">
              <Trophy size={28} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
