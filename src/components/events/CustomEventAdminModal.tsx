import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Check,
  CheckCircle2,
  AlertCircle,
  Calendar,
  HelpCircle,
  Trophy,
  Sparkles,
  Clock,
  Image,
} from 'lucide-react';
import {
  useCreateEventRoundMutation,
  useUpdateEventRoundMutation,
  useAddEventQuestionMutation,
  useResolveEventRoundMutation,
} from '../../services/api';
import type {
  EventRoundSummaryDto,
  EventRoundDetailDto,
  EventQuestionDto,
  CreateEventOptionItem,
} from '../../types';

// Helper to convert UTC date string to datetime-local format for input
const toDateTimeLocal = (dateUtcStr?: string): string => {
  if (!dateUtcStr) {
    const d = new Date();
    d.setHours(d.getHours() + 24);
    d.setMinutes(0, 0, 0);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  }
  const d = new Date(dateUtcStr);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

// ─────────────────────────────────────────────────────────────────────────────
// MODAL 1: CREAR O EDITAR RONDA
// ─────────────────────────────────────────────────────────────────────────────

interface RoundModalProps {
  quinielaId: number;
  existingRound?: EventRoundSummaryDto | EventRoundDetailDto | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CreateOrEditRoundModal: React.FC<RoundModalProps> = ({
  quinielaId,
  existingRound,
  onClose,
  onSuccess,
}) => {
  const isEditing = Boolean(existingRound);
  const [title, setTitle] = useState(existingRound?.title || '');
  const [lockDateLocal, setLockDateLocal] = useState(
    toDateTimeLocal(existingRound?.lockDateUtc)
  );
  const [roundOrder, setRoundOrder] = useState<number>(existingRound?.roundOrder || 1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [createRound, { isLoading: isCreating }] = useCreateEventRoundMutation();
  const [updateRound, { isLoading: isUpdating }] = useUpdateEventRoundMutation();
  const isLoading = isCreating || isUpdating;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim()) {
      setErrorMessage('Ingresa el título o nombre de la ronda.');
      return;
    }

    if (!lockDateLocal) {
      setErrorMessage('Selecciona la fecha y hora de cierre de pronósticos.');
      return;
    }

    const lockDateUtc = new Date(lockDateLocal).toISOString();

    try {
      if (isEditing && existingRound) {
        await updateRound({
          quinielaId,
          roundId: existingRound.id,
          body: {
            title: title.trim(),
            lockDateUtc,
            status: existingRound.status,
          },
        }).unwrap();
      } else {
        await createRound({
          quinielaId,
          body: {
            title: title.trim(),
            lockDateUtc,
            roundOrder: Number(roundOrder) || 1,
          },
        }).unwrap();
      }

      onSuccess?.();
      onClose();
    } catch (err: any) {
      setErrorMessage(
        err?.data?.message || err?.message || 'Error al guardar la ronda de eventos.'
      );
    }
  };

  return (
    <div className="custom-event-modal-backdrop" onClick={onClose}>
      <div
        className="custom-event-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="custom-event-modal__header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={20} style={{ color: 'var(--color-primary)' }} />
            <h3 className="custom-event-modal__title">
              {isEditing ? 'Editar Ronda de Eventos' : 'Crear Nueva Ronda'}
            </h3>
          </div>
          <button
            type="button"
            className="custom-event-modal__close"
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="custom-event-modal__body">
          {errorMessage && (
            <div className="custom-event-alert custom-event-alert--error">
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="custom-event-form-group">
            <label className="custom-event-label" htmlFor="round-title">
              Título de la Ronda / Gala *
            </label>
            <input
              id="round-title"
              type="text"
              className="custom-event-input"
              placeholder="Ej. Semana 3 - Gran Eliminación, Premios Oscar 2026..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              minLength={3}
              maxLength={120}
              autoFocus
            />
          </div>

          <div className="custom-event-form-group">
            <label className="custom-event-label" htmlFor="round-lock-date">
              Fecha y Hora de Cierre (Límite de Pronósticos) *
            </label>
            <input
              id="round-lock-date"
              type="datetime-local"
              className="custom-event-input"
              value={lockDateLocal}
              onChange={(e) => setLockDateLocal(e.target.value)}
              required
            />
            <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '4px' }}>
              Al llegar esta hora, los pronósticos se bloquean y se revelan las elecciones de los rivales.
            </small>
          </div>

          {!isEditing && (
            <div className="custom-event-form-group">
              <label className="custom-event-label" htmlFor="round-order">
                Número de Orden de la Ronda
              </label>
              <input
                id="round-order"
                type="number"
                min="1"
                max="100"
                className="custom-event-input"
                value={roundOrder}
                onChange={(e) => setRoundOrder(Number(e.target.value))}
              />
            </div>
          )}

          <div className="custom-event-modal__actions">
            <button
              type="button"
              className="btn btn--outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={isLoading}
            >
              {isLoading ? 'Guardando...' : isEditing ? 'Actualizar Ronda' : 'Publicar Ronda'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MODAL 2: AGREGAR PREGUNTA A LA RONDA
// ─────────────────────────────────────────────────────────────────────────────

interface AddQuestionModalProps {
  quinielaId: number;
  roundId: number;
  existingQuestionsCount?: number;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AddQuestionModal: React.FC<AddQuestionModalProps> = ({
  quinielaId,
  roundId,
  existingQuestionsCount = 0,
  onClose,
  onSuccess,
}) => {
  const [questionText, setQuestionText] = useState('');
  const [description, setDescription] = useState('');
  const [points, setPoints] = useState<number>(1);
  const [options, setOptions] = useState<CreateEventOptionItem[]>([
    { optionText: '', imageUrl: '', optionOrder: 1 },
    { optionText: '', imageUrl: '', optionOrder: 2 },
  ]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [addQuestion, { isLoading }] = useAddEventQuestionMutation();

  const handleAddOption = () => {
    setOptions((prev) => [
      ...prev,
      { optionText: '', imageUrl: '', optionOrder: prev.length + 1 },
    ]);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) {
      setErrorMessage('Una pregunta debe tener al menos 2 opciones de respuesta.');
      return;
    }
    setOptions((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((opt, i) => ({ ...opt, optionOrder: i + 1 }))
    );
  };

  const handleOptionChange = (
    index: number,
    field: 'optionText' | 'imageUrl',
    value: string
  ) => {
    setOptions((prev) =>
      prev.map((opt, i) => (i === index ? { ...opt, [field]: value } : opt))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!questionText.trim()) {
      setErrorMessage('Escribe el texto de la pregunta.');
      return;
    }

    const validOptions = options.map((opt, idx) => ({
      optionText: opt.optionText.trim(),
      imageUrl: opt.imageUrl?.trim() || null,
      optionOrder: idx + 1,
    }));

    if (validOptions.length < 2) {
      setErrorMessage('Ingresa al menos 2 opciones.');
      return;
    }

    if (validOptions.some((opt) => !opt.optionText)) {
      setErrorMessage('Todas las opciones deben tener un texto con el nombre o respuesta.');
      return;
    }

    try {
      await addQuestion({
        quinielaId,
        roundId,
        body: {
          questionText: questionText.trim(),
          description: description.trim() || null,
          points: Number(points) > 0 ? Number(points) : 1,
          questionType: 'SingleChoice',
          questionOrder: existingQuestionsCount + 1,
          options: validOptions,
        },
      }).unwrap();

      onSuccess?.();
      onClose();
    } catch (err: any) {
      setErrorMessage(
        err?.data?.message || err?.message || 'Error al agregar la pregunta a la ronda.'
      );
    }
  };

  return (
    <div className="custom-event-modal-backdrop" onClick={onClose}>
      <div
        className="custom-event-modal custom-event-modal--lg"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="custom-event-modal__header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HelpCircle size={20} style={{ color: 'var(--color-primary)' }} />
            <h3 className="custom-event-modal__title">Agregar Pregunta a la Ronda</h3>
          </div>
          <button
            type="button"
            className="custom-event-modal__close"
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="custom-event-modal__body">
          {errorMessage && (
            <div className="custom-event-alert custom-event-alert--error">
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="custom-event-form-group">
            <label className="custom-event-label" htmlFor="question-text">
              Pregunta *
            </label>
            <input
              id="question-text"
              type="text"
              className="custom-event-input"
              placeholder="Ej. ¿Quién es el 3er habitante eliminado? o ¿Quién gana Mejor Actor?"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              required
              minLength={3}
              maxLength={250}
              autoFocus
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: '12px' }}>
            <div className="custom-event-form-group">
              <label className="custom-event-label" htmlFor="question-desc">
                Detalle / Contexto (Opcional)
              </label>
              <input
                id="question-desc"
                type="text"
                className="custom-event-input"
                placeholder="Ej. Según la votación del público en la gala de eliminación"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={200}
              />
            </div>

            <div className="custom-event-form-group">
              <label className="custom-event-label" htmlFor="question-points">
                Valor (Puntos) *
              </label>
              <input
                id="question-points"
                type="number"
                min="1"
                max="50"
                className="custom-event-input"
                value={points}
                onChange={(e) => setPoints(Number(e.target.value))}
                required
              />
            </div>
          </div>

          {/* Opciones dinámicas */}
          <div style={{ marginTop: '12px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px',
              }}
            >
              <label className="custom-event-label" style={{ margin: 0 }}>
                Opciones de Respuesta ({options.length}) *
              </label>
              <button
                type="button"
                className="btn btn--outline btn--sm"
                onClick={handleAddOption}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <Plus size={14} />
                <span>Añadir Opción</span>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto', paddingRight: '4px' }}>
              {options.map((opt, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 10px',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <span
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: 'var(--text-secondary)',
                      flexShrink: 0,
                    }}
                  >
                    {idx + 1}
                  </span>

                  <input
                    type="text"
                    className="custom-event-input"
                    placeholder={`Opción ${idx + 1} (ej. Mario Bezares)`}
                    value={opt.optionText}
                    onChange={(e) => handleOptionChange(idx, 'optionText', e.target.value)}
                    style={{ flex: 1 }}
                    required
                  />

                  <div style={{ position: 'relative', width: '160px', flexShrink: 0 }}>
                    <input
                      type="url"
                      className="custom-event-input"
                      placeholder="URL foto (opcional)"
                      value={opt.imageUrl || ''}
                      onChange={(e) => handleOptionChange(idx, 'imageUrl', e.target.value)}
                      style={{ fontSize: '0.75rem', paddingLeft: '24px' }}
                    />
                    <Image
                      size={12}
                      style={{
                        position: 'absolute',
                        left: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-muted)',
                      }}
                    />
                  </div>

                  <button
                    type="button"
                    className="btn btn--outline btn--sm"
                    onClick={() => handleRemoveOption(idx)}
                    disabled={options.length <= 2}
                    title="Eliminar opción"
                    style={{
                      padding: '6px',
                      color: options.length <= 2 ? 'var(--text-muted)' : 'var(--color-danger)',
                      borderColor: 'transparent',
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="custom-event-modal__actions" style={{ marginTop: '16px' }}>
            <button
              type="button"
              className="btn btn--outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={isLoading}
            >
              {isLoading ? 'Guardando Pregunta...' : 'Guardar Pregunta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MODAL 3: PANEL DE DICTAMEN RÁPIDO (RESOLVER RONDA Y ASIGNAR PUNTOS)
// ─────────────────────────────────────────────────────────────────────────────

interface ResolveRoundModalProps {
  quinielaId: number;
  round: EventRoundDetailDto;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ResolveRoundModal: React.FC<ResolveRoundModalProps> = ({
  quinielaId,
  round,
  onClose,
  onSuccess,
}) => {
  // Initialize resolutions map with any existing winner options
  const [resolutions, setResolutions] = useState<Record<number, number>>(() => {
    const initial: Record<number, number> = {};
    round.questions.forEach((q) => {
      const winner = q.options.find((opt) => opt.isCorrect === true);
      if (winner) {
        initial[q.id] = winner.id;
      }
    });
    return initial;
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resolveRound, { isLoading }] = useResolveEventRoundMutation();

  const handleSelectWinner = (questionId: number, optionId: number) => {
    setResolutions((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const answeredCount = Object.keys(resolutions).length;
  const totalQuestions = round.questions.length;
  const isAllAnswered = totalQuestions > 0 && answeredCount === totalQuestions;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (totalQuestions === 0) {
      setErrorMessage('Esta ronda no tiene preguntas para calificar.');
      return;
    }

    if (!isAllAnswered) {
      setErrorMessage(
        `Has marcado ganador en ${answeredCount} de ${totalQuestions} preguntas. Por favor selecciona el ganador oficial de cada pregunta.`
      );
      return;
    }

    try {
      const payloadResolutions = Object.entries(resolutions).map(([qId, optId]) => ({
        eventQuestionId: Number(qId),
        winningOptionId: optId,
      }));

      await resolveRound({
        quinielaId,
        roundId: round.id,
        body: {
          resolutions: payloadResolutions,
        },
      }).unwrap();

      onSuccess?.();
      onClose();
    } catch (err: any) {
      setErrorMessage(
        err?.data?.message || err?.message || 'Error al dictaminar los resultados de la ronda.'
      );
    }
  };

  return (
    <div className="custom-event-modal-backdrop" onClick={onClose}>
      <div
        className="custom-event-modal custom-event-modal--lg"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="custom-event-modal__header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Trophy size={20} style={{ color: 'var(--color-primary)' }} />
            <div>
              <h3 className="custom-event-modal__title">Dictaminar Resultados Oficiales</h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {round.title} • {answeredCount} de {totalQuestions} resueltas
              </span>
            </div>
          </div>
          <button
            type="button"
            className="custom-event-modal__close"
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="custom-event-modal__body">
          {errorMessage && (
            <div className="custom-event-alert custom-event-alert--error">
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          <div
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              fontSize: '0.8125rem',
              color: 'var(--text-secondary)',
              marginBottom: '12px',
            }}
          >
            Haz clic en la opción que resultó ganadora en cada pregunta. Al finalizar, el sistema evaluará automáticamente los aciertos de todos los miembros y sumará los puntos en tiempo real a la tabla general.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
            {round.questions.map((q, qIndex) => {
              const selectedOptionId = resolutions[q.id];
              return (
                <div
                  key={q.id}
                  style={{
                    padding: '14px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '10px',
                    }}
                  >
                    <div>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--color-primary)',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}
                      >
                        Pregunta #{qIndex + 1}
                      </span>
                      <h4 style={{ margin: '2px 0 0 0', fontSize: '0.9375rem', color: 'var(--text-main)' }}>
                        {q.questionText}
                      </h4>
                      {q.description && (
                        <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {q.description}
                        </p>
                      )}
                    </div>
                    <span className="badge badge--accent" style={{ fontSize: '0.75rem' }}>
                      +{q.points} pt{q.points > 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Fichas de opciones seleccionables con un solo clic */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                      gap: '8px',
                    }}
                  >
                    {q.options.map((opt) => {
                      const isWinner = selectedOptionId === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          className={`quick-resolve-chip ${isWinner ? 'quick-resolve-chip--winner' : ''}`}
                          onClick={() => handleSelectWinner(q.id, opt.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 12px',
                            borderRadius: 'var(--radius-sm)',
                            border: isWinner
                              ? '2px solid var(--color-primary)'
                              : '1px solid var(--border-subtle)',
                            backgroundColor: isWinner
                              ? 'rgba(16, 185, 129, 0.2)'
                              : 'var(--bg-surface)',
                            color: isWinner ? 'var(--color-primary)' : 'var(--text-main)',
                            cursor: 'pointer',
                            textAlign: 'left',
                            boxShadow: isWinner ? 'var(--shadow-glow)' : 'none',
                            transition: 'all var(--transition-fast)',
                          }}
                        >
                          {opt.imageUrl ? (
                            <img
                              src={opt.imageUrl}
                              alt={opt.optionText}
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                objectFit: 'cover',
                                flexShrink: 0,
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                backgroundColor: isWinner
                                  ? 'var(--color-primary)'
                                  : 'rgba(255, 255, 255, 0.1)',
                                color: isWinner ? 'var(--text-on-primary)' : 'var(--text-secondary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                flexShrink: 0,
                              }}
                            >
                              {opt.optionText.slice(0, 2).toUpperCase()}
                            </div>
                          )}

                          <span style={{ flex: 1, fontSize: '0.8125rem', fontWeight: 600 }}>
                            {opt.optionText}
                          </span>

                          {isWinner && <CheckCircle2 size={16} style={{ color: 'var(--color-primary)' }} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="custom-event-modal__actions" style={{ marginTop: '16px' }}>
            <button
              type="button"
              className="btn btn--outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={isLoading || !isAllAnswered}
              style={{
                boxShadow: isAllAnswered ? 'var(--shadow-glow)' : 'none',
              }}
            >
              {isLoading ? 'Calificando y asignando puntos...' : '✓ Finalizar Ronda y Asignar Puntos'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
