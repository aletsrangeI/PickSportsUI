import React, { useEffect, useId, useRef, useState } from 'react';
import { X, CalendarPlus, AlertCircle } from 'lucide-react';
import { useStartNextSeasonMutation } from '../../services/api';
import type { Quiniela } from '../../types';
import './NextSeasonDialog.css';

interface NextSeasonDialogProps {
  quiniela: Quiniela;
  onClose: () => void;
  onCreated: (newQuiniela: Quiniela) => void | Promise<void>;
  ref?: React.Ref<HTMLDialogElement>;
}

export const NextSeasonDialog: React.FC<NextSeasonDialogProps> = ({
  quiniela,
  onClose,
  onCreated,
  ref,
}) => {
  const innerRef = useRef<HTMLDialogElement>(null);
  const nameId = useId();
  const [name, setName] = useState(quiniela.name);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [startNextSeason, { isLoading }] = useStartNextSeasonMutation();

  const setRefs = (node: HTMLDialogElement | null) => {
    innerRef.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) (ref as React.RefObject<HTMLDialogElement | null>).current = node;
  };

  useEffect(() => {
    const dialog = innerRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    try {
      const result = await startNextSeason({
        quinielaId: quiniela.id,
        request: { name: name.trim() || undefined },
      }).unwrap();

      if (result.isSuccess && result.data) {
        await onCreated(result.data);
      } else {
        setErrorMessage(result.message || 'No se pudo crear la nueva temporada.');
      }
    } catch (err) {
      const apiMessage = (err as { data?: { message?: string } })?.data?.message;
      setErrorMessage(apiMessage || 'Error de conexión al crear la nueva temporada.');
    }
  };

  return (
    <dialog
      ref={setRefs}
      className="modal next-season-dialog"
      aria-labelledby={`${nameId}-title`}
      onClose={onClose}
    >
      <div className="modal__handle" />
      <div className="modal__header">
        <div className="next-season-dialog__heading">
          <CalendarPlus className="quiniela-selector__icon" size={20} />
          <h2 className="modal__title" id={`${nameId}-title`}>
            Nueva temporada
          </h2>
        </div>
        <button
          type="button"
          className="modal__close"
          onClick={() => innerRef.current?.close()}
          aria-label="Cerrar"
        >
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="next-season-dialog__form">
        <div className="modal__body">
          <p className="next-season-dialog__text">
            Se creará una quiniela nueva para la siguiente temporada con los mismos miembros,
            roles y configuración, y todos los acumulados en cero. La quiniela actual pasará a{' '}
            <strong>Históricas</strong> y quedará de solo lectura.
          </p>

          {errorMessage && (
            <div className="alert alert--error" role="alert">
              <AlertCircle size={18} />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-group__label" htmlFor={nameId}>
              Nombre de la nueva quiniela
            </label>
            <input
              id={nameId}
              type="text"
              className="form-group__input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              autoFocus
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="modal__footer">
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => innerRef.current?.close()}
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button type="submit" className="btn btn--primary" disabled={isLoading || !name.trim()}>
            {isLoading ? 'Creando...' : 'Crear'}
          </button>
        </div>
      </form>
    </dialog>
  );
};
