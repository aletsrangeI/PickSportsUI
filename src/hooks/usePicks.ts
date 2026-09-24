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
import type { PickItem, Match } from '../types';

export interface UsePicksReturn {
  activeQuinielaId: number | null;
  selectedWeekId: number | null;
  setSelectedWeekId: (weekId: number) => void;
  weeks: Array<{ id: number; weekNumber: number; name: string; status: string }>;
  matches: Match[];
  userPicks: Record<number, PickItem>;
  allPicks: PickItem[];
  members: Array<{ memberId: number; alias: string; displayName?: string; role: string; totalHits: number; currentStreak: number }>;
  isLocked: boolean;
  isRevealed: boolean;
  allowsDraw: boolean;
  weekStatus: string;
  weekName: string;
  firstGameUtc?: string | null;
  completedPicksCount: number;
  totalMatchesCount: number;
  isOwnerOrAdmin: boolean;
  isLoading: boolean;
  isSubmitting: boolean;
  isLocking: boolean;
  toast: { message: string; type: 'success' | 'warning' | 'error' } | null;
  clearToast: () => void;
  handleVote: (matchId: number, pickAbbr: string) => Promise<boolean>;
  handleLockAndAutofill: () => Promise<void>;
}

export const usePicks = (): UsePicksReturn => {
  const activeQuinielaId = useSelector((state: RootState) => state.quiniela.activeQuinielaId);
  const currentUser = useSelector((state: RootState) => state.auth.user);

  const [selectedWeekId, setSelectedWeekId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'warning' | 'error' } | null>(null);

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

  // 4. Cargar Picks de la jornada activa para esta quiniela
  const {
    data: picksResponse,
    isLoading: isLoadingPicks,
  } = useGetPicksQuery(
    { quinielaId: activeQuinielaId!, weekId: selectedWeekId! },
    { skip: !activeQuinielaId || !selectedWeekId }
  );

  const picksData = picksResponse?.data;

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

  // Manejo de votación táctil (1-tap)
  const handleVote = async (matchId: number, pickAbbr: string): Promise<boolean> => {
    if (!activeQuinielaId || !selectedWeekId) return false;
    if (isLocked) {
      setToast({ message: 'La jornada ya está bloqueada para votación.', type: 'warning' });
      return false;
    }

    try {
      const response = await submitPickMutation({
        quinielaId: activeQuinielaId,
        matchId,
        pickAbbr,
        weekId: selectedWeekId,
      }).unwrap();

      if (response.isSuccess) {
        setToast({ message: 'Pronóstico registrado con éxito', type: 'success' });
        setTimeout(() => setToast(null), 1800);
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
    isLocked,
    isRevealed,
    allowsDraw,
    weekStatus,
    weekName,
    firstGameUtc,
    completedPicksCount,
    totalMatchesCount,
    isOwnerOrAdmin,
    isLoading: isLoadingPicks,
    isSubmitting,
    isLocking,
    toast,
    clearToast,
    handleVote,
    handleLockAndAutofill,
  };
};
