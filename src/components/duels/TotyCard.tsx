import React from 'react';
import { Crown, Trophy } from 'lucide-react';
import type { HallOfFameEntryDto } from '../../types';
import { UserAvatar } from '../common/UserAvatar';
import './TotyCard.css';

interface TotyCardProps {
  entry: HallOfFameEntryDto;
}

/** Carta TOTY / Gladiador Legendario: negro y oro holográfico. */
export const TotyCard: React.FC<TotyCardProps> = ({ entry }) => {
  const [won = '0', drawn = '0', lost = '0'] = entry.record.split('-');
  const { champion } = entry;

  return (
    <article className="toty-card" aria-label={`${entry.title}: ${champion.alias}`}>
      <div className="toty-card__shine" aria-hidden="true" />
      <div className="toty-card__inner">
        <header className="toty-card__top">
          <div className="toty-card__rating">
            <span className="toty-card__points">{entry.points}</span>
            <span className="toty-card__points-label">PTS</span>
          </div>
          <div className="toty-card__badge">
            <Crown size={18} />
            <span>TOTY</span>
          </div>
        </header>

        <div className="toty-card__portrait">
          <UserAvatar src={champion.avatarUrl} alt={champion.alias} size="xl" />
        </div>

        <h3 className="toty-card__name">{champion.alias}</h3>
        <p className="toty-card__title">{entry.title}</p>

        <dl className="toty-card__record">
          <div className="toty-card__stat">
            <dt>G</dt>
            <dd>{won}</dd>
          </div>
          <div className="toty-card__stat">
            <dt>E</dt>
            <dd>{drawn}</dd>
          </div>
          <div className="toty-card__stat">
            <dt>P</dt>
            <dd>{lost}</dd>
          </div>
        </dl>

        <dl className="toty-card__extras">
          <div className="toty-card__extra">
            <dt>Aciertos</dt>
            <dd>{entry.totalHits}</dd>
          </div>
          <div className="toty-card__extra">
            <dt>Sorpresas</dt>
            <dd>{entry.totalUpsets}</dd>
          </div>
          <div className="toty-card__extra">
            <dt>Racha</dt>
            <dd>{entry.bestWinStreak}</dd>
          </div>
          <div className="toty-card__extra">
            <dt>Ventajas</dt>
            <dd>{entry.advantageWins}</dd>
          </div>
          {entry.bestDuelHits > 0 && (
            <div className="toty-card__extra toty-card__extra--wide">
              <dt>Mejor fecha</dt>
              <dd>
                {entry.bestDuelHits} aciertos
                {entry.bestDuelWeekNumber ? ` · F${entry.bestDuelWeekNumber}` : ''}
              </dd>
            </div>
          )}
        </dl>

        <footer className="toty-card__footer">
          <span className="toty-card__quiniela">{entry.quinielaName}</span>
          {entry.seasonName && <span className="toty-card__season">{entry.seasonName}</span>}
          {entry.cupName && (
            <span className="toty-card__cup">
              <Trophy size={12} />
              <span>{entry.cupName}</span>
            </span>
          )}
        </footer>
      </div>
    </article>
  );
};
