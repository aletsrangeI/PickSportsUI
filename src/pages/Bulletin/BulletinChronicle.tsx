import React, { useState } from 'react';
import {
  Sparkles,
  Newspaper,
  RefreshCw,
  Pencil,
  Check,
  X,
  Share2,
  Cpu,
} from 'lucide-react';

interface BulletinChronicleProps {
  headline?: string | null;
  chronicle?: string | null;
  generatedByAi?: boolean;
  narrativeModel?: string | null;
  weekNumber: number;
  isOwnerOrAdmin: boolean;
  isEditing: boolean;
  headlineDraft: string;
  chronicleDraft: string;
  isRegenerating: boolean;
  isSaving: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onRegenerate: () => void;
  onChangeHeadlineDraft: (val: string) => void;
  onChangeChronicleDraft: (val: string) => void;
}

export const BulletinChronicle: React.FC<BulletinChronicleProps> = ({
  headline,
  chronicle,
  generatedByAi,
  narrativeModel,
  weekNumber,
  isOwnerOrAdmin,
  isEditing,
  headlineDraft,
  chronicleDraft,
  isRegenerating,
  isSaving,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onRegenerate,
  onChangeHeadlineDraft,
  onChangeChronicleDraft,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyWhatsApp = () => {
    if (!chronicle) return;
    const textToCopy = `📰 *${headline || `Crónica de la Jornada ${weekNumber}`}*\n\n${chronicle}`;
    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      })
      .catch((err) => console.error('Error al copiar crónica:', err));
  };

  const renderFormattedParagraphs = (rawText: string) => {
    const paragraphs = rawText.split(/\n\s*\n/);
    return paragraphs.map((p, idx) => {
      const trimmed = p.trim();
      if (!trimmed) return null;

      // Renderizado seguro de **bold** y *italic*
      const parts = trimmed.split(/(\*\*.*?\*\*|\*.*?\*)/g);
      return (
        <p key={idx} className="bulletin-chronicle__paragraph">
          {parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={pIdx}>{part.slice(2, -2)}</strong>;
            }
            if (part.startsWith('*') && part.endsWith('*')) {
              return <em key={pIdx}>{part.slice(1, -1)}</em>;
            }
            return part;
          })}
        </p>
      );
    });
  };

  return (
    <section className="bulletin-paper__section bulletin-chronicle" aria-label="Crónica de la Jornada">
      <div className="bulletin-chronicle__top-bar">
        <div className="bulletin-chronicle__tags">
          <span className="bulletin-chronicle__tag bulletin-chronicle__tag--primary">
            <Newspaper size={13} strokeWidth={2.5} />
            Crónica de la Jornada
          </span>
          {generatedByAi && (
            <span className="bulletin-chronicle__tag bulletin-chronicle__tag--ai" title={`Modelo: ${narrativeModel || 'Gemini'}`}>
              <Sparkles size={12} strokeWidth={2.5} />
              Redactado con IA
            </span>
          )}
        </div>

        <div className="bulletin-chronicle__actions">
          {chronicle && !isEditing && (
            <button
              type="button"
              className="bulletin-chronicle__btn bulletin-chronicle__btn--copy"
              onClick={handleCopyWhatsApp}
              title="Copiar texto para compartir en WhatsApp"
            >
              {copied ? (
                <>
                  <Check size={13} strokeWidth={2.5} /> Copiado
                </>
              ) : (
                <>
                  <Share2 size={13} strokeWidth={2} /> WhatsApp
                </>
              )}
            </button>
          )}

          {isOwnerOrAdmin && !isEditing && (
            <>
              <button
                type="button"
                className="bulletin-chronicle__btn bulletin-chronicle__btn--regen"
                onClick={onRegenerate}
                disabled={isRegenerating}
                title="Regenerar la crónica con Gemini"
              >
                <RefreshCw size={13} strokeWidth={2} className={isRegenerating ? 'animate-spin' : ''} />
                {isRegenerating ? 'Generando...' : 'Regenerar con IA'}
              </button>
              <button
                type="button"
                className="bulletin-chronicle__btn bulletin-chronicle__btn--edit"
                onClick={onStartEdit}
                title="Editar titular y crónica manualmente"
              >
                <Pencil size={13} strokeWidth={2} /> Editar
              </button>
            </>
          )}
        </div>
      </div>

      {isEditing ? (
        <div className="bulletin-chronicle__editor">
          <div className="bulletin-chronicle__input-group">
            <label className="bulletin-chronicle__label" htmlFor="chronicle-headline-input">
              Titular de Portada
            </label>
            <input
              id="chronicle-headline-input"
              type="text"
              className="bulletin-chronicle__input"
              maxLength={250}
              value={headlineDraft}
              onChange={(e) => onChangeHeadlineDraft(e.target.value)}
              placeholder="Ej: Masacre en la Jornada: Dani reina en el caos..."
            />
          </div>

          <div className="bulletin-chronicle__input-group">
            <label className="bulletin-chronicle__label" htmlFor="chronicle-textarea">
              Cuerpo de la Crónica (soporta **negritas** y saltos de párrafo)
            </label>
            <textarea
              id="chronicle-textarea"
              className="bulletin-chronicle__textarea"
              rows={8}
              value={chronicleDraft}
              onChange={(e) => onChangeChronicleDraft(e.target.value)}
              placeholder="Escribe o afina la crónica deportiva..."
            />
          </div>

          <div className="bulletin-chronicle__editor-actions">
            <button
              type="button"
              className="bulletin-chronicle__btn bulletin-chronicle__btn--save"
              onClick={onSaveEdit}
              disabled={isSaving}
            >
              <Check size={14} strokeWidth={2.5} /> {isSaving ? 'Guardando...' : 'Guardar Crónica'}
            </button>
            <button
              type="button"
              className="bulletin-chronicle__btn bulletin-chronicle__btn--cancel"
              onClick={onCancelEdit}
              disabled={isSaving}
            >
              <X size={14} strokeWidth={2.5} /> Cancelar
            </button>
          </div>
        </div>
      ) : chronicle ? (
        <article className="bulletin-chronicle__article">
          <h2 className="bulletin-chronicle__headline">
            {headline || `El Recuento Oficial de la Jornada ${weekNumber}`}
          </h2>
          <div className="bulletin-chronicle__body">
            {renderFormattedParagraphs(chronicle)}
          </div>
          {narrativeModel && (
            <footer className="bulletin-chronicle__footer">
              <Cpu size={12} strokeWidth={2} />
              <span>Edición generada por {narrativeModel}</span>
            </footer>
          )}
        </article>
      ) : (
        <div className="bulletin-chronicle__empty">
          <p>Aún no se ha redactado la crónica para esta jornada.</p>
          {isOwnerOrAdmin && (
            <button
              type="button"
              className="bulletin-chronicle__btn bulletin-chronicle__btn--regen"
              onClick={onRegenerate}
              disabled={isRegenerating}
            >
              <Sparkles size={14} /> {isRegenerating ? 'Generando...' : 'Generar Crónica con IA'}
            </button>
          )}
        </div>
      )}
    </section>
  );
};
