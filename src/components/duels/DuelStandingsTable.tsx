import React from 'react';
import { Crown } from 'lucide-react';
import type { DuelStandingDto } from '../../types';
import { UserAvatar } from '../common/UserAvatar';
import './DuelStandingsTable.css';

interface DuelStandingsTableProps {
  standings: DuelStandingDto[];
  currentUserId?: number;
}

export const DuelStandingsTable: React.FC<DuelStandingsTableProps> = ({ standings, currentUserId }) => {
  if (standings.length === 0) {
    return (
      <div className="duel-standings__empty">
        La tabla de duelos se llenará cuando se resuelva el primer duelo.
      </div>
    );
  }

  return (
    <div className="duel-standings">
      <div className="duel-standings__scroll">
        <table className="duel-standings__table">
          <caption className="duel-standings__caption">Tabla de Duelos</caption>
          <thead>
            <tr>
              <th scope="col" className="duel-standings__th duel-standings__th--rank">#</th>
              <th scope="col" className="duel-standings__th duel-standings__th--player">Gladiador</th>
              <th scope="col" className="duel-standings__th" title="Duelos jugados">PJ</th>
              <th scope="col" className="duel-standings__th" title="Ganados">G</th>
              <th scope="col" className="duel-standings__th" title="Empatados">E</th>
              <th scope="col" className="duel-standings__th" title="Perdidos">P</th>
              <th scope="col" className="duel-standings__th duel-standings__th--hits" title="Aciertos de la temporada">Ac.</th>
              <th scope="col" className="duel-standings__th duel-standings__th--points">Pts</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((row) => {
              const isMe = row.participant.userId === currentUserId;
              return (
                <tr
                  key={row.participant.memberId}
                  className={`duel-standings__row ${isMe ? 'duel-standings__row--me' : ''} ${
                    row.rank === 1 ? 'duel-standings__row--leader' : ''
                  }`}
                >
                  <td className="duel-standings__cell duel-standings__cell--rank">
                    {row.rank === 1 ? <Crown size={15} aria-label="Líder" /> : row.rank}
                  </td>
                  <td className="duel-standings__cell duel-standings__cell--player">
                    <UserAvatar src={row.participant.avatarUrl} alt={row.participant.alias} size="sm" />
                    <div className="duel-standings__name">
                      <span className="duel-standings__alias">{row.participant.alias}</span>
                      {row.participant.equippedTitle && (
                        <span className="duel-standings__title">{row.participant.equippedTitle}</span>
                      )}
                    </div>
                  </td>
                  <td className="duel-standings__cell">{row.played}</td>
                  <td className="duel-standings__cell">{row.won}</td>
                  <td className="duel-standings__cell">{row.drawn}</td>
                  <td className="duel-standings__cell">{row.lost}</td>
                  <td className="duel-standings__cell duel-standings__cell--hits">{row.seasonHits}</td>
                  <td className="duel-standings__cell duel-standings__cell--points">{row.points}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="duel-standings__legend">
        Victoria 3 pts, empate 1, derrota 0. Desempate: aciertos de la temporada.
      </p>
    </div>
  );
};
