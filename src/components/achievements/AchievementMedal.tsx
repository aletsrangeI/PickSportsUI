import React from 'react';
import { Medal, Trophy, Lock } from 'lucide-react';
import type { AchievementTier } from '../../types';
import './AchievementMedal.css';

export const TIER_LABEL: Record<AchievementTier, string> = {
  BRONZE: 'Bronce',
  SILVER: 'Plata',
  GOLD: 'Oro',
  PLATINUM: 'Platino',
};

export const TIER_ORDER: AchievementTier[] = ['PLATINUM', 'GOLD', 'SILVER', 'BRONZE'];

interface AchievementMedalProps {
  tier: AchievementTier;
  size?: 'sm' | 'md' | 'lg';
  locked?: boolean;
}

/** Medalla con relieve metálico por nivel de trofeo (Bronce, Plata, Oro, Platino). */
export const AchievementMedal: React.FC<AchievementMedalProps> = ({ tier, size = 'md', locked = false }) => {
  const iconSize = size === 'lg' ? 28 : size === 'md' ? 22 : 16;
  return (
    <span
      className={`achievement-medal achievement-medal--${tier.toLowerCase()} achievement-medal--${size}${locked ? ' achievement-medal--locked' : ''}`}
      role="img"
      aria-label={`Trofeo ${TIER_LABEL[tier]}${locked ? ' bloqueado' : ''}`}
    >
      {locked ? (
        <Lock size={iconSize - 4} aria-hidden="true" />
      ) : tier === 'PLATINUM' ? (
        <Trophy size={iconSize} aria-hidden="true" />
      ) : (
        <Medal size={iconSize} aria-hidden="true" />
      )}
    </span>
  );
};
