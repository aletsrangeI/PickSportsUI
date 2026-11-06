import React from 'react';
import { BadgeCheck, Loader2 } from 'lucide-react';
import type { AchievementDto } from '../../types';
import './TitlePicker.css';

interface TitlePickerProps {
  /** Trofeos desbloqueados de la temporada consultada (solo los que otorgan título). */
  unlocked: AchievementDto[];
  equippedTitleCode: string | null;
  equippedTitle: string | null;
  isBusy?: boolean;
  error?: string | null;
  onEquip: (code: string | null) => void;
}

export const TitlePicker: React.FC<TitlePickerProps> = ({
  unlocked,
  equippedTitleCode,
  equippedTitle,
  isBusy = false,
  error = null,
  onEquip,
}) => {
  const withTitle = unlocked.filter((a) => a.titleName);
  const equippedIsListed = withTitle.some((a) => a.code === equippedTitleCode);

  return (
    <section className="title-picker" aria-labelledby="title-picker-heading">
      <div className="title-picker__header">
        <h4 id="title-picker-heading" className="title-picker__heading">Título equipado</h4>
        {equippedTitleCode && (
          <button
            type="button"
            className="title-picker__clear"
            onClick={() => onEquip(null)}
            disabled={isBusy}
          >
            Quitar título
          </button>
        )}
      </div>

      <p className="title-picker__current">
        {equippedTitle ? (
          <>
            <BadgeCheck size={16} aria-hidden="true" />
            <strong>{equippedTitle}</strong>
          </>
        ) : (
          <span className="title-picker__empty">Ninguno. Los trofeos de Oro y Platino otorgan títulos.</span>
        )}
        {isBusy && <Loader2 size={14} className="spin" aria-label="Guardando" />}
      </p>

      {withTitle.length > 0 ? (
        <ul className="title-picker__list">
          {withTitle.map((a) => {
            const isEquipped = a.code === equippedTitleCode;
            return (
              <li key={a.id}>
                <button
                  type="button"
                  className={`title-picker__option title-picker__option--${a.tier.toLowerCase()}${isEquipped ? ' title-picker__option--active' : ''}`}
                  aria-pressed={isEquipped}
                  disabled={isBusy}
                  onClick={() => onEquip(isEquipped ? null : a.code)}
                >
                  <span className="title-picker__option-name">{a.titleName}</span>
                  <span className="title-picker__option-source">{a.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="title-picker__hint">
          Aún no tienes títulos en esta temporada. Puedes equipar los de temporadas anteriores cambiando la temporada en la vitrina.
        </p>
      )}

      {equippedTitleCode && !equippedIsListed && (
        <p className="title-picker__hint">El título equipado pertenece a otra temporada.</p>
      )}

      {error && <p className="title-picker__error" role="alert">{error}</p>}
    </section>
  );
};
