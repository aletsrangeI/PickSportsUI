import React from 'react';
import {
  Award,
  Bot,
  Clock,
  Crosshair,
  Flame,
  Frown,
  Handshake,
  Landmark,
  Medal,
  Skull,
  Sparkles,
  Swords,
  Target,
  Trophy,
  UserRoundSearch,
  type LucideIcon,
} from 'lucide-react';
import { UserAvatar } from '../../components/common/UserAvatar';
import type { WrappedSlideDto } from '../../types';
import './SlideRenderer.css';

const STORY_ICONS: Record<string, LucideIcon> = {
  'S-01': Trophy,
  'S-02': Sparkles,
  'S-03': Crosshair,
  'S-04': Skull,
  'S-05': Medal,
  'S-06': Frown,
  'S-08': Clock,
  'S-09': Handshake,
  'S-10': Swords,
  'S-11': UserRoundSearch,
  'S-12': Flame,
  'S-13': Landmark,
  'S-14': Target,
  'S-15': Award,
};

const FALLBACK_GRADIENTS = [
  'linear-gradient(160deg, #1e1b4b 0%, #4c1d95 55%, #be185d 100%)',
  'linear-gradient(160deg, #052e16 0%, #065f46 55%, #0e7490 100%)',
  'linear-gradient(160deg, #431407 0%, #9a3412 55%, #f59e0b 100%)',
  'linear-gradient(160deg, #0c1445 0%, #1d4ed8 55%, #06b6d4 100%)',
];

/** Acepta un gradiente CSS completo, un color hex o cualquier valor; nunca devuelve vacio. */
export function resolveSlideBackground(raw: string | null | undefined, seed: number): string {
  const value = (raw ?? '').trim();
  if (/gradient\(/i.test(value)) return value;
  if (/^#[0-9a-f]{3,8}$/i.test(value)) {
    return `linear-gradient(160deg, #0d1117 0%, ${value} 100%)`;
  }
  return FALLBACK_GRADIENTS[Math.abs(seed) % FALLBACK_GRADIENTS.length];
}

interface SlideRendererProps {
  slide: WrappedSlideDto;
  position: number;
}

export const SlideRenderer: React.FC<SlideRendererProps> = ({ slide, position }) => {
  const Icon = STORY_ICONS[slide.storyId] ?? Sparkles;
  const background = resolveSlideBackground(slide.backgroundGradient, position);
  const hasMention = Boolean(slide.mentionedUserName);

  return (
    <section
      className={`wrapped-slide wrapped-slide--${slide.slideType.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
      style={{ background }}
      aria-label={slide.headline}
    >
      <div className="wrapped-slide__orb wrapped-slide__orb--a" aria-hidden="true" />
      <div className="wrapped-slide__orb wrapped-slide__orb--b" aria-hidden="true" />
      <div className="wrapped-slide__grain" aria-hidden="true" />

      <div className="wrapped-slide__content">
        <div className="wrapped-slide__badge" style={{ '--i': 0 } as React.CSSProperties}>
          <Icon size={22} strokeWidth={2.2} />
        </div>

        {slide.subtitle && (
          <p className="wrapped-slide__eyebrow" style={{ '--i': 1 } as React.CSSProperties}>
            {slide.subtitle}
          </p>
        )}

        <h2 className="wrapped-slide__headline" style={{ '--i': 2 } as React.CSSProperties}>
          {slide.headline}
        </h2>

        {slide.matchTitle && (
          <div className="wrapped-slide__match wrapped-slide__glass" style={{ '--i': 3 } as React.CSSProperties}>
            <span className="wrapped-slide__match-title">{slide.matchTitle}</span>
            {slide.scoreDisplay && (
              <span className="wrapped-slide__score">{slide.scoreDisplay}</span>
            )}
          </div>
        )}

        {!slide.matchTitle && slide.scoreDisplay && (
          <p className="wrapped-slide__score wrapped-slide__score--solo" style={{ '--i': 3 } as React.CSSProperties}>
            {slide.scoreDisplay}
          </p>
        )}

        {slide.highlightMetric && (
          <p className="wrapped-slide__metric" style={{ '--i': 4 } as React.CSSProperties}>
            {slide.highlightMetric}
          </p>
        )}

        {slide.bodyText && (
          <p className="wrapped-slide__body" style={{ '--i': 5 } as React.CSSProperties}>
            {slide.bodyText}
          </p>
        )}

        {hasMention && (
          <div className="wrapped-slide__mention wrapped-slide__glass" style={{ '--i': 6 } as React.CSSProperties}>
            <UserAvatar
              src={slide.mentionedUserAvatarUrl}
              alt={slide.mentionedUserName ?? ''}
              size="lg"
            />
            <span className="wrapped-slide__mention-name">{slide.mentionedUserName}</span>
          </div>
        )}
      </div>
    </section>
  );
};
