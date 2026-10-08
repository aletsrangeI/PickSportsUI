import React, { useState } from 'react';
import { Pencil, X } from 'lucide-react';
import type { Match } from '../../types';
import { useUpdateMatchBroadcastersMutation } from '../../services/api';
import { KNOWN_BROADCASTERS } from './BroadcastBadgeList';
import './BroadcastEditor.css';

interface BroadcastEditorProps {
  match: Match;
  onResult?: (message: string, ok: boolean) => void;
}

const PENDING = 'Por confirmar';

/**
 * SPEC-015: editor rápido de canales para administradores (chips + sugerencias).
 * Guardar sin canales restablece la regla de localía en el backend.
 */
export const BroadcastEditor: React.FC<BroadcastEditorProps> = ({ match, onResult }) => {
  const [open, setOpen] = useState(false);
  const [channels, setChannels] = useState<string[]>([]);
  const [draft, setDraft] = useState('');
  const [updateBroadcasters, { isLoading }] = useUpdateMatchBroadcastersMutation();

  const startEditing = () => {
    setChannels((match.broadcasters ?? []).filter((c) => c !== PENDING));
    setDraft('');
    setOpen(true);
  };

  const addChannel = (value: string) => {
    const name = value.trim();
    if (!name) return;
    setChannels((prev) =>
      prev.some((c) => c.toLowerCase() === name.toLowerCase()) ? prev : [...prev, name],
    );
    setDraft('');
  };

  const removeChannel = (name: string) => setChannels((prev) => prev.filter((c) => c !== name));

  const save = async (next: string[]) => {
    try {
      const res = await updateBroadcasters({ matchId: match.id, weekId: match.weekId, channels: next }).unwrap();
      onResult?.(res.message, true);
      setOpen(false);
    } catch {
      onResult?.('No se pudieron guardar los canales.', false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addChannel(draft);
    }
  };

  if (!open) {
    return (
      <button type="button" className="broadcast-editor__toggle" onClick={startEditing}>
        <Pencil size={11} aria-hidden="true" /> Editar canales
      </button>
    );
  }

  const suggestions = KNOWN_BROADCASTERS.filter(
    (k) => !channels.some((c) => c.toLowerCase() === k.toLowerCase()),
  );

  return (
    <div className="broadcast-editor">
      <div className="broadcast-editor__chips">
        {channels.length === 0 && <span className="broadcast-editor__empty">Sin canales: se usará la regla de localía</span>}
        {channels.map((c) => (
          <span key={c} className="broadcast-editor__chip">
            {c}
            <button type="button" onClick={() => removeChannel(c)} aria-label={`Quitar ${c}`}>
              <X size={10} />
            </button>
          </span>
        ))}
      </div>

      <input
        className="broadcast-editor__input"
        list={`broadcast-suggestions-${match.id}`}
        placeholder="Agregar canal y presionar Enter"
        value={draft}
        maxLength={40}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <datalist id={`broadcast-suggestions-${match.id}`}>
        {suggestions.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>

      <div className="broadcast-editor__suggestions">
        {suggestions.slice(0, 8).map((s) => (
          <button key={s} type="button" className="broadcast-editor__suggestion" onClick={() => addChannel(s)}>
            + {s}
          </button>
        ))}
      </div>

      <div className="broadcast-editor__actions">
        <button type="button" className="btn btn--outline btn--sm" onClick={() => setOpen(false)} disabled={isLoading}>
          Cancelar
        </button>
        <button
          type="button"
          className="btn btn--outline btn--sm"
          onClick={() => save([])}
          disabled={isLoading}
          title="Quitar el ajuste manual y volver a los canales por localía"
        >
          Restablecer
        </button>
        <button
          type="button"
          className="btn btn--primary btn--sm"
          onClick={() => save(draft.trim() ? [...channels, draft.trim()] : channels)}
          disabled={isLoading}
        >
          {isLoading ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </div>
  );
};
