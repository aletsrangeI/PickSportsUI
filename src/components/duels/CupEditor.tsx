import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Save } from 'lucide-react';
import { useUpdateDuelCupMutation } from '../../services/api';
import type { HallOfFameEntryDto } from '../../types';
import './CupEditor.css';

export const CUP_NAME_MAX = 60;
export const PUNISHMENT_MAX = 200;

interface CupEditorProps {
  entry: HallOfFameEntryDto;
}

/** El campeón nombra la copa y el castigo para el resto del grupo. */
export const CupEditor: React.FC<CupEditorProps> = ({ entry }) => {
  const [cupName, setCupName] = useState(entry.cupName ?? '');
  const [punishment, setPunishment] = useState(entry.punishmentText ?? '');
  const [status, setStatus] = useState<{ type: 'ok' | 'error'; message: string } | null>(null);
  const [updateCup, { isLoading }] = useUpdateDuelCupMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    try {
      await updateCup({
        quinielaId: entry.quinielaId,
        cupName: cupName.trim(),
        punishmentText: punishment.trim(),
      }).unwrap();
      setStatus({ type: 'ok', message: 'Copa guardada.' });
    } catch (err) {
      const apiErr = err as { data?: { message?: string } };
      setStatus({ type: 'error', message: apiErr?.data?.message || 'No se pudo guardar la copa.' });
    }
  };

  return (
    <form className="cup-editor" onSubmit={handleSubmit}>
      <h4 className="cup-editor__heading">Tu copa, tus reglas</h4>

      <div className="cup-editor__field">
        <label className="cup-editor__label" htmlFor={`cup-name-${entry.quinielaId}`}>
          Nombre de la copa
        </label>
        <input
          id={`cup-name-${entry.quinielaId}`}
          className="cup-editor__input"
          type="text"
          maxLength={CUP_NAME_MAX}
          value={cupName}
          onChange={(e) => setCupName(e.target.value)}
          placeholder="Copa del Gladiador"
        />
        <span className="cup-editor__counter">
          {cupName.length}/{CUP_NAME_MAX}
        </span>
      </div>

      <div className="cup-editor__field">
        <label className="cup-editor__label" htmlFor={`cup-punish-${entry.quinielaId}`}>
          Castigo para el último lugar
        </label>
        <textarea
          id={`cup-punish-${entry.quinielaId}`}
          className="cup-editor__input cup-editor__input--area"
          maxLength={PUNISHMENT_MAX}
          rows={3}
          value={punishment}
          onChange={(e) => setPunishment(e.target.value)}
          placeholder="Invitar los tacos de la próxima reunión"
        />
        <span className="cup-editor__counter">
          {punishment.length}/{PUNISHMENT_MAX}
        </span>
      </div>

      <div className="cup-editor__actions">
        <button type="submit" className="cup-editor__submit" disabled={isLoading}>
          {isLoading ? <Loader2 size={15} className="cup-editor__spin" /> : <Save size={15} />}
          <span>{isLoading ? 'Guardando...' : 'Guardar copa'}</span>
        </button>
        {status && (
          <span className={`cup-editor__status cup-editor__status--${status.type}`} role="status">
            {status.type === 'ok' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
            <span>{status.message}</span>
          </span>
        )}
      </div>
    </form>
  );
};
