import React from 'react';
import type { Match } from '../../types';
import { formatMatchDate, formatMatchTime, parseUtcDate } from '../../utils/dateUtils';
import './MatchCard.css';

interface MatchCardProps {
  match: Match;
  children?: React.ReactNode;
}

export const MatchCard: React.FC<MatchCardProps> = ({ match, children }) => {
  const { homeTeam, awayTeam, statusState, homeScore, awayScore, dateUtc, postponedToDate, venue } = match;

  const formattedTime = formatMatchTime(dateUtc);
  const formattedDate = formatMatchDate(dateUtc);

  const getStatusBadge = () => {
    switch (statusState) {
      case 'in':
        return <span className="match-card__badge match-card__badge--live">● EN VIVO</span>;
      case 'post':
        return <span className="match-card__badge match-card__badge--final">FINAL</span>;
      case 'postponed':
        return <span className="match-card__badge match-card__badge--postponed">⚠ POSPUESTO</span>;
      default:
        return null;
    }
  };

  const getCenterContent = () => {
    if (statusState === 'in' || statusState === 'post') {
      return (
        <div className="match-card__score">
          <span className={`match-card__score-num${statusState === 'in' ? ' match-card__score-num--live' : ''}`}>
            {homeScore}
          </span>
          <span className="match-card__score-sep">-</span>
          <span className={`match-card__score-num${statusState === 'in' ? ' match-card__score-num--live' : ''}`}>
            {awayScore}
          </span>
        </div>
      );
    }

    if (statusState === 'postponed') {
      const postponedDate = parseUtcDate(postponedToDate);
      return (
        <div className="match-card__postponed-info">
          {postponedDate ? (
            <span className="match-card__postponed-date">
              {postponedDate.toLocaleDateString('es-MX', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              })}
            </span>
          ) : (
            <span className="match-card__postponed-date">Fecha por definir</span>
          )}
        </div>
      );
    }

    // pre: mostrar horario
    return (
      <div className="match-card__time">
        <span className="match-card__time-date">{formattedDate}</span>
        <span className="match-card__time-hour">{formattedTime}</span>
      </div>
    );
  };

  const isHomeWinner = match.winnerAbbr === homeTeam.abbreviation;
  const isAwayWinner = match.winnerAbbr === awayTeam.abbreviation;

  const homeClasses = ['match-card__team', isHomeWinner ? 'match-card__team--winner' : '', isAwayWinner ? 'match-card__team--loser' : '']
    .filter(Boolean).join(' ');
  const awayClasses = ['match-card__team match-card__team--away', isAwayWinner ? 'match-card__team--winner' : '', isHomeWinner ? 'match-card__team--loser' : '']
    .filter(Boolean).join(' ');

  const cardClasses = ['match-card', statusState === 'postponed' ? 'match-card--postponed' : '', statusState === 'in' ? 'match-card--live' : '']
    .filter(Boolean).join(' ');

  return (
    <div className={cardClasses}>
      {getStatusBadge() && (
        <div className="match-card__badge-row">{getStatusBadge()}</div>
      )}

      <div className="match-card__teams">
        {/* Equipo Local */}
        <div className={homeClasses}>
          <div className="match-card__logo">
            {homeTeam.logoUrl ? (
              <img src={homeTeam.logoUrl} alt={homeTeam.abbreviation} className="match-card__logo-img" />
            ) : (
              <div
                className="match-card__logo-placeholder"
                style={homeTeam.primaryColor ? { backgroundColor: homeTeam.primaryColor } : undefined}
              >
                {homeTeam.abbreviation[0]}
              </div>
            )}
          </div>
          <span className="match-card__team-abbr">{homeTeam.abbreviation}</span>
          <span className="match-card__team-name">{homeTeam.displayName}</span>
        </div>

        {/* Centro: score / horario / estado */}
        <div className="match-card__center">{getCenterContent()}</div>

        {/* Equipo Visitante */}
        <div className={awayClasses}>
          <div className="match-card__logo">
            {awayTeam.logoUrl ? (
              <img src={awayTeam.logoUrl} alt={awayTeam.abbreviation} className="match-card__logo-img" />
            ) : (
              <div
                className="match-card__logo-placeholder"
                style={awayTeam.primaryColor ? { backgroundColor: awayTeam.primaryColor } : undefined}
              >
                {awayTeam.abbreviation[0]}
              </div>
            )}
          </div>
          <span className="match-card__team-abbr">{awayTeam.abbreviation}</span>
          <span className="match-card__team-name">{awayTeam.displayName}</span>
        </div>
      </div>

      {venue && <div className="match-card__venue">{venue}</div>}
      {children}
    </div>
  );
};
