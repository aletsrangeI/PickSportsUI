import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Flame, UserPlus, AlertCircle, CheckCircle2, LogIn, ArrowRight } from 'lucide-react';
import { useAuthForm } from '../../hooks/useAuthForm';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    email,
    setEmail,
    password,
    setPassword,
    username,
    setUsername,
    displayName,
    setDisplayName,
    errorMessage,
    isSuccessRegistered,
    registeredUser,
    isLoading,
    handleRegister,
  } = useAuthForm();

  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!isSuccessRegistered) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/login', {
            state: {
              registered: true,
              email: registeredUser?.email,
              message: '¡Cuenta creada con éxito! Ingresa tu contraseña para comenzar.',
            },
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isSuccessRegistered, navigate, registeredUser]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '75vh',
      }}
    >
      <div className="card" style={{ maxWidth: '460px', width: '100%' }}>
        {isSuccessRegistered ? (
          /* Estado de éxito con feedback visual claro */
          <div style={{ textAlign: 'center', padding: 'var(--space-md) 0' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '64px',
                height: '64px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                color: 'var(--color-primary)',
                marginBottom: 'var(--space-md)',
                boxShadow: '0 0 24px rgba(16, 185, 129, 0.3)',
              }}
            >
              <CheckCircle2 size={36} />
            </div>

            <h1 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>
              ¡Cuenta Creada Exitosamente!
            </h1>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginBottom: 'var(--space-lg)' }}>
              Bienvenido a PickSports, <strong style={{ color: 'var(--text-main)' }}>{registeredUser?.displayName || registeredUser?.username}</strong>.
            </p>

            <div
              className="alert alert--success"
              style={{ textAlign: 'left', marginBottom: 'var(--space-lg)', fontSize: '0.875rem' }}
            >
              <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                Tu usuario <strong>@{registeredUser?.username}</strong> ha sido registrado con el correo <strong>{registeredUser?.email}</strong>.
              </div>
            </div>

            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: 'var(--space-lg)' }}>
              Redirigiendo automáticamente al inicio de sesión en <strong>{countdown}</strong> segundos...
            </p>

            <Link
              to="/login"
              state={{
                registered: true,
                email: registeredUser?.email,
                message: '¡Cuenta creada con éxito! Ingresa tu contraseña para comenzar.',
              }}
              className="btn btn--primary"
              style={{ width: '100%', textDecoration: 'none' }}
            >
              <LogIn size={18} />
              <span>Ir a Iniciar Sesión Ahora</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          /* Formulario de Registro */
          <>
            <div style={{ textAlign: 'center', marginBottom: 'var(--space-lg)' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '48px',
                  height: '48px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  color: 'var(--color-primary)',
                  marginBottom: '12px',
                }}
              >
                <Flame size={28} />
              </div>
              <h1 style={{ fontSize: '1.5rem', marginBottom: '6px' }}>Crea tu Cuenta</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Únete a PickSports para competir en quinielas con tus amigos
              </p>
            </div>

            {errorMessage && (
              <div className="alert alert--error">
                <AlertCircle size={18} />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleRegister}>
              <div className="form-group">
                <label className="form-group__label" htmlFor="reg-email">
                  Correo Electrónico *
                </label>
                <input
                  id="reg-email"
                  type="email"
                  className="form-group__input"
                  placeholder="alex@amigos.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-group__label" htmlFor="reg-username">
                  Nombre de Usuario *
                </label>
                <input
                  id="reg-username"
                  type="text"
                  className="form-group__input"
                  placeholder="alex"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  minLength={3}
                  maxLength={50}
                />
              </div>

              <div className="form-group">
                <label className="form-group__label" htmlFor="reg-displayname">
                  Nombre Visible / Alias (Opcional)
                </label>
                <input
                  id="reg-displayname"
                  type="text"
                  className="form-group__input"
                  placeholder="Alex González"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={50}
                />
              </div>

              <div className="form-group">
                <label className="form-group__label" htmlFor="reg-password">
                  Contraseña *
                </label>
                <input
                  id="reg-password"
                  type="password"
                  className="form-group__input"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                className="btn btn--primary"
                style={{ width: '100%', marginTop: 'var(--space-sm)' }}
                disabled={isLoading}
              >
                <UserPlus size={18} />
                <span>{isLoading ? 'Creando cuenta...' : 'Registrarse'}</span>
              </button>
            </form>

            <div
              style={{
                marginTop: 'var(--space-lg)',
                textAlign: 'center',
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
                borderTop: '1px solid var(--border-subtle)',
                paddingTop: 'var(--space-md)',
              }}
            >
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" style={{ fontWeight: 600 }}>
                Inicia sesión aquí
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
