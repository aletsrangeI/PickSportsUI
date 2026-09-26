import { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import {
  useGetQuinielaByIdQuery,
  useGetWeeksBySeasonQuery,
  useGetSeasonsQuery,
  useGetPicksQuery,
  useSubmitPickMutation,
  useLockAndAutofillMutation,
} from '../services/api';
import type { PickItem, Match, QuinielaMemberPickInfo } from '../types';
import { formatDeadline } from '../utils/dateUtils';

export interface UsePicksReturn {
  activeQuinielaId: number | null;
  selectedWeekId: number | null;
  setSelectedWeekId: (weekId: number) => void;
  weeks: Array<{ id: number; weekNumber: number; name: string; status: string }>;
  matches: Match[];
  userPicks: Record<number, PickItem>;
  allPicks: PickItem[];
  members: QuinielaMemberPickInfo[];
  currentUserMemberId?: number;
  isLocked: boolean;
  isRevealed: boolean;
  allowsDraw: boolean;
  weekStatus: string;
  weekName: string;
  firstGameUtc?: string | null;
  completedPicksCount: number;
  totalMatchesCount: number;
  isComplete: boolean;
  deadlineFormatted: string;
  recentlyModifiedMatchId: number | null;
  isOwnerOrAdmin: boolean;
  isLoading: boolean;
  isFetching: boolean;
  hasLiveMatches: boolean;
  isSubmitting: boolean;
  isLocking: boolean;
  toast: { message: string; type: 'success' | 'warning' | 'error'; isModification?: boolean } | null;
  clearToast: () => void;
  handleVote: (matchId: number, pickAbbr: string) => Promise<boolean>;
  handleLockAndAutofill: () => Promise<void>;
  refetchPicks: () => void;
}

export const usePicks = (): UsePicksReturn => {
  const activeQuinielaId = useSelector((state: RootState) => state.quiniela.activeQuinielaId);
  const currentUser = useSelector((state: RootState) => state.auth.user);

  const [selectedWeekId, setSelectedWeekId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'warning' | 'error'; isModification?: boolean } | null>(null);
  const [recentlyModifiedMatchId, setRecentlyModifiedMatchId] = useState<number | null>(null);

  const clearToast = () => setToast(null);


  // 1. Cargar detalle de la quiniela activa
  const { data: quinielaDetailResp } = useGetQuinielaByIdQuery(activeQuinielaId!, {
    skip: !activeQuinielaId,
  });
  const quiniela = quinielaDetailResp?.data;

  // 2. Cargar temporadas de la liga de esta quiniela
  const { data: seasonsData } = useGetSeasonsQuery(quiniela?.leagueId, {
    skip: !quiniela?.leagueId,
  });
  const seasons = seasonsData?.data ?? [];
  const currentSeason =
    seasons.find((s) => s.isCurrent && !s.isFinished) ??
    seasons.find((s) => s.isCurrent) ??
    seasons[0];

  // 3. Cargar semanas de la temporada activa
  const { data: weeksData } = useGetWeeksBySeasonQuery(currentSeason?.id!, {
    skip: !currentSeason?.id,
  });
  const rawWeeks = weeksData?.data ?? [];
  const weeks = useMemo(
    () => rawWeeks.map((w) => ({ id: w.id, weekNumber: w.weekNumber, name: w.name, status: w.status })),
    [rawWeeks]
  );

  // Auto-seleccionar la jornada más relevante
  useEffect(() => {
    if (weeks.length > 0 && selectedWeekId === null) {
      const activeWeek =
        weeks.find((w) => w.status === 'PUBLISHED') ??
        weeks.find((w) => w.status === 'LOCKED') ??
        weeks[0];
      if (activeWeek) {
        setSelectedWeekId(activeWeek.id);
      }
    }
  }, [weeks, selectedWeekId]);

  // Sondeo adaptativo para marcadores en vivo
  const [pollInterval, setPollInterval] = useState<number>(0);

  // 4. Cargar Picks de la jornada activa para esta quiniela
  const {
    data: picksResponse,
    isLoading: isLoadingPicks,
    isFetching: isFetchingPicks,
    refetch: refetchPicks,
  } = useGetPicksQuery(
    { quinielaId: activeQuinielaId!, weekId: selectedWeekId! },
    {
      skip: !activeQuinielaId || !selectedWeekId,
      pollingInterval: pollInterval,
      refetchOnFocus: true,
      refetchOnReconnect: true,
    }
  );

  const picksData = picksResponse?.data;

  // Ajustar intervalo de sondeo automáticamente:
  // - 20s cuando hay partidos en vivo (statusState == 'in')
  // - 60s cuando la jornada está cerrada (LOCKED) pero aún con partidos pendientes
  // - 0 cuando está en DRAFT, abierta (PUBLISHED) sin juegos en vivo, o finalizada (SCORED)
  useEffect(() => {
    const rawMatches = picksResponse?.data?.matches ?? [];
    const isLive = rawMatches.some((m) => m.statusState === 'in');
    const isLockedWeek = Boolean(picksResponse?.data?.isLocked) && picksResponse?.data?.status !== 'SCORED';

    const nextInterval = isLive ? 20000 : isLockedWeek ? 60000 : 0;
    setPollInterval((prev) => (prev !== nextInterval ? nextInterval : prev));
  }, [picksResponse]);

  // Mutaciones
  const [submitPickMutation, { isLoading: isSubmitting }] = useSubmitPickMutation();
  const [lockAndAutofillMutation, { isLoading: isLocking }] = useLockAndAutofillMutation();

  const isOwnerOrAdmin = Boolean(
    quiniela?.userRole === 'OWNER' ||
    quiniela?.userRole === 'ADMIN' ||
    currentUser?.role === 'ADMIN'
  );

  // Mapear picks del usuario actual
  const userPicks = useMemo(() => {
    const map: Record<number, PickItem> = {};
    if (!picksData?.picks || !picksData.currentUserMemberId) return map;

    for (const p of picksData.picks) {
      if (p.memberId === picksData.currentUserMemberId) {
        map[p.matchId] = p;
      }
    }
    return map;
  }, [picksData?.picks, picksData?.currentUserMemberId]);

  const matches = picksData?.matches ?? [];
  const allPicks = picksData?.picks ?? [];
  const members = picksData?.members ?? [];
  const isLocked = Boolean(picksData?.isLocked);
  const isRevealed = Boolean(picksData?.isRevealed);
  const allowsDraw = picksData?.allowsDraw ?? true;
  const weekStatus = picksData?.status ?? 'DRAFT';
  const weekName = picksData?.weekName ?? 'Jornada';
  const firstGameUtc = picksData?.firstGameUtc;

  const totalMatchesCount = matches.length;
  const completedPicksCount = Object.keys(userPicks).length;
  const isComplete = totalMatchesCount > 0 && completedPicksCount >= totalMatchesCount;

  const hasLiveMatches = useMemo(() => {
    return matches.some((m) => m.statusState === 'in');
  }, [matches]);

  // Fecha límite efectiva: firstGameUtc de la jornada o el partido más próximo
  const earliestMatchDateUtc = useMemo(() => {
    if (matches.length === 0) return null;
    const sorted = [...matches].sort(
      (a, b) => new Date(a.dateUtc).getTime() - new Date(b.dateUtc).getTime()
    );
    return sorted[0]?.dateUtc ?? null;
  }, [matches]);

  const effectiveDeadlineUtc = firstGameUtc || earliestMatchDateUtc;
  const deadlineFormatted = useMemo(() => formatDeadline(effectiveDeadlineUtc), [effectiveDeadlineUtc]);

  // Manejo de votación táctil (1-tap)
  const handleVote = async (matchId: number, pickAbbr: string): Promise<boolean> => {
    if (!activeQuinielaId || !selectedWeekId) return false;
    if (isLocked) {
      setToast({ message: 'La jornada ya está bloqueada para votación.', type: 'warning' });
      return false;
    }

    const previousPick = userPicks[matchId];
    const isModification = Boolean(previousPick && previousPick.pickAbbr && previousPick.pickAbbr !== pickAbbr);

    try {
      const response = await submitPickMutation({
        quinielaId: activeQuinielaId,
        matchId,
        pickAbbr,
        weekId: selectedWeekId,
      }).unwrap();

      if (response.isSuccess) {
        setRecentlyModifiedMatchId(matchId);
        setTimeout(() => {
          setRecentlyModifiedMatchId((curr) => (curr === matchId ? null : curr));
        }, 3500);

        if (isModification) {
          setToast({
            message: `Pronóstico modificado a ${pickAbbr}. Recuerda que puedes seguir cambiándolo antes de la fecha límite.`,
            type: 'success',
            isModification: true,
          });
        } else {
          setToast({
            message: `Pronóstico registrado: ${pickAbbr}. Guardado automáticamente.`,
            type: 'success',
            isModification: false,
          });
        }
        setTimeout(() => setToast(null), 3200);
        return true;
      } else {
        setToast({ message: response.message || 'Error al guardar pronóstico', type: 'error' });
        return false;
      }
    } catch (err: any) {
      const errMsg = err?.data?.message || err?.message || 'Error al conectar con el servidor';
      setToast({ message: errMsg, type: 'error' });
      return false;
    }
  };

  // Manejo de bloqueo manual y autollenado
  const handleLockAndAutofill = async (): Promise<void> => {
    if (!activeQuinielaId || !selectedWeekId) return;

    try {
      const result = await lockAndAutofillMutation({
        quinielaId: activeQuinielaId,
        weekId: selectedWeekId,
      }).unwrap();

      if (result.isSuccess) {
        setToast({
          message: result.data?.message || 'Jornada cerrada y autollenada correctamente.',
          type: 'success',
        });
      } else {
        setToast({ message: result.message || 'No se pudo realizar el autollenado', type: 'error' });
      }
    } catch (err: any) {
      const errMsg = err?.data?.message || 'Error al ejecutar cierre y autollenado';
      setToast({ message: errMsg, type: 'error' });
    }
  };

  return {
    activeQuinielaId,
    selectedWeekId,
    setSelectedWeekId,
    weeks,
    matches,
    userPicks,
    allPicks,
    members,
    currentUserMemberId: picksData?.currentUserMemberId,
    isLocked,
    isRevealed,
    allowsDraw,
    weekStatus,
    weekName,
    firstGameUtc,
    completedPicksCount,
    totalMatchesCount,
    isComplete,
    deadlineFormatted,
    recentlyModifiedMatchId,
    isOwnerOrAdmin,
    isLoading: isLoadingPicks,
    isFetching: isFetchingPicks,
    hasLiveMatches,
    isSubmitting,
    isLocking,
    toast,
    clearToast,
    handleVote,
    handleLockAndAutofill,
    refetchPicks,
  };
};
