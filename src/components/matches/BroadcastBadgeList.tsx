import React from 'react';
import { Tv } from 'lucide-react';
import './BroadcastBadgeList.css';

interface BroadcastBadgeListProps {
  broadcasters?: string[];
  /** Muestra el ícono de TV al inicio de la fila */
  showIcon?: boolean;
}

/** SPEC-015: catálogo de canales conocidos (sugerencias del editor admin). */
export const KNOWN_BROADCASTERS = [
  'Canal 5',
  'Las Estrellas',
  'TUDN',
  'ViX Premium',
  'Azteca 7',
  'Azteca Deportes',
  'ESPN',
  'Disney+',
  'FOX',
  'FOX+',
  'FOX One',
  'Claro Sports',
  'Amazon Prime Video',
] as const;

const PENDING = 'Por confirmar';

/** Resuelve la variante de color de marca a partir del nombre del canal. */
const getVariant = (name: string): string => {
  const n = name.toLowerCase();
  if (n.includes('prime')) return 'prime';
  if (n.includes('vix')) return 'vix';
  if (n.includes('disney')) return 'disney';
  if (n.includes('espn')) return 'espn';
  if (n.includes('fox one')) return 'foxone';
  if (n.includes('fox')) return 'fox';
  if (n.includes('azteca')) return 'azteca';
  if (n.includes('canal 5') || n.includes('estrellas')) return 'televisa';
  if (n.includes('tudn')) return 'tudn';
  if (n.includes('claro')) return 'claro';
  if (n === PENDING.toLowerCase()) return 'pending';
  return 'default';
};

/** Etiqueta corta para que los badges no saturen la tarjeta en móvil. */
const getShortLabel = (name: string): string => {
  if (name === 'Amazon Prime Video') return 'Prime Video';
  return name;
};

export const BroadcastBadgeList: React.FC<BroadcastBadgeListProps> = ({ broadcasters, showIcon = true }) => {
  if (!broadcasters || broadcasters.length === 0) return null;

  return (
    <div className="broadcast-list" aria-label={`Dónde ver: ${broadcasters.join(', ')}`}>
      {showIcon && <Tv size={12} className="broadcast-list__icon" aria-hidden="true" />}
      {broadcasters.map((name) => (
        <span key={name} className={`broadcast-badge broadcast-badge--${getVariant(name)}`} title={name}>
          {getShortLabel(name)}
        </span>
      ))}
    </div>
  );
};
