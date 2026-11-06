import React, { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import type { Quiniela } from '../../types';
import { useSetQuinielaGamificationMutation } from '../../services/api';
import './GamificationToggle.css';

interface GamificationToggleProps {
  quiniela: Quiniela;
}

/**
 * Interruptor de gamificación (SPEC-013 §5.1). Solo para Owner/Admin de una quiniela
 * deportiva activa con temporada asignada.
 */
export const GamificationToggle: React.FC<GamificationToggleProps> = ({ quiniela }) => {
  const [setGamification, { isLoading }] = useSetQuinielaGamificationMutation();
  const [error, setError] = useState<string | null>(null);

  const canManage = quiniela.userRole === 'OWNER' || quiniela.userRole === 'ADMIN';
  const isSports = quiniela.quinielaType !== 'CustomEvents';
  if (!canManage || !isSports || !quiniela.isActive || quiniela.isArchived || quiniela.seasonId == null) {
    return null;
  }

  const enabled = quiniela.gamificationEnabled === true;

  const handleToggle = async () => {
    setError(null);
    try {
      const res = await setGamification({ quinielaId: quiniela.id, enabled: !enabled }).unwrap();
      if (!res.isSuccess) setError(res.message || 'No se pudo cambiar la gamificación.');
    } catch (err) {
      const e = err as { data?: { message?: string } };
      setError(e?.data?.message || 'No se pudo cambiar la gamificación.');
    }
  };

  return (
    <div className="gamification-toggle">
      <span className="gamification-toggle__icon" aria-hidden="true">
        <Sparkles size={20} />
      </span>
      <div className="gamification-toggle__text">
        <span id="gamification-toggle-label" className="gamification-toggle__title">
          Gamificación de {quiniela.name}
        </span>
        <span id="gamification-toggle-desc" className="gamification-toggle__desc">
          Trofeos, Gamerscore y rachas On-Fire / En la Nevera para los miembros. Se evalúan al calificar cada jornada.
        </span>
        {error && <span className="gamification-toggle__error" role="alert">{error}</span>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-labelledby="gamification-toggle-label"
        aria-describedby="gamification-toggle-desc"
        className={`gamification-toggle__switch${enabled ? ' gamification-toggle__switch--on' : ''}`}
        onClick={handleToggle}
        disabled={isLoading}
      >
        <span className="gamification-toggle__thumb">
          {isLoading && <Loader2 size={12} className="spin" aria-hidden="true" />}
        </span>
      </button>
    </div>
  );
};
