import { useCallback, useEffect, useRef, useState } from 'react';

export const WRAPPED_SLIDE_MS = 5000;
const HOLD_DELAY_MS = 180;

interface UseWrappedPlayerResult {
  index: number;
  progress: number;
  paused: boolean;
  isLast: boolean;
  next: () => void;
  prev: () => void;
  stageHandlers: {
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => void;
    onPointerUp: (e: React.PointerEvent<HTMLElement>) => void;
    onPointerCancel: () => void;
    onPointerLeave: () => void;
    onContextMenu: (e: React.MouseEvent) => void;
  };
}

/**
 * Logica del visor tipo Stories: avance automatico por segmentos de 5 s,
 * tap izquierda/derecha y mantener presionado para pausar.
 */
export function useWrappedPlayer(total: number): UseWrappedPlayerResult {
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [holding, setHolding] = useState(false);
  const [hidden, setHidden] = useState(false);

  const elapsedRef = useRef(0);
  const holdTimerRef = useRef<number | null>(null);
  const holdActiveRef = useRef(false);

  const isLast = index >= total - 1;
  const paused = holding || hidden;

  const goTo = useCallback(
    (target: number) => {
      const clamped = Math.max(0, Math.min(total - 1, target));
      elapsedRef.current = 0;
      setProgress(0);
      setIndex((current) => {
        if (current !== clamped) {
          navigator.vibrate?.(10);
        }
        return clamped;
      });
    },
    [total],
  );

  const next = useCallback(() => {
    setIndex((current) => {
      const target = Math.min(total - 1, current + 1);
      if (target !== current) navigator.vibrate?.(10);
      return target;
    });
    elapsedRef.current = 0;
    setProgress(0);
  }, [total]);

  const prev = useCallback(() => {
    goTo(index - 1);
  }, [goTo, index]);

  // Avance automatico
  useEffect(() => {
    if (paused || isLast) return;
    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      elapsedRef.current += now - last;
      last = now;
      const ratio = Math.min(1, elapsedRef.current / WRAPPED_SLIDE_MS);
      setProgress(ratio);
      if (ratio >= 1) {
        next();
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [paused, isLast, index, next]);

  // Pausar si la pestana se oculta
  useEffect(() => {
    const onVisibility = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  useEffect(() => {
    return () => {
      if (holdTimerRef.current !== null) window.clearTimeout(holdTimerRef.current);
    };
  }, []);

  const clearHold = () => {
    if (holdTimerRef.current !== null) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  };

  const isInteractive = (target: EventTarget) =>
    target instanceof Element && target.closest('[data-no-tap]') !== null;

  const stageHandlers: UseWrappedPlayerResult['stageHandlers'] = {
    onPointerDown: (e) => {
      if (isInteractive(e.target)) return;
      holdActiveRef.current = false;
      clearHold();
      holdTimerRef.current = window.setTimeout(() => {
        holdActiveRef.current = true;
        setHolding(true);
      }, HOLD_DELAY_MS);
    },
    onPointerUp: (e) => {
      if (isInteractive(e.target)) return;
      clearHold();
      if (holdActiveRef.current) {
        holdActiveRef.current = false;
        setHolding(false);
        return;
      }
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      if (x < rect.width * 0.33) {
        prev();
      } else {
        next();
      }
    },
    onPointerCancel: () => {
      clearHold();
      holdActiveRef.current = false;
      setHolding(false);
    },
    onPointerLeave: () => {
      clearHold();
      if (holdActiveRef.current) {
        holdActiveRef.current = false;
        setHolding(false);
      }
    },
    onContextMenu: (e) => e.preventDefault(),
  };

  return { index, progress, paused, isLast, next, prev, stageHandlers };
}
