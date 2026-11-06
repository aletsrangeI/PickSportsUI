import React from 'react';
import { Crosshair } from 'lucide-react';
import type { AchievementShowcaseDto, AchievementTier } from '../../types';
import { AchievementMedal, TIER_LABEL, TIER_ORDER } from './AchievementMedal';
import './TrophyShowcase.css';

// Umbrales de Nivel de Cazador (SPEC-013 §3.1), solo para dibujar la barra de progreso.
const LEVEL_FLOORS = [0, 50, 150, 300, 600, 1000];

function levelProgress(gamerscore: number, nextLevelAt: number | null): number {
  if (nextLevelAt === null) return 100;
  const floor = [...LEVEL_FLOORS].reverse().find((f) => f <= gamerscore) ?? 0;
  const span = nextLevelAt - floor;
  if (span <= 0) return 100;
  return Math.max(0, Math.min(100, Math.round(((gamerscore - floor) / span) * 100)));
}

interface TrophyShowcaseProps {
  showcase: AchievementShowcaseDto;
  isFetching?: boolean;
  onSeasonChange: (seasonId: number) => void;
}

export const TrophyShowcase: React.FC<TrophyShowcaseProps> = ({ showcase, isFetching = false, onSeasonChange }) => {
  const progress = levelProgress(showcase.gamerscore, showcase.nextLevelAt);
  const remaining = showcase.nextLevelAt !== null ? showcase.nextLevelAt - showcase.gamerscore : 0;
  const totalCount = showcase.unlocked.length + showcase.locked.length;

  // La temporada mostrada siempre debe ser una opción del select, aunque aún no tenga trofeos.
  const seasonOptions =
    showcase.seasonId !== null && !showcase.availableSeasons.some((s) => s.seasonId === showcase.seasonId)
      ? [
          { seasonId: showcase.seasonId, seasonName: showcase.seasonName ?? 'Temporada actual', gamerscore: showcase.gamerscore },
          ...showcase.availableSeasons,
        ]
      : showcase.availableSeasons;

  const byTier = (tier: AchievementTier) => ({
    unlocked: showcase.unlocked.filter((a) => a.tier === tier),
    locked: showcase.locked.filter((a) => a.tier === tier),
  });

  return (
    <div className={`trophy-showcase${isFetching ? ' trophy-showcase--loading' : ''}`}>
      <header className="trophy-showcase__summary">
        <div className="trophy-showcase__level">
          <span className="trophy-showcase__level-icon" aria-hidden="true">
            <Crosshair size={20} />
          </span>
          <div>
            <span className="trophy-showcase__eyebrow">Nivel de Cazador</span>
            <strong className="trophy-showcase__level-name">{showcase.level}</strong>
          </div>
        </div>

        <div className="trophy-showcase__score">
          <span className="trophy-showcase__score-value">{showcase.gamerscore}</span>
          <span className="trophy-showcase__score-unit">G</span>
        </div>

        <div className="trophy-showcase__progress-block">
          <div
            className="trophy-showcase__progress"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            aria-label="Progreso al siguiente nivel"
          >
            <span className="trophy-showcase__progress-bar" style={{ width: `${progress}%` }} />
          </div>
          <span className="trophy-showcase__progress-label">
            {showcase.nextLevelAt !== null
              ? `${remaining} G para el siguiente nivel`
              : 'Nivel máximo alcanzado'}
          </span>
        </div>

        {seasonOptions.length > 0 && (
          <label className="trophy-showcase__season">
            <span className="trophy-showcase__eyebrow">Temporada</span>
            <select
              className="trophy-showcase__select"
              value={showcase.seasonId ?? ''}
              onChange={(e) => onSeasonChange(Number(e.target.value))}
            >
              {seasonOptions.map((s) => (
                <option key={s.seasonId} value={s.seasonId}>
                  {s.seasonName} ({s.gamerscore} G)
                </option>
              ))}
            </select>
          </label>
        )}
      </header>

      <p className="trophy-showcase__count">
        {showcase.unlocked.length} de {totalCount} trofeos
        {showcase.seasonName ? ` en ${showcase.seasonName}` : ''}
      </p>

      {TIER_ORDER.map((tier) => {
        const { unlocked, locked } = byTier(tier);
        if (unlocked.length === 0 && locked.length === 0) return null;
        return (
          <section key={tier} className="trophy-showcase__tier" aria-label={`Trofeos de ${TIER_LABEL[tier]}`}>
            <h4 className={`trophy-showcase__tier-title trophy-showcase__tier-title--${tier.toLowerCase()}`}>
              {TIER_LABEL[tier]}
              <span className="trophy-showcase__tier-count">{unlocked.length}/{unlocked.length + locked.length}</span>
            </h4>
            <ul className="trophy-showcase__grid">
              {unlocked.map((a) => (
                <li key={a.id} className={`trophy-card trophy-card--${tier.toLowerCase()}`}>
                  <AchievementMedal tier={tier} size="md" />
                  <div className="trophy-card__body">
                    <strong className="trophy-card__name">{a.name}</strong>
                    <span className="trophy-card__desc">{a.description}</span>
                    {a.titleName && <span className="trophy-card__title">Título: {a.titleName}</span>}
                  </div>
                  <span className="trophy-card__score">+{a.gamerscore} G</span>
                </li>
              ))}
              {locked.map((a) => (
                <li key={a.code} className="trophy-card trophy-card--locked">
                  <AchievementMedal tier={tier} size="md" locked />
                  <div className="trophy-card__body">
                    <strong className="trophy-card__name">{a.name}</strong>
                    <span className="trophy-card__desc">{a.description}</span>
                  </div>
                  <span className="trophy-card__score">{a.gamerscore} G</span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
};
