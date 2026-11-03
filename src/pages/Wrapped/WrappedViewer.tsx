import React, { useEffect } from 'react';
import { Pause, X } from 'lucide-react';
import type { SeasonWrappedDto } from '../../types';
import { SlideRenderer, resolveSlideBackground } from './SlideRenderer';
import { WrappedShareCard } from './WrappedShareCard';
import { useWrappedPlayer } from './useWrappedPlayer';
import './WrappedViewer.css';

interface WrappedViewerProps {
  wrapped: SeasonWrappedDto;
  onClose: () => void;
}

export const WrappedViewer: React.FC<WrappedViewerProps> = ({ wrapped, onClose }) => {
  const slides = wrapped.slides;
  // Las slides + la card final (siempre ultima)
  const total = slides.length + 1;
  const { index, progress, paused, next, prev, stageHandlers } = useWrappedPlayer(total);
  const isFinalCard = index >= slides.length;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev, onClose]);

  // Bloquear el scroll del documento mientras el visor esta abierto
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const finalBackground = resolveSlideBackground(
    `linear-gradient(160deg, #0d1117 0%, ${wrapped.themeColor} 140%)`,
    0,
  );

  return (
    <div
      className="wrapped-viewer"
      role="dialog"
      aria-modal="true"
      aria-label={`PickSports Wrapped ${wrapped.seasonName}`}
    >
      <div className="wrapped-viewer__stage" {...stageHandlers}>
        {isFinalCard ? (
          <section
            key="final"
            className="wrapped-viewer__final"
            style={{ background: finalBackground }}
          >
            <WrappedShareCard card={wrapped.finalCard} />
          </section>
        ) : (
          <SlideRenderer key={index} slide={slides[index]} position={index} />
        )}
      </div>

      <div className="wrapped-viewer__top">
        <div className="wrapped-viewer__progress" aria-hidden="true">
          {Array.from({ length: total }, (_, i) => {
            const fill = i < index ? 1 : i === index ? (isFinalCard ? 1 : progress) : 0;
            return (
              <span key={i} className="wrapped-viewer__segment">
                <span
                  className="wrapped-viewer__segment-fill"
                  style={{ transform: `scaleX(${fill})` }}
                />
              </span>
            );
          })}
        </div>

        <div className="wrapped-viewer__bar">
          <span className="wrapped-viewer__title">{wrapped.seasonName}</span>
          <div className="wrapped-viewer__bar-actions" data-no-tap>
            {paused && (
              <span className="wrapped-viewer__paused">
                <Pause size={14} /> Pausa
              </span>
            )}
            <button
              type="button"
              className="wrapped-viewer__close"
              onClick={onClose}
              aria-label="Cerrar Wrapped"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
