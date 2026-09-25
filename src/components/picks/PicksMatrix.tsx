import React, { useState, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import type { Match, PickItem, QuinielaMemberPickInfo } from '../../types';
import { Bot, Check, X, Shield, Table as TableIcon, Layers, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { UserAvatar } from '../common/UserAvatar';
import './PicksMatrix.css';

interface PicksMatrixProps {
  matches: Match[];
  members: QuinielaMemberPickInfo[];
  picks: PickItem[];
  currentUserMemberId?: number;
}

type ViewMode = 'by-match' | 'cards' | 'matrix';

export const PicksMatrix: React.FC<PicksMatrixProps> = ({
  matches,
  members,
  picks,
  currentUserMemberId,
}) => {
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // En pantallas móviles (< 768px), iniciar preferentemente en 'by-match' para evitar scroll lateral incómodo
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return 'by-match';
    }
    return 'matrix';
  });

  const [selectedMatchIndex, setSelectedMatchIndex] = useState<number>(0);

  // Mapa indexado (memberId, matchId) -> PickItem
  const picksMap = useMemo(() => {
    const map = new Map<string, PickItem>();
    for (const p of picks) {
      map.set(`${p.memberId}-${p.matchId}`, p);
    }
    return map;
  }, [picks]);

  // Lista de miembros ordenada: Usuario actual primero, luego por aciertos
  const sortedMembers = useMemo(() => {
    return [...members].sort((a, b) => {
      if (a.memberId === currentUserMemberId) return -1;
      if (b.memberId === currentUserMemberId) return 1;
      return b.totalHits - a.totalHits;
    });
  }, [members, currentUserMemberId]);

  // Partido seleccionado en la vista 'by-match'
  const currentMatch = matches[selectedMatchIndex] || matches[0];

  // Estadísticas del partido actual (cuántos votaron Local, Empate, Visita)
  const currentMatchStats = useMemo(() => {
    if (!currentMatch) return { homeCount: 0, drawCount: 0, awayCount: 0, totalVotes: 0 };
    let homeCount = 0;
    let drawCount = 0;
    let awayCount = 0;

    for (const m of members) {
      const p = picksMap.get(`${m.memberId}-${currentMatch.id}`);
      if (p) {
        if (p.pickAbbr === currentMatch.homeTeam.abbreviation) homeCount++;
        else if (p.pickAbbr === currentMatch.awayTeam.abbreviation) awayCount++;
        else drawCount++;
      }
    }
    const totalVotes = homeCount + drawCount + awayCount;
    return { homeCount, drawCount, awayCount, totalVotes };
  }, [currentMatch, members, picksMap]);

  // Desplazamiento horizontal asistido para la vista de tabla
  const handleScrollTable = (direction: 'left' | 'right') => {
    if (tableContainerRef.current) {
      const scrollAmount = direction === 'left' ? -220 : 220;
      tableContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (!matches.length || !members.length) {
    return (
      <div className="picks-matrix__empty">
        <p>No hay partidos o participantes para mostrar en esta jornada.</p>
      </div>
    );
  }

  return (
    <div className="picks-matrix-wrapper">
      {/* ─── Selector de Vista (Ideal para teléfonos) ───────────────────────── */}
      <div className="picks-matrix-toolbar">
        <div className="picks-matrix-view-switcher" role="tablist" aria-label="Modalidad de vista">
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'by-match'}
            className={`picks-matrix-view-btn ${viewMode === 'by-match' ? 'picks-matrix-view-btn--active' : ''}`}
            onClick={() => setViewMode('by-match')}
            title="Ver pronósticos partido a partido sin scroll horizontal"
          >
            <Calendar size={15} />
            <span>Por Partido</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'cards'}
            className={`picks-matrix-view-btn ${viewMode === 'cards' ? 'picks-matrix-view-btn--active' : ''}`}
            onClick={() => setViewMode('cards')}
            title="Ver tarjetas individuales por participante"
          >
            <Layers size={15} />
            <span>Por Rival</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'matrix'}
            className={`picks-matrix-view-btn ${viewMode === 'matrix' ? 'picks-matrix-view-btn--active' : ''}`}
            onClick={() => setViewMode('matrix')}
            title="Ver tabla completa de matriz"
          >
            <TableIcon size={15} />
            <span>Tabla Matriz</span>
          </button>
        </div>

        {/* Controles de flecha rápida si estamos en modo tabla */}
        {viewMode === 'matrix' && (
          <div className="picks-matrix-scroll-controls">
            <span className="picks-matrix-scroll-hint">Desplazar partidos:</span>
            <button
              type="button"
              className="btn btn--icon btn--xs picks-matrix-scroll-btn"
              onClick={() => handleScrollTable('left')}
              title="Desplazar partidos a la izquierda"
              aria-label="Desplazar a la izquierda"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              className="btn btn--icon btn--xs picks-matrix-scroll-btn"
              onClick={() => handleScrollTable('right')}
              title="Desplazar partidos a la derecha"
              aria-label="Desplazar a la derecha"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* ──────────────────────────────────────────────────────────────────────────
          VISTA 1: POR PARTIDO (Game-by-Game Mobile Focus - Cero scroll lateral)
          ────────────────────────────────────────────────────────────────────────── */}
      {viewMode === 'by-match' && currentMatch && (
        <div className="picks-by-match">
          {/* Carrusel superior de selección de partido */}
          <div className="picks-by-match__carousel" role="tablist" aria-label="Lista de partidos">
            {matches.map((m, idx) => {
              const isSelected = idx === selectedMatchIndex;
              const isFinished = m.statusState === 'post';
              const isLive = m.statusState === 'in';

              return (
                <button
                  key={m.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  className={`picks-by-match__pill ${isSelected ? 'picks-by-match__pill--active' : ''}`}
                  onClick={() => setSelectedMatchIndex(idx)}
                >
                  <span className="picks-by-match__pill-teams">
                    {m.homeTeam.abbreviation} vs {m.awayTeam.abbreviation}
                  </span>
                  {isFinished && (
                    <span className="picks-by-match__pill-score">
                      {m.homeScore} - {m.awayScore}
                    </span>
                  )}
                  {isLive && (
                    <span className="picks-by-match__pill-live">● EN VIVO</span>
                  )}
                  {!isFinished && !isLive && (
                    <span className="picks-by-match__pill-status">vs</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tarjeta del Partido Seleccionado */}
          <div className="picks-by-match__card">
            <div className="picks-by-match__card-header">
              <div className="picks-by-match__team-box">
                <span className="picks-by-match__team-name">{currentMatch.homeTeam.name}</span>
                <span className="picks-by-match__team-abbr">{currentMatch.homeTeam.abbreviation}</span>
              </div>

              <div className="picks-by-match__score-box">
                {currentMatch.statusState === 'post' ? (
                  <>
                    <div className="picks-by-match__score">
                      {currentMatch.homeScore} - {currentMatch.awayScore}
                    </div>
                    <span className="badge badge--secondary picks-by-match__status-badge">Finalizado</span>
                  </>
                ) : currentMatch.statusState === 'in' ? (
                  <>
                    <div className="picks-by-match__score picks-by-match__score--live">
                      {currentMatch.homeScore} - {currentMatch.awayScore}
                    </div>
                    <span className="picks-matrix__live-dot">● EN VIVO</span>
                  </>
                ) : (
                  <>
                    <span className="picks-by-match__vs-text">VS</span>
                    <span className="badge badge--outline picks-by-match__status-badge">Pendiente</span>
                  </>
                )}
              </div>

              <div className="picks-by-match__team-box picks-by-match__team-box--away">
                <span className="picks-by-match__team-name">{currentMatch.awayTeam.name}</span>
                <span className="picks-by-match__team-abbr">{currentMatch.awayTeam.abbreviation}</span>
              </div>
            </div>

            {/* Distribución de Votos en la Quiniela */}
            {currentMatchStats.totalVotes > 0 && (
              <div className="picks-by-match__distribution">
                <div className="picks-by-match__dist-header">
                  <span>Pronósticos del grupo:</span>
                  <span>{currentMatchStats.totalVotes} de {members.length}</span>
                </div>
                <div className="picks-by-match__dist-bars">
                  <div className="picks-by-match__dist-item">
                    <span className="picks-by-match__dist-label">{currentMatch.homeTeam.abbreviation}</span>
                    <span className="picks-by-match__dist-val">{currentMatchStats.homeCount}</span>
                  </div>
                  <div className="picks-by-match__dist-item">
                    <span className="picks-by-match__dist-label">Empate</span>
                    <span className="picks-by-match__dist-val">{currentMatchStats.drawCount}</span>
                  </div>
                  <div className="picks-by-match__dist-item">
                    <span className="picks-by-match__dist-label">{currentMatch.awayTeam.abbreviation}</span>
                    <span className="picks-by-match__dist-val">{currentMatchStats.awayCount}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Lista Vertical de Pronósticos de los Participantes */}
          <div className="picks-by-match__members-list">
            <div className="picks-by-match__list-title">
              Pronósticos de los Participantes ({members.length})
            </div>

            {sortedMembers.map((member) => {
              const isCurrentUser = member.memberId === currentUserMemberId;
              const pick = picksMap.get(`${member.memberId}-${currentMatch.id}`);
              const isFinished = currentMatch.statusState === 'post';
              const hasWinner = Boolean(currentMatch.winnerAbbr);
              const isWinnerMatch = pick && isFinished && hasWinner && pick.pickAbbr === currentMatch.winnerAbbr;
              const isMissMatch = pick && isFinished && hasWinner && pick.pickAbbr !== currentMatch.winnerAbbr;

              // Fallback robusto de avatar para el usuario logueado si no venía en la query
              const effectiveAvatarUrl =
                (isCurrentUser && !member.avatarUrl && currentUser?.avatarUrl)
                  ? currentUser.avatarUrl
                  : member.avatarUrl;

              return (
                <div
                  key={member.memberId}
                  className={`picks-by-match__member-row ${isCurrentUser ? 'picks-by-match__member-row--current' : ''}`}
                >
                  <div className="picks-by-match__member-left">
                    <UserAvatar
                      src={effectiveAvatarUrl}
                      alt={member.alias}
                      size="sm"
                    />
                    <div className="picks-by-match__member-meta">
                      <div className="picks-by-match__member-alias-row">
                        <span className="picks-by-match__member-alias">{member.alias}</span>
                        {isCurrentUser && <span className="picks-matrix__you-tag">(Tú)</span>}
                        {member.role === 'OWNER' && (
                          <span className="badge badge--accent picks-matrix__role-badge">
                            <Shield size={10} /> Creador
                          </span>
                        )}
                      </div>
                      <span className="picks-by-match__member-sub">
                        {member.totalHits} acierto{member.totalHits !== 1 ? 's' : ''} en el torneo
                      </span>
                    </div>
                  </div>

                  <div className="picks-by-match__member-right">
                    {pick ? (
                      <div
                        className={`picks-matrix__pick-badge ${
                          isWinnerMatch ? 'picks-matrix__cell--hit' : isMissMatch ? 'picks-matrix__cell--miss' : ''
                        }`}
                      >
                        <span className="picks-matrix__pick-abbr">{pick.pickAbbr}</span>
                        {pick.isAutoFilled && (
                          <span
                            className="picks-matrix__autofill-icon"
                            title="Pronóstico generado aleatoriamente (Autollenado seguro)"
                          >
                            <Bot size={13} />
                          </span>
                        )}
                        {isFinished && hasWinner && (
                          <span className="picks-matrix__hit-icon">
                            {isWinnerMatch ? <Check size={13} /> : <X size={13} />}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="picks-matrix__no-pick">-</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Navegación rápida entre partidos */}
          <div className="picks-by-match__nav-footer">
            <button
              type="button"
              className="btn btn--outline btn--sm"
              disabled={selectedMatchIndex === 0}
              onClick={() => setSelectedMatchIndex((curr) => Math.max(0, curr - 1))}
            >
              <ChevronLeft size={16} />
              <span>Anterior Partido</span>
            </button>
            <span className="picks-by-match__nav-index">
              Partido {selectedMatchIndex + 1} de {matches.length}
            </span>
            <button
              type="button"
              className="btn btn--outline btn--sm"
              disabled={selectedMatchIndex === matches.length - 1}
              onClick={() => setSelectedMatchIndex((curr) => Math.min(matches.length - 1, curr + 1))}
            >
              <span>Siguiente Partido</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          VISTA 2: POR RIVAL (Tarjetas individuales compactas - Cero scroll lateral)
          ────────────────────────────────────────────────────────────────────────── */}
      {viewMode === 'cards' && (
        <div className="picks-cards-grid">
          {sortedMembers.map((member) => {
            const isCurrentUser = member.memberId === currentUserMemberId;
            const effectiveAvatarUrl =
              (isCurrentUser && !member.avatarUrl && currentUser?.avatarUrl)
                ? currentUser.avatarUrl
                : member.avatarUrl;

            return (
              <div
                key={member.memberId}
                className={`picks-member-card ${isCurrentUser ? 'picks-member-card--current' : ''}`}
              >
                <div className="picks-member-card__header">
                  <div className="picks-member-card__left">
                    <UserAvatar
                      src={effectiveAvatarUrl}
                      alt={member.alias}
                      size="md"
                    />
                    <div>
                      <div className="picks-member-card__name-row">
                        <span className="picks-member-card__name">{member.alias}</span>
                        {isCurrentUser && <span className="picks-matrix__you-tag">(Tú)</span>}
                        {member.role === 'OWNER' && (
                          <span className="badge badge--accent picks-matrix__role-badge">
                            <Shield size={10} /> Creador
                          </span>
                        )}
                      </div>
                      <span className="picks-member-card__sub">
                        {member.displayName && member.displayName !== member.alias ? member.displayName : 'Participante'}
                      </span>
                    </div>
                  </div>

                  <div className="picks-member-card__hits">
                    <span className="picks-member-card__hits-num">{member.totalHits}</span>
                    <span className="picks-member-card__hits-label">Aciertos</span>
                  </div>
                </div>

                <div className="picks-member-card__picks">
                  {matches.map((m) => {
                    const pick = picksMap.get(`${member.memberId}-${m.id}`);
                    const isFinished = m.statusState === 'post';
                    const hasWinner = Boolean(m.winnerAbbr);
                    const isHit = pick && isFinished && hasWinner && pick.pickAbbr === m.winnerAbbr;
                    const isMiss = pick && isFinished && hasWinner && pick.pickAbbr !== m.winnerAbbr;

                    return (
                      <div
                        key={m.id}
                        className={`picks-member-card__pick-item ${
                          isHit ? 'picks-member-card__pick-item--hit' : isMiss ? 'picks-member-card__pick-item--miss' : ''
                        }`}
                        title={`${m.homeTeam.abbreviation} vs ${m.awayTeam.abbreviation}: ${pick?.pickAbbr || 'Sin pick'}`}
                      >
                        <span className="picks-member-card__match-abbr">
                          {m.homeTeam.abbreviation}-{m.awayTeam.abbreviation}
                        </span>
                        <span className="picks-member-card__pick-val">
                          {pick ? pick.pickAbbr : '-'}
                        </span>
                        {isHit && <Check size={11} className="picks-member-card__icon" />}
                        {isMiss && <X size={11} className="picks-member-card__icon" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          VISTA 3: TABLA MATRIZ (Matriz completa con mejoras táctiles y sticky)
          ────────────────────────────────────────────────────────────────────────── */}
      {viewMode === 'matrix' && (
        <div className="picks-matrix-container" ref={tableContainerRef}>
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
              {sortedMembers.map((member) => {
                const isCurrentUser = member.memberId === currentUserMemberId;
                const rowClass = `picks-matrix__row ${
                  isCurrentUser ? 'picks-matrix__row--current' : ''
                }`;

                // Fallback robusto para foto de perfil
                const effectiveAvatarUrl =
                  (isCurrentUser && !member.avatarUrl && currentUser?.avatarUrl)
                    ? currentUser.avatarUrl
                    : member.avatarUrl;

                return (
                  <tr key={member.memberId} className={rowClass}>
                    <td className="picks-matrix__td picks-matrix__td--member">
                      <div className="picks-matrix__member-info">
                        <UserAvatar
                          src={effectiveAvatarUrl}
                          alt={member.alias}
                          size="sm"
                        />
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
      )}
    </div>
  );
};
