import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import {
  useGetQuinielasQuery,
  useGetSeasonsQuery,
  useGetWeeksBySeasonQuery,
  useGetAwardsQuery,
} from '../../services/api';
import type { WeeklyAward } from '../../types';
import { Trophy, Sparkles, Skull, Moon, HelpCircle, Flame, AlertCircle } from 'lucide-react';
import { UserAvatar } from '../../components/common/UserAvatar';
import './AwardsPage.css';

interface AwardCardMeta {
  title: string;
  icon: React.ReactNode;
  badgeClass: string;
  cardClass: string;
}

const AWARD_META: Record<string, AwardCardMeta> = {
  MVP: {
    title: 'MVP de la Jornada',
    icon: <Trophy size={28} className="awards-card__icon--gold" />,
    badgeClass: 'awards-card__badge--gold',
    cardClass: 'awards-card--mvp',
  },
  REY_SORPRESAS: {
    title: 'Rey de las Sorpresas',
    icon: <Sparkles size={28} className="awards-card__icon--purple" />,
    badgeClass: 'awards-card__badge--purple',
    cardClass: 'awards-card--surprises',
  },
  HUMILLADO: {
    title: 'El Humillado de la Semana',
    icon: <Skull size={28} className="awards-card__icon--red" />,
    badgeClass: 'awards-card__badge--red',
    cardClass: 'awards-card--humillado',
  },
  SOMNIFERO: {
    title: 'Víctima del Somnífero (0-0)',
    icon: <Moon size={28} className="awards-card__icon--blue" />,
    badgeClass: 'awards-card__badge--blue',
    cardClass: 'awards-card--somnifero',
  },
  EMPATE_FALLIDO: {
    title: 'Rey del Empate Fallido',
    icon: <HelpCircle size={28} className="awards-card__icon--amber" />,
    badgeClass: 'awards-card__badge--amber',
    cardClass: 'awards-card--empate',
  },
  PARTIDO_DIFICIL: {
    title: 'Rompe-Quinielas de la Jornada',
    icon: <Flame size={28} className="awards-card__icon--orange" />,
    badgeClass: 'awards-card__badge--orange',
    cardClass: 'awards-card--hardest',
  },
};

export const AwardsPage: React.FC = () => {
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | null>(null);
  const [selectedWeekId, setSelectedWeekId] = useState<number | null>(null);

  const activeQuinielaId = useSelector((state: RootState) => state.quiniela.activeQuinielaId);
  const { data: quinielasResponse } = useGetQuinielasQuery();
  const quinielas = quinielasResponse?.data || [];
  const activeQuiniela = quinielas.find((q) => q.id === activeQuinielaId) || quinielas[0];
  const quinielaId = activeQuiniela?.id || 0;

  // Temporadas y jornadas
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

  useEffect(() => {
    if (weeks.length > 0 && (selectedWeekId === null || !weeks.some(w => w.id === selectedWeekId))) {
      const activeWeek = weeks.find((w) => w.status === 'SCORED') || weeks[0];
      setSelectedWeekId(activeWeek.id);
    }
  }, [weeks, selectedWeekId]);

  // Consulta de Galardones
  const { data: awardsResponse, isLoading: loadingAwards } = useGetAwardsQuery(
    { quinielaId, weekId: selectedWeekId || undefined },
    { skip: !quinielaId }
  );

  const awards = awardsResponse?.data ?? [];

  if (!quinielaId) {
    return (
      <div className="awards-page__no-quiniela">
        <AlertCircle size={40} />
        <h2>No tienes ninguna quiniela seleccionada</h2>
        <p>Crea o únete a una quiniela para ver los reconocimientos y la vitrina.</p>
      </div>
    );
  }

  return (
    <div className="awards-page">
      {/* Header */}
      <div className="awards-page__header">
        <div>
          <h1 className="awards-page__title">Vitrina de Galardones</h1>
          <p className="awards-page__subtitle">
            Reconocimientos semanales de gamificación, podio y castigos cómicos
          </p>
        </div>

        {/* Filtros de Temporada y Jornada */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          {seasons.length > 1 && (
            <div className="awards-page__filter">
              <label className="awards-page__label">Temporada</label>
              <select
                value={selectedSeasonId || ''}
                onChange={(e) => {
                  setSelectedSeasonId(Number(e.target.value));
                  setSelectedWeekId(null);
                }}
                className="awards-page__select"
              >
                {seasons.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.isCurrent ? '★ (En Curso)' : s.isFinished ? '— (Concluido)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="awards-page__filter">
            <label className="awards-page__label">Filtrar por jornada</label>
            <select
              value={selectedWeekId || ''}
              onChange={(e) => setSelectedWeekId(e.target.value ? Number(e.target.value) : null)}
              className="awards-page__select"
            >
              <option value="">🏆 Toda la Temporada (Vitrina Completa)</option>
              {weeks.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} {w.status === 'SCORED' ? '✓' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grid de Tarjetas de Galardones */}
      {loadingAwards ? (
        <div className="awards-page__loading">
          <p>Cargando reconocimientos...</p>
        </div>
      ) : awards.length === 0 ? (
        <div className="awards-page__empty">
          <Trophy size={48} className="awards-page__empty-icon" />
          <h3>Aún no hay galardones asignados</h3>
          <p>Los premios se calculan automáticamente al finalizar y calificar los partidos de cada jornada.</p>
        </div>
      ) : (
        <div className="awards-page__grid">
          {awards.map((award) => {
            const meta = AWARD_META[award.awardType] || {
              title: award.awardType,
              icon: <Trophy size={28} />,
              badgeClass: 'awards-card__badge--gold',
              cardClass: '',
            };

            return (
              <div key={award.id} className={`awards-card ${meta.cardClass}`}>
                <div className="awards-card__header">
                  <div className="awards-card__icon-wrapper">{meta.icon}</div>
                  <span className={`awards-card__badge ${meta.badgeClass}`}>
                    {award.awardValue1} {award.awardValue2 ? `(${award.awardValue2})` : ''}
                  </span>
                </div>

                <div className="awards-card__content">
                  <span className="awards-card__category">{meta.title}</span>
                  <div className="awards-card__winner">
                    {award.awardType === 'PARTIDO_DIFICIL' ? (
                      <span className="awards-card__winner-alias">{award.awardValue1}</span>
                    ) : (
                      <>
                        <UserAvatar
                          src={award.avatarUrl}
                          alt={award.memberAlias}
                          size="sm"
                        />
                        <div className="awards-card__winner-info">
                          <span className="awards-card__winner-alias">{award.memberAlias}</span>
                          {award.displayName && award.displayName !== award.memberAlias && (
                            <span className="awards-card__winner-sub">{award.displayName}</span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                  {award.notes && <p className="awards-card__notes">{award.notes}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
