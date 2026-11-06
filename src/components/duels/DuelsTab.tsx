import React, { useRef, useState } from 'react';
import { AlertCircle, CalendarDays, Moon, RefreshCw, Swords, Zap } from 'lucide-react';
import {
  useGenerateDuelScheduleMutation,
  useGetDuelScheduleQuery,
  useGetDuelsQuery,
  useGetDuelStandingsQuery,
} from '../../services/api';
import type { DuelFixtureDto } from '../../types';
import { UserAvatar } from '../common/UserAvatar';
import { DuelStandingsTable } from './DuelStandingsTable';
import { MatchupScreen } from './MatchupScreen';
import './DuelsTab.css';

interface DuelsTabProps {
  quinielaId: number;
  isOwnerOrAdmin: boolean;
  currentUserId?: number;
}

const resultLabel = (f: DuelFixtureDto): string => {
  if (f.result === 'BYE') return 'Descansa';
  if (!f.isResolved || !f.result) return 'Pendiente';
  if (f.result === 'DRAW') return 'Empate';
  return f.result === 'HOME' ? `Gana ${f.home.alias}` : `Gana ${f.away?.alias ?? ''}`;
};

export const DuelsTab: React.FC<DuelsTabProps> = ({ quinielaId, isOwnerOrAdmin, currentUserId }) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [pickedWeek, setPickedWeek] = useState<number | null>(null);
  const [openFixtureId, setOpenFixtureId] = useState<number | null>(null);
  const [genError, setGenError] = useState<string | null>(null);

  const scheduleQuery = useGetDuelScheduleQuery(quinielaId, { skip: !quinielaId });
  const schedule = scheduleQuery.data?.data;
  const hasSchedule = !!schedule && schedule.duelWeeks.length > 0;

  const { data: fixturesResponse } = useGetDuelsQuery({ quinielaId }, { skip: !quinielaId || !hasSchedule });
  const { data: standingsResponse } = useGetDuelStandingsQuery(quinielaId, { skip: !quinielaId || !hasSchedule });
  const [generate, { isLoading: generating }] = useGenerateDuelScheduleMutation();

  const fixtures = fixturesResponse?.data ?? [];
  const standings = standingsResponse?.data ?? [];

  // Fecha por defecto: la primera con duelos pendientes; si todo está resuelto, la última.
  const defaultWeek = (() => {
    if (!schedule) return null;
    const pending = fixtures
      .filter((f) => !f.isResolved && f.result !== 'BYE')
      .map((f) => f.weekNumber)
      .sort((a, b) => a - b)[0];
    return pending ?? schedule.duelWeeks[schedule.duelWeeks.length - 1] ?? null;
  })();
  const selectedWeek = pickedWeek ?? defaultWeek;

  const handleGenerate = async () => {
    setGenError(null);
    try {
      await generate(quinielaId).unwrap();
      dialogRef.current?.close();
    } catch (err) {
      const e = err as { data?: { message?: string } };
      setGenError(e?.data?.message || 'No se pudo generar el calendario.');
    }
  };

  if (scheduleQuery.isLoading) {
    return (
      <div className="duels-tab__state">
        <RefreshCw size={24} className="duels-tab__spin" />
        <p>Cargando duelos...</p>
      </div>
    );
  }

  if (openFixtureId !== null) {
    return <MatchupScreen quinielaId={quinielaId} fixtureId={openFixtureId} onBack={() => setOpenFixtureId(null)} />;
  }

  if (!hasSchedule) {
    return (
      <div className="duels-tab__empty">
        <div className="duels-tab__empty-icon">
          <Swords size={30} />
        </div>
        <h3 className="duels-tab__empty-title">El Coliseo aún no abre sus puertas</h3>
        {isOwnerOrAdmin ? (
          <>
            <p className="duels-tab__empty-text">
              Genera el calendario de duelos: cada fecha enfrenta a los participantes uno contra uno. Quien acierte
              más gana. Una vez resuelto el primer duelo no se puede regenerar.
            </p>
            <button type="button" className="duels-tab__btn" onClick={() => dialogRef.current?.showModal()}>
              <CalendarDays size={16} />
              <span>Generar calendario</span>
            </button>
          </>
        ) : (
          <p className="duels-tab__empty-text">
            Todavía no hay calendario de duelos. El Owner o un Admin de la quiniela debe generarlo.
          </p>
        )}

        <dialog ref={dialogRef} className="duels-tab__dialog" onClose={() => setGenError(null)}>
          <h4 className="duels-tab__dialog-title">Generar calendario de duelos</h4>
          <p className="duels-tab__dialog-text">
            Se sortearán los enfrentamientos con los miembros actuales. Quien se una después no entrará en duelos
            hasta la siguiente temporada.
          </p>
          {genError && (
            <p className="duels-tab__dialog-error" role="alert">
              <AlertCircle size={14} />
              <span>{genError}</span>
            </p>
          )}
          <div className="duels-tab__dialog-actions">
            <button type="button" className="duels-tab__btn duels-tab__btn--ghost" onClick={() => dialogRef.current?.close()}>
              Cancelar
            </button>
            <button type="button" className="duels-tab__btn" onClick={handleGenerate} disabled={generating}>
              {generating ? <RefreshCw size={16} className="duels-tab__spin" /> : <Swords size={16} />}
              <span>{generating ? 'Generando...' : 'Confirmar y generar'}</span>
            </button>
          </div>
        </dialog>
      </div>
    );
  }

  const allWeeks = Array.from({ length: schedule.totalWeeks }, (_, i) => i + 1);
  const isRestWeek = selectedWeek !== null && schedule.restWeeks.includes(selectedWeek);
  const weekFixtures = fixtures.filter((f) => f.weekNumber === selectedWeek);

  return (
    <div className="duels-tab">
      <div className="duels-tab__rules">
        <Zap size={16} className="duels-tab__rules-icon" />
        <p>
          Victoria 3 pts, empate 1, derrota 0. Con 3 o más posiciones de diferencia en la Tabla General, un empate de
          aciertos lo gana el de abajo (Ventaja del Retador). Las fechas sin duelo son semanas de descanso.
        </p>
      </div>

      <div className="duels-tab__controls">
        <label className="duels-tab__label" htmlFor="duels-week-select">
          Fecha
        </label>
        <select
          id="duels-week-select"
          className="duels-tab__select"
          value={selectedWeek ?? ''}
          onChange={(e) => setPickedWeek(Number(e.target.value))}
        >
          {allWeeks.map((w) => (
            <option key={w} value={w}>
              Fecha {w}
              {schedule.restWeeks.includes(w) ? ' · Descanso' : ''}
            </option>
          ))}
        </select>
      </div>

      {isRestWeek ? (
        <div className="duels-tab__rest">
          <Moon size={20} />
          <span>Descanso: esta fecha no hay duelos.</span>
        </div>
      ) : (
        <ul className="duels-tab__list">
          {weekFixtures.map((f) => {
            const isBye = f.away === null;
            const mine = f.home.userId === currentUserId || f.away?.userId === currentUserId;
            return (
              <li key={f.id} className={`duel-card ${mine ? 'duel-card--mine' : ''}`}>
                <div className={`duel-card__side ${f.result === 'HOME' ? 'duel-card__side--won' : ''}`}>
                  <UserAvatar src={f.home.avatarUrl} alt={f.home.alias} size="sm" />
                  <span className="duel-card__alias">{f.home.alias}</span>
                </div>

                <div className="duel-card__center">
                  {isBye ? (
                    <span className="duel-card__bye">
                      <Moon size={14} />
                      <span>Descansa</span>
                    </span>
                  ) : (
                    <>
                      <span className="duel-card__score">
                        {f.isResolved ? `${f.homeHits} - ${f.awayHits}` : 'vs'}
                      </span>
                      <span className="duel-card__status">{resultLabel(f)}</span>
                      {f.wonByAdvantage && (
                        <span className="duel-card__advantage">
                          <Zap size={11} />
                          <span>Ventaja del Retador</span>
                        </span>
                      )}
                    </>
                  )}
                </div>

                {isBye ? (
                  <div className="duel-card__side duel-card__side--empty" />
                ) : (
                  <div className={`duel-card__side duel-card__side--away ${f.result === 'AWAY' ? 'duel-card__side--won' : ''}`}>
                    <span className="duel-card__alias">{f.away!.alias}</span>
                    <UserAvatar src={f.away!.avatarUrl} alt={f.away!.alias} size="sm" />
                  </div>
                )}

                {!isBye && (
                  <button type="button" className="duel-card__open" onClick={() => setOpenFixtureId(f.id)}>
                    Ver cara a cara
                  </button>
                )}
              </li>
            );
          })}
          {weekFixtures.length === 0 && <li className="duels-tab__none">No hay duelos en esta fecha.</li>}
        </ul>
      )}

      <DuelStandingsTable standings={standings} currentUserId={currentUserId} />
    </div>
  );
};
