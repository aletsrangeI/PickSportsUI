import React from 'react';
import type { Match, PickItem, QuinielaMemberPickInfo } from '../../types';
import { Bot, Check, X, Shield } from 'lucide-react';
import './PicksMatrix.css';

interface PicksMatrixProps {
  matches: Match[];
  members: QuinielaMemberPickInfo[];
  picks: PickItem[];
  currentUserMemberId?: number;
}

export const PicksMatrix: React.FC<PicksMatrixProps> = ({
  matches,
  members,
  picks,
  currentUserMemberId,
}) => {
  // Mapa indexado (memberId, matchId) -> PickItem
  const picksMap = React.useMemo(() => {
    const map = new Map<string, PickItem>();
    for (const p of picks) {
      map.set(`${p.memberId}-${p.matchId}`, p);
    }
    return map;
  }, [picks]);

  if (!matches.length || !members.length) {
    return (
      <div className="picks-matrix__empty">
        <p>No hay partidos o participantes para mostrar en esta jornada.</p>
      </div>
    );
  }

  return (
    <div className="picks-matrix-wrapper">
      <div className="picks-matrix-container">
        <table className="picks-matrix">
          <thead>
            <tr>
              <th className="picks-matrix__th picks-matrix__th--member">Participante</th>
              <th className="picks-matrix__th picks-matrix__th--hits">Aciertos</th>
              {matches.map((m) => (
                <th key={m.id} className="picks-matrix__th picks-matrix__th--match">
                  <div className="picks-matrix__match-header">
                    <span className="picks-matrix__match-team">{m.homeTeam.abbreviation}</span>
                    <span className="picks-matrix__match-vs">vs</span>
                    <span className="picks-matrix__match-team">{m.awayTeam.abbreviation}</span>
                  </div>
                  {m.statusState === 'post' && (
                    <div className="picks-matrix__match-score">
                      {m.homeScore} - {m.awayScore}
                    </div>
                  )}
                  {m.statusState === 'in' && (
                    <span className="picks-matrix__live-dot">● EN VIVO</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {members.map((member) => {
              const isCurrentUser = member.memberId === currentUserMemberId;
              const rowClass = `picks-matrix__row ${
                isCurrentUser ? 'picks-matrix__row--current' : ''
              }`;

              return (
                <tr key={member.memberId} className={rowClass}>
                  <td className="picks-matrix__td picks-matrix__td--member">
                    <div className="picks-matrix__member-info">
                      <div className="picks-matrix__member-avatar">
                        {member.avatarUrl ? (
                          <img
                            src={member.avatarUrl}
                            alt={member.alias}
                            className="picks-matrix__member-avatar-img"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const fallback = e.currentTarget.parentElement?.querySelector(
                                '.picks-matrix__member-avatar-fallback'
                              ) as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <span
                          className="picks-matrix__member-avatar-fallback"
                          style={{ display: member.avatarUrl ? 'none' : 'flex' }}
                        >
                          {member.alias.slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div className="picks-matrix__member-details">
                        <span className="picks-matrix__member-alias">
                          {member.alias}
                          {isCurrentUser && <span className="picks-matrix__you-tag">(Tú)</span>}
                        </span>
                        {member.role === 'OWNER' && (
                          <span className="badge badge--accent picks-matrix__role-badge">
                            <Shield size={10} /> Creador
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="picks-matrix__td picks-matrix__td--hits">
                    <span className="picks-matrix__hits-num">{member.totalHits}</span>
                  </td>

                  {matches.map((m) => {
                    const pick = picksMap.get(`${member.memberId}-${m.id}`);
                    const isFinished = m.statusState === 'post';
                    const hasWinner = Boolean(m.winnerAbbr);

                    let cellStatusClass = '';
                    let isWinnerMatch = false;

                    if (pick && isFinished && hasWinner) {
                      isWinnerMatch = pick.pickAbbr === m.winnerAbbr;
                      cellStatusClass = isWinnerMatch
                        ? 'picks-matrix__cell--hit'
                        : 'picks-matrix__cell--miss';
                    }

                    return (
                      <td key={m.id} className={`picks-matrix__td picks-matrix__td--cell ${cellStatusClass}`}>
                        {pick ? (
                          <div className="picks-matrix__pick-badge">
                            <span className="picks-matrix__pick-abbr">{pick.pickAbbr}</span>
                            {pick.isAutoFilled && (
                              <span
                                className="picks-matrix__autofill-icon"
                                title="Pronóstico generado aleatoriamente (Autollenado seguro)"
                              >
                                <Bot size={12} />
                              </span>
                            )}
                            {isFinished && hasWinner && (
                              <span className="picks-matrix__hit-icon">
                                {isWinnerMatch ? <Check size={12} /> : <X size={12} />}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="picks-matrix__no-pick">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
