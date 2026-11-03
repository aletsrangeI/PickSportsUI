import React, { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { Download, Loader2, Share2 } from 'lucide-react';
import { UserAvatar } from '../../components/common/UserAvatar';
import type { WrappedFinalCardDto } from '../../types';
import './WrappedShareCard.css';

/** Tamano base 9:16; con pixelRatio 3 la exportacion es exactamente 1080x1920. */
const CARD_WIDTH = 360;
const CARD_HEIGHT = 640;
const EXPORT_PIXEL_RATIO = 3;

const HEX_RE = /^#[0-9a-f]{6}$/i;

interface WrappedCardCanvasProps {
  card: WrappedFinalCardDto;
  ref?: React.Ref<HTMLDivElement>;
}

/** Tarjeta visual (nodo que se exporta a PNG). */
export const WrappedCardCanvas: React.FC<WrappedCardCanvasProps> = ({ card, ref }) => {
  const theme = HEX_RE.test(card.themeColor) ? card.themeColor : '#10b981';

  return (
    <div
      ref={ref}
      className="wrapped-card"
      style={
        {
          '--wrapped-theme': theme,
          width: CARD_WIDTH,
          height: CARD_HEIGHT,
        } as React.CSSProperties
      }
    >
      <div className="wrapped-card__glow wrapped-card__glow--top" aria-hidden="true" />
      <div className="wrapped-card__glow wrapped-card__glow--bottom" aria-hidden="true" />

      <header className="wrapped-card__header">
        <span className="wrapped-card__brand">PickSports Wrapped</span>
        <span className="wrapped-card__season">{card.seasonName}</span>
      </header>

      <div className="wrapped-card__hero">
        <div className="wrapped-card__avatar-ring">
          <UserAvatar src={card.avatarUrl} alt={card.displayName} size="xl" />
        </div>
        <h3 className="wrapped-card__name">{card.displayName}</h3>
        <p className="wrapped-card__position">
          <span className="wrapped-card__position-number">#{card.finalPosition}</span>
          <span className="wrapped-card__position-total">de {card.totalMembers}</span>
        </p>
      </div>

      <div className="wrapped-card__archetype">
        <span className="wrapped-card__archetype-emoji" aria-hidden="true">
          {card.archetypeEmoji}
        </span>
        <span className="wrapped-card__archetype-title">{card.archetypeTitle}</span>
      </div>

      <ul className="wrapped-card__stats">
        {card.stats.slice(0, 4).map((stat) => (
          <li key={stat.label} className="wrapped-card__stat">
            <span className="wrapped-card__stat-value">{stat.value}</span>
            <span className="wrapped-card__stat-label">{stat.label}</span>
          </li>
        ))}
      </ul>

      <footer className="wrapped-card__footer">picksports.app</footer>
    </div>
  );
};

interface WrappedShareCardProps {
  card: WrappedFinalCardDto;
}

async function renderCardBlob(node: HTMLElement): Promise<Blob> {
  const options = {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    pixelRatio: EXPORT_PIXEL_RATIO,
    cacheBust: true,
    // Quita la animacion de entrada para capturar el estado final.
    style: { animation: 'none', transform: 'none' },
  };

  let dataUrl: string;
  try {
    dataUrl = await toPng(node, options);
  } catch {
    // Reintento sin imagenes remotas (avatares sin CORS) para no bloquear la exportacion.
    dataUrl = await toPng(node, {
      ...options,
      filter: (el) => !(el instanceof HTMLImageElement),
    });
  }
  const response = await fetch(dataUrl);
  return response.blob();
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** Tarjeta final (S-16) con acciones Compartir / Descargar. */
export const WrappedShareCard: React.FC<WrappedShareCardProps> = ({ card }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<'share' | 'download' | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const filename = `picksports-wrapped-${card.seasonName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`;

  const handleShare = async () => {
    if (!cardRef.current || busy) return;
    setBusy('share');
    setMessage(null);
    try {
      const blob = await renderCardBlob(cardRef.current);
      const file = new File([blob], filename, { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Mi PickSports Wrapped',
          text: `Mi temporada en PickSports: ${card.archetypeTitle}`,
        });
      } else {
        downloadBlob(blob, filename);
        setMessage('Imagen descargada');
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        setMessage('No se pudo generar la imagen');
      }
    } finally {
      setBusy(null);
    }
  };

  const handleDownload = async () => {
    if (!cardRef.current || busy) return;
    setBusy('download');
    setMessage(null);
    try {
      const blob = await renderCardBlob(cardRef.current);
      downloadBlob(blob, filename);
      setMessage('Imagen descargada');
    } catch {
      setMessage('No se pudo generar la imagen');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="wrapped-share">
      <div className="wrapped-share__preview">
        <WrappedCardCanvas card={card} ref={cardRef} />
      </div>

      <div className="wrapped-share__actions" data-no-tap>
        <button
          type="button"
          className="wrapped-share__btn wrapped-share__btn--primary"
          onClick={handleShare}
          disabled={busy !== null}
        >
          {busy === 'share' ? <Loader2 size={18} className="wrapped-share__spin" /> : <Share2 size={18} />}
          Compartir Tarjeta
        </button>
        <button
          type="button"
          className="wrapped-share__btn wrapped-share__btn--ghost"
          onClick={handleDownload}
          disabled={busy !== null}
          aria-label="Descargar imagen"
        >
          {busy === 'download' ? <Loader2 size={18} className="wrapped-share__spin" /> : <Download size={18} />}
        </button>
      </div>

      <p className="wrapped-share__message" role="status" aria-live="polite">
        {message}
      </p>
    </div>
  );
};
