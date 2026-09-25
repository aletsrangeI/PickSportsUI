import React from 'react';
import { Sparkles, RefreshCw, X } from 'lucide-react';
import './UpdateNotificationBanner.css';

interface UpdateNotificationBannerProps {
  version: string | null;
  onUpdate: () => void;
  onDismiss: () => void;
}

export const UpdateNotificationBanner: React.FC<UpdateNotificationBannerProps> = ({
  version,
  onUpdate,
  onDismiss,
}) => {
  return (
    <aside className="update-banner-container" aria-label="Notificación de actualización de la aplicación">
      <div className="update-banner-capsule">
        <div className="update-banner-icon">
          <Sparkles size={18} className="sparkle-icon" />
        </div>
        <div className="update-banner-content">
          <span className="update-banner-title">Nueva versión disponible</span>
          {version && <span className="update-banner-version">v{version}</span>}
        </div>
        <div className="update-banner-actions">
          <button
            type="button"
            className="update-banner-button"
            onClick={onUpdate}
            aria-label="Actualizar ahora"
          >
            <RefreshCw size={14} className="refresh-icon" />
            <span>Actualizar</span>
          </button>
          <button
            type="button"
            className="update-banner-dismiss"
            onClick={onDismiss}
            aria-label="Cerrar notificación de actualización"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};
