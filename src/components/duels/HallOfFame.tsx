import React from 'react';
import { Landmark, RefreshCw, Skull } from 'lucide-react';
import { useGetHallOfFameQuery } from '../../services/api';
import { TotyCard } from './TotyCard';
import { CupEditor } from './CupEditor';
import './HallOfFame.css';

/** Salón de la Fama: una carta TOTY por campeón de duelos. */
export const HallOfFame: React.FC<{ hideWhenEmpty?: boolean }> = ({ hideWhenEmpty = false }) => {
  const { data, isLoading, isError } = useGetHallOfFameQuery();
  const entries = data?.data ?? [];

  // En Premios solo se muestra cuando ya hay campeón (no estorba con el mensaje vacío).
  if (hideWhenEmpty && (isLoading || isError || entries.length === 0)) return null;

  return (
    <section className="hall-of-fame" aria-labelledby="hall-of-fame-heading">
      <header className="hall-of-fame__header">
        <Landmark size={22} className="hall-of-fame__icon" />
        <div>
          <h2 id="hall-of-fame-heading" className="hall-of-fame__title">
            Salón de la Fama
          </h2>
          <p className="hall-of-fame__subtitle">Los Gladiadores Legendarios que conquistaron el Coliseo</p>
        </div>
      </header>

      {isLoading ? (
        <div className="hall-of-fame__state">
          <RefreshCw size={24} className="hall-of-fame__spin" />
          <p>Abriendo el salón...</p>
        </div>
      ) : isError || entries.length === 0 ? (
        <div className="hall-of-fame__empty">
          <Landmark size={40} className="hall-of-fame__empty-icon" />
          <h3>El salón espera a su primer campeón</h3>
          <p>
            Cuando termine el calendario de duelos de una temporada, el campeón aparecerá aquí con su carta de
            Gladiador Legendario.
          </p>
        </div>
      ) : (
        <div className="hall-of-fame__grid">
          {entries.map((entry) => (
            <div key={`${entry.quinielaId}-${entry.seasonId ?? 0}`} className="hall-of-fame__item">
              <TotyCard entry={entry} />
              {entry.punishmentText && (
                <p className="hall-of-fame__punishment">
                  <Skull size={14} />
                  <span>{entry.punishmentText}</span>
                </p>
              )}
              {entry.canEditCup && <CupEditor entry={entry} />}
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
