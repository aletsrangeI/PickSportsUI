import React, { useState } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  MessageCircle,
} from 'lucide-react';
import { useGetClaimLinksQuery } from '../../services/api';
import './ClaimLinksModal.css';

interface ClaimLinksModalProps {
  quinielaId: number;
  quinielaName?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ClaimLinksModal: React.FC<ClaimLinksModalProps> = ({
  quinielaId,
  quinielaName,
  isOpen,
  onClose,
}) => {
  const { data: claimResponse, isLoading, isError, refetch } = useGetClaimLinksQuery(
    quinielaId,
    { skip: !isOpen || !quinielaId }
  );

  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const members = claimResponse?.data || [];
  const pendingMembers = members.filter((m) => !m.isClaimed);
  const claimedMembers = members.filter((m) => m.isClaimed);

  const handleCopyLink = async (memberId: number, url?: string) => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(`link-${memberId}`);
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      // fallback
    }
  };

  const handleCopyMessage = async (memberId: number, message?: string) => {
    if (!message) return;
    try {
      await navigator.clipboard.writeText(message);
      setCopiedId(`msg-${memberId}`);
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      // fallback
    }
  };

  const handleOpenWhatsApp = (message?: string) => {
    if (!message) return;
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="claim-modal-overlay" onClick={onClose}>
      <div className="claim-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="claim-modal__header">
          <div className="claim-modal__title-group">
            <div className="claim-modal__badge">
              <Sparkles size={14} />
              <span>Flujo de Activación WhatsApp</span>
            </div>
            <h2 className="claim-modal__title">Invitar / Activar Participantes</h2>
            <p className="claim-modal__subtitle">
              {quinielaName ? `Quiniela: ${quinielaName}` : 'Comparte a cada amigo su enlace para ligar sus puntos acumulados.'}
            </p>
          </div>
          <button type="button" className="claim-modal__close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Resumen de estados */}
        <div className="claim-modal__summary-bar">
          <div className="claim-modal__summary-item">
            <span className="claim-modal__summary-num text-warning">{pendingMembers.length}</span>
            <span className="claim-modal__summary-lbl">Pendientes de activar</span>
          </div>
          <div className="claim-modal__summary-divider" />
          <div className="claim-modal__summary-item">
            <span className="claim-modal__summary-num text-primary">{claimedMembers.length}</span>
            <span className="claim-modal__summary-lbl">Cuentas activas</span>
          </div>
        </div>

        {/* Contenido / Listado */}
        <div className="claim-modal__body">
          {isLoading && (
            <div className="claim-modal__loading">
              <div className="claim-modal__spinner" />
              <span>Generando enlaces de activación seguros...</span>
            </div>
          )}

          {isError && (
            <div className="alert alert--error">
              Error al consultar los enlaces. Asegúrate de ser el administrador de esta quiniela.
            </div>
          )}

          {!isLoading && members.length === 0 && (
            <div className="claim-modal__empty">
              No hay miembros registrados en esta quiniela.
            </div>
          )}

          {/* Participantes pendientes de activación */}
          {pendingMembers.length > 0 && (
            <div className="claim-modal__section">
              <h4 className="claim-modal__section-title">
                <Clock size={16} className="text-warning" />
                Por Activar ({pendingMembers.length})
              </h4>

              <div className="claim-modal__list">
                {pendingMembers.map((m) => {
                  const isLinkCopied = copiedId === `link-${m.memberId}`;
                  const isMsgCopied = copiedId === `msg-${m.memberId}`;

                  return (
                    <div key={m.memberId} className="claim-card claim-card--pending">
                      <div className="claim-card__top">
                        <div className="claim-card__user-info">
                          <span className="claim-card__alias">{m.alias}</span>
                          <span className="claim-card__hits">{m.totalHits} aciertos acumulados</span>
                        </div>
                        <span className="claim-card__badge claim-card__badge--pending">
                          ⏳ Pendiente
                        </span>
                      </div>

                      <div className="claim-card__preview">
                        <span className="claim-card__preview-label">Mensaje para WhatsApp:</span>
                        <p className="claim-card__preview-text">
                          "{m.shareMessage || m.claimUrl}"
                        </p>
                      </div>

                      <div className="claim-card__actions">
                        <button
                          type="button"
                          className="btn btn--primary claim-card__btn-wa"
                          onClick={() => handleOpenWhatsApp(m.shareMessage)}
                          title="Abrir WhatsApp para enviar"
                        >
                          <MessageCircle size={16} />
                          <span>WhatsApp</span>
                          <ExternalLink size={12} />
                        </button>

                        <button
                          type="button"
                          className="btn btn--outline claim-card__btn-action"
                          onClick={() => handleCopyMessage(m.memberId, m.shareMessage)}
                          title="Copiar mensaje con saludo y link"
                        >
                          {isMsgCopied ? <Check size={16} className="text-primary" /> : <Copy size={16} />}
                          <span>{isMsgCopied ? '¡Copiado!' : 'Copiar Texto'}</span>
                        </button>

                        <button
                          type="button"
                          className="btn btn--outline claim-card__btn-action"
                          onClick={() => handleCopyLink(m.memberId, m.claimUrl)}
                          title="Copiar únicamente el enlace"
                        >
                          {isLinkCopied ? <Check size={16} className="text-primary" /> : <Share2 size={16} />}
                          <span>{isLinkCopied ? '¡Link Copiado!' : 'Link'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Participantes que ya activaron */}
          {claimedMembers.length > 0 && (
            <div className="claim-modal__section" style={{ marginTop: '1.5rem' }}>
              <h4 className="claim-modal__section-title">
                <CheckCircle2 size={16} className="text-primary" />
                Cuentas Ya Activadas ({claimedMembers.length})
              </h4>

              <div className="claim-modal__list">
                {claimedMembers.map((m) => (
                  <div key={m.memberId} className="claim-card claim-card--claimed">
                    <div className="claim-card__top">
                      <div className="claim-card__user-info">
                        <span className="claim-card__alias">{m.alias}</span>
                        <span className="claim-card__email">{m.email}</span>
                      </div>
                      <div className="claim-card__right">
                        <span className="claim-card__hits">{m.totalHits} pts</span>
                        <span className="claim-card__badge claim-card__badge--claimed">
                          ✓ Activo
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="claim-modal__footer">
          <p className="claim-modal__footer-tip">
            💡 <strong>¿Cómo funciona?</strong> Tu amigo da tap al link desde su celular, escribe su
            correo real y contraseña. Inmediatamente queda logueado con todos sus puntos y premios
            de las Jornadas 1 a 9.
          </p>
          <button type="button" className="btn btn--outline" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
export default ClaimLinksModal;
