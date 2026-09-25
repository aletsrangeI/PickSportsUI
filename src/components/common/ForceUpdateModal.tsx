import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import './ForceUpdateModal.css';

interface ForceUpdateModalProps {
  localVersion: string;
  minSupportedVersion: string | null;
  onUpdate: () => void;
}

export const ForceUpdateModal: React.FC<ForceUpdateModalProps> = ({
  localVersion,
  minSupportedVersion,
  onUpdate,
}) => {
  return (
    <div className="force-update-overlay" role="dialog" aria-modal="true" aria-labelledby="force-update-title">
      <div className="force-update-card">
        <div className="force-update-badge">
          <AlertTriangle size={32} />
        </div>
        <h2 id="force-update-title" className="force-update-title">
          Actualización Obligatoria
        </h2>
        <p className="force-update-description">
          Hemos actualizado PickSports con mejoras estructurales y correcciones esenciales para tus pronósticos. Por favor, recarga la aplicación para continuar utilizándola sin interrupciones.
        </p>
        <div className="force-update-version-tag">
          Tu versión: v{localVersion} {minSupportedVersion && `• Requerida: v${minSupportedVersion}+`}
        </div>
        <button
          type="button"
          className="force-update-button"
          onClick={onUpdate}
        >
          <RefreshCw size={18} />
          <span>Recargar PickSports</span>
        </button>
      </div>
    </div>
  );
};
