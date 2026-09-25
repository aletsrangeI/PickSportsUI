import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import {
  useGetQuinielasQuery,
  useGetSeasonsQuery,
  useGetWeeksBySeasonQuery,
  useGetBulletinQuery,
  useUpdateBulletinAnnouncementMutation,
} from '../services/api';

export const useBulletin = () => {
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | null>(null);
  const [selectedWeekId, setSelectedWeekId] = useState<number | null>(null);
  const [isEditingAnnouncement, setIsEditingAnnouncement] = useState(false);
  const [announcementDraft, setAnnouncementDraft] = useState('');

  const activeQuinielaId = useSelector((state: RootState) => state.quiniela.activeQuinielaId);
  const currentUser = useSelector((state: RootState) => state.auth.user);

  const { data: quinielasResponse } = useGetQuinielasQuery();
  const quinielas = quinielasResponse?.data || [];
  const activeQuiniela = quinielas.find((q) => q.id === activeQuinielaId) || quinielas[0];
  const quinielaId = activeQuiniela?.id || 0;

  const isOwnerOrAdmin =
    currentUser?.role?.toUpperCase() === 'ADMIN' ||
    activeQuiniela?.userRole === 'OWNER' ||
    activeQuiniela?.userRole === 'ADMIN';

  const { data: seasonsData } = useGetSeasonsQuery(activeQuiniela?.leagueId, {
    skip: !activeQuiniela?.leagueId,
  });
  const seasons = seasonsData?.data ?? [];

  useEffect(() => {
    if (seasons.length > 0 && selectedSeasonId === null) {
      const current =
        seasons.find((s) => s.isCurrent && !s.isFinished) ??
        seasons.find((s) => s.isCurrent) ??
        seasons[0];
      setSelectedSeasonId(current.id);
    }
  }, [seasons, selectedSeasonId]);

  const { data: weeksData } = useGetWeeksBySeasonQuery(selectedSeasonId!, {
    skip: !selectedSeasonId,
  });
  const weeks = weeksData?.data ?? [];

  // Por defecto el boletín resuelve del lado del servidor (última jornada SCORED o activa);
  // el selector solo fuerza un weekId cuando el usuario navega el histórico.
  useEffect(() => {
    if (weeks.length > 0 && selectedWeekId !== null && !weeks.some((w) => w.id === selectedWeekId)) {
      setSelectedWeekId(null);
    }
  }, [weeks, selectedWeekId]);

  const {
    data: bulletinResponse,
    isLoading: isLoadingBulletin,
    isFetching,
    isError: isBulletinError,
    refetch: refetchBulletin,
  } = useGetBulletinQuery({ quinielaId, weekId: selectedWeekId ?? undefined }, { skip: !quinielaId });

  const bulletin = bulletinResponse?.data;

  useEffect(() => {
    if (bulletin && !isEditingAnnouncement) {
      setAnnouncementDraft(bulletin.adminAnnouncement ?? '');
    }
  }, [bulletin, isEditingAnnouncement]);

  const [updateAnnouncement, { isLoading: isSavingAnnouncement }] =
    useUpdateBulletinAnnouncementMutation();

  const handleSaveAnnouncement = useCallback(async () => {
    if (!quinielaId || !bulletin) return;
    const trimmed = announcementDraft.trim();
    try {
      await updateAnnouncement({
        quinielaId,
        weekId: bulletin.weekId,
        announcement: trimmed.length > 0 ? trimmed : null,
      }).unwrap();
      setIsEditingAnnouncement(false);
    } catch (err) {
      console.error('Error al guardar el anuncio:', err);
    }
  }, [quinielaId, bulletin, announcementDraft, updateAnnouncement]);

  const handleSelectWeek = useCallback((weekId: number | null) => {
    setSelectedWeekId(weekId);
    setIsEditingAnnouncement(false);
  }, []);

  return {
    quinielaId,
    activeQuiniela,
    seasons,
    weeks,
    selectedSeasonId,
    selectedWeekId,
    bulletin,
    isLoadingBulletin: isLoadingBulletin || isFetching,
    isBulletinError: isBulletinError && !bulletin,
    refetchBulletin,
    isOwnerOrAdmin,
    isEditingAnnouncement,
    announcementDraft,
    isSavingAnnouncement,
    setSelectedSeasonId: (seasonId: number) => {
      setSelectedSeasonId(seasonId);
      setSelectedWeekId(null);
    },
    handleSelectWeek,
    setIsEditingAnnouncement,
    setAnnouncementDraft,
    handleSaveAnnouncement,
  };
};
