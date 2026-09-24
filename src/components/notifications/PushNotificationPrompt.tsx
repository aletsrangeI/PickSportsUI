import React, { useState } from 'react';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import './PushNotificationPrompt.css';

interface PushNotificationPromptProps {
  /** Si true, se muestra en modo widget integrado (e.g. en Settings o Perfil) */
  inline?: boolean;
}

export const PushNotificationPrompt: React.FC<PushNotificationPromptProps> = ({ inline = false }) => {
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    error,
    subscribe,
    unsubscribe,
    sendTestNotification,
  } = usePushNotifications();

  const [dismissed, setDismissed] = useState<boolean>(() => {
    return localStorage.getItem('picksports_push_dismissed') === 'true';
  });
  const [testSent, setTestSent] = useState(false);

  if (!isSupported) return null;

  // Si no es modo inline y ya está suscrito o el usuario lo descartó, no mostramos el banner flotante
  if (!inline && (isSubscribed || dismissed || permission === 'denied')) {
    return null;
  }

  const handleDismiss = () => {
    localStorage.setItem('picksports_push_dismissed', 'true');
    setDismissed(true);
  };

  const handleSubscribe = async () => {
    const success = await subscribe();
    if (success) {
      localStorage.removeItem('picksports_push_dismissed');
      setDismissed(false);
    }
  };

  const handleSendTest = async () => {
    setTestSent(false);
    const success = await sendTestNotification();
    if (success) {
      setTestSent(true);
      setTimeout(() => setTestSent(false), 4000);
    }
  };

  // Modo Inline (e.g. configuraciones)
  if (inline) {
    return (
      <div className="push-prompt-inline card">
        <div className="push-prompt-header">
          <div className="push-icon-circle">🔔</div>
          <div>
            <h3 className="push-prompt-title">Notificaciones Web Push</h3>
            <p className="push-prompt-subtitle">
              Recibe avisos inmediatos en tu dispositivo cuando termine cada partido y se califiquen tus picks.
            </p>
          </div>
        </div>

        {error && <div className="push-error-banner">{error}</div>}

        <div className="push-actions-row">
          {isSubscribed ? (
            <>
              <span className="badge badge-success">✓ Notificaciones activadas</span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleSendTest}
                disabled={isLoading}
              >
                {testSent ? '✓ ¡Notificación enviada!' : 'Probar notificación 🚀'}
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm text-danger"
                onClick={unsubscribe}
                disabled={isLoading}
              >
                Desactivar
              </button>
            </>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSubscribe}
              disabled={isLoading || permission === 'denied'}
            >
              {isLoading ? 'Activando...' : 'Activar Notificaciones'}
            </button>
          )}
        </div>
      </div>
    );
  }

  // Modo Banner Flotante / Banner superior
  return (
    <aside className="push-prompt-banner" aria-label="Notificaciones Push">
      <div className="push-prompt-content">
        <div className="push-icon-circle pulse">🔔</div>
        <div className="push-text-block">
          <strong className="push-title">¡No te pierdas los marcadores en vivo!</strong>
          <span className="push-desc">
            Activa las notificaciones Web Push y recibe al instante en tu iPhone, Android o PC si acertaste o fallaste tu pick con el marcador oficial.
          </span>
          {error && <span className="push-error-text">{error}</span>}
        </div>
      </div>

      <div className="push-button-group">
        <button
          type="button"
          className="btn btn-primary btn-sm push-btn-activate"
          onClick={handleSubscribe}
          disabled={isLoading}
        >
          {isLoading ? 'Activando...' : 'Activar en 1 clic'}
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm push-btn-dismiss"
          onClick={handleDismiss}
        >
          Más tarde
        </button>
      </div>
    </aside>
  );
};
