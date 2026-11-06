import { useState } from 'react';
import { useEquipTitleMutation, useGetMyAchievementsQuery } from '../../services/api';

/** Lógica de la vitrina de trofeos del Perfil: temporada consultada y equipar/desequipar título. */
export function useTrophyShowcase() {
  const [seasonId, setSeasonId] = useState<number | undefined>(undefined);
  const [equipError, setEquipError] = useState<string | null>(null);

  const { data, isLoading, isFetching, isError, refetch } = useGetMyAchievementsQuery(seasonId);
  const [equipTitle, { isLoading: isEquipping }] = useEquipTitleMutation();

  const showcase = data?.isSuccess ? data.data ?? null : null;

  const equip = async (code: string | null) => {
    setEquipError(null);
    try {
      const res = await equipTitle({ code }).unwrap();
      if (!res.isSuccess) setEquipError(res.message || 'No se pudo actualizar el título.');
    } catch (err) {
      const e = err as { data?: { message?: string } };
      setEquipError(e?.data?.message || 'No se pudo actualizar el título.');
    }
  };

  return {
    showcase,
    seasonId,
    setSeasonId,
    isLoading,
    isFetching,
    isError: isError || (data !== undefined && !data.isSuccess),
    errorMessage: data && !data.isSuccess ? data.message : null,
    refetch,
    equip,
    isEquipping,
    equipError,
  };
}
