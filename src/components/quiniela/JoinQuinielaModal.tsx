import React, { useState, forwardRef } from 'react';
import { X, UserPlus, AlertCircle } from 'lucide-react';
import { useJoinQuinielaMutation, useGetQuinielasQuery } from '../../services/api';
import { useDispatch, useSelector } from 'react-redux';
import { setActiveQuinielaId } from '../../store/quinielaSlice';
import type { RootState } from '../../store';

interface JoinQuinielaModalProps {
  onClose: () => void;
}

export const JoinQuinielaModal = forwardRef<HTMLDialogElement, JoinQuinielaModalProps>(
  ({ onClose }, ref) => {
    const user = useSelector((state: RootState) => state.auth.user);
    const [inviteCode, setInviteCode] = useState('');
    const [alias, setAlias] = useState(user?.displayName || user?.username || '');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const [joinQuiniela, { isLoading }] = useJoinQuinielaMutation();
    const { refetch: refetchQuinielas } = useGetQuinielasQuery();
    const dispatch = useDispatch();

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setErrorMessage(null);

      try {
        const result = await joinQuiniela({
          inviteCode: inviteCode.trim().toUpperCase(),
          alias: alias.trim(),
        }).unwrap();

        if (result.isSuccess && result.data) {
          dispatch(setActiveQuinielaId(result.data.quinielaId));
          await refetchQuinielas();
          setInviteCode('');
          onClose();
        } else {
          setErrorMessage(result.message || 'Error al unirse a la quiniela');
        }
      } catch (err: any) {
        setErrorMessage(
          err?.data?.message || 'Error de conexión o código de invitación inválido'
        );
      }
    };

    return (
      <dialog ref={ref} className="modal" onClose={onClose}>
        <div className="modal__handle" />
        <div className="modal__header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserPlus className="quiniela-selector__icon" size={20} />
            <h2 className="modal__title">Unirse a Quiniela</h2>
          </div>
          <button
            type="button"
            className="modal__close"
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <div className="modal__body">
            {errorMessage && (
              <div className="alert alert--error">
                <AlertCircle size={18} />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-group__label" htmlFor="join-code">
                Código de Invitación *
              </label>
              <input
                id="join-code"
                type="text"
                className="form-group__input"
                placeholder="Ej. MX-2026-X9"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                required
                maxLength={12}
                style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}
              />
            </div>

            <div className="form-group">
              <label className="form-group__label" htmlFor="join-alias">
                Tu Alias en esta Quiniela *
              </label>
              <input
                id="join-alias"
                type="text"
                className="form-group__input"
                placeholder="Ej. Gigi o El Profe"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                required
                minLength={2}
                maxLength={50}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Este es el nombre visible en la tabla general de posiciones.
              </span>
            </div>
          </div>

          <div className="modal__footer">
            <button
              type="button"
              className="btn btn--secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={isLoading || !inviteCode.trim() || !alias.trim()}
            >
              {isLoading ? 'Uniéndose...' : 'Unirme'}
            </button>
          </div>
        </form>
      </dialog>
    );
  }
);

JoinQuinielaModal.displayName = 'JoinQuinielaModal';
