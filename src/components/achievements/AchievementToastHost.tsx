import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { X } from 'lucide-react';
import type { RootState } from '../../store';
import {
  useAcknowledgeAchievementMutation,
  useLazyGetUnseenAchievementsQuery,
} from '../../services/api';
import type { AchievementDto } from '../../types';
import { AchievementMedal, TIER_LABEL } from './AchievementMedal';
import './AchievementToastHost.css';

const TOAST_DURATION_MS = 5000;
const FOCUS_REFETCH_MIN_INTERVAL_MS = 60_000;

/**
 * Host global de toasts de trofeos (SPEC-013 §3.3).
 * Consulta /achievements/unseen al abrir la app y al recuperar el foco (máx. 1 vez por minuto),
 * muestra los trofeos en cola de uno en uno y confirma cada uno una sola vez.
 */
export const AchievementToastHost: React.FC = () => {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const [fetchUnseen] = useLazyGetUnseenAchievementsQuery();
  const [acknowledge] = useAcknowledgeAchievementMutation();

  const [queue, setQueue] = useState<AchievementDto[]>([]);
  // Ids ya encolados en esta sesión: evita duplicados entre consultas y dobles acknowledge.
  const knownIdsRef = useRef<Set<number>>(new Set());
  const ackedIdsRef = useRef<Set<number>>(new Set());
  const lastFetchRef = useRef<number>(0);

  const loadUnseen = useCallback(async () => {
    lastFetchRef.current = Date.now();
    try {
      const res = await fetchUnseen(undefined, false).unwrap();
      if (!res.isSuccess || !res.data?.length) return;
      const fresh = res.data.filter((a) => !knownIdsRef.current.has(a.id));
      if (fresh.length === 0) return;
      fresh.forEach((a) => knownIdsRef.current.add(a.id));
      setQueue((prev) => [...prev, ...fresh]);
    } catch {
      // Error de red: sin ruido. Se reintenta al recuperar el foco.
    }
  }, [fetchUnseen]);

  // Consulta al abrir la app autenticado y al recuperar el foco (con límite de 1/min).
  useEffect(() => {
    if (!isAuthenticated) {
      knownIdsRef.current.clear();
      ackedIdsRef.current.clear();
      setQueue([]);
      return;
    }

    void loadUnseen();

    const onFocus = () => {
      if (document.visibilityState === 'hidden') return;
      if (Date.now() - lastFetchRef.current < FOCUS_REFETCH_MIN_INTERVAL_MS) return;
      void loadUnseen();
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [isAuthenticated, loadUnseen]);

  const current = isAuthenticated ? queue[0] : undefined;
  const currentId = current?.id;

  const dismiss = useCallback(() => {
    setQueue((prev) => prev.slice(1));
  }, []);

  // Al mostrarse: acknowledge una sola vez y auto-descarte a los ~5 s.
  useEffect(() => {
    if (currentId === undefined) return;

    if (!ackedIdsRef.current.has(currentId)) {
      ackedIdsRef.current.add(currentId);
      acknowledge(currentId)
        .unwrap()
        .catch(() => {
          // Silencioso: el servidor volverá a ofrecerlo en la próxima apertura.
        });
    }

    const timer = window.setTimeout(dismiss, TOAST_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [currentId, acknowledge, dismiss]);

  if (!current) return null;

  const tierClass = current.tier.toLowerCase();

  return (
    <div className="achievement-toast-host" role="status" aria-live="polite" aria-atomic="true">
      <div key={current.id} className={`achievement-toast achievement-toast--${tierClass}`}>
        <AchievementMedal tier={current.tier} size="md" />
        <div className="achievement-toast__body">
          <span className="achievement-toast__kicker">
            Trofeo desbloqueado · {TIER_LABEL[current.tier]}
          </span>
          <strong className="achievement-toast__name">{current.name}</strong>
          <span className="achievement-toast__desc">{current.description}</span>
        </div>
        <span className="achievement-toast__score">+{current.gamerscore} G</span>
        {queue.length > 1 && (
          <span className="achievement-toast__more" aria-label={`${queue.length - 1} más en cola`}>
            +{queue.length - 1}
          </span>
        )}
        <button
          type="button"
          className="achievement-toast__close"
          onClick={dismiss}
          aria-label="Cerrar notificación de trofeo"
          tabIndex={-1}
        >
          <X size={16} />
        </button>
        <span
          className="achievement-toast__progress"
          style={{ animationDuration: `${TOAST_DURATION_MS}ms` }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
};
