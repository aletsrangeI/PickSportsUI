import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Flame, LogIn, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuthForm } from '../../hooks/useAuthForm';

export const LoginPage: React.FC = () => {
  const location = useLocation();
  const registeredEmail = (location.state as any)?.email || '';
  const registrationSuccess = (location.state as any)?.message;

  const {
    email,
    setEmail,
    password,
    setPassword,
    errorMessage,
    isLoading,
    handleLogin,
  } = useAuthForm(registeredEmail);

  useEffect(() => {
    if (registeredEmail && !email) {
      setEmail(registeredEmail);
    }
  }, [registeredEmail, email, setEmail]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '75vh',
      }}
    >
      <div className="card" style={{ maxWidth: '440px', width: '100%' }}>
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
          <h1 style={{ fontSize: '1.5rem', marginBottom: '6px' }}>Iniciar Sesión</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Ingresa a tu cuenta para gestionar tus quinielas y pronósticos
          </p>
        </div>

        {registrationSuccess && (
          <div className="alert alert--success">
            <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
            <span>{registrationSuccess}</span>
          </div>
        )}

        {errorMessage && (
          <div className="alert alert--error">
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-group__label" htmlFor="login-email">
              Correo Electrónico o Usuario
            </label>
            <input
              id="login-email"
              type="text"
              className="form-group__input"
              placeholder="tu@email.com o usuario"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-group__label" htmlFor="login-password">
              Contraseña
            </label>
            <input
              id="login-password"
              type="password"
              className="form-group__input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn--primary"
            style={{ width: '100%', marginTop: 'var(--space-sm)' }}
            disabled={isLoading}
          >
            <LogIn size={18} />
            <span>{isLoading ? 'Iniciando sesión...' : 'Entrar a PickSports'}</span>
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
          ¿No tienes una cuenta?{' '}
          <Link to="/register" style={{ fontWeight: 600 }}>
            Regístrate aquí
          </Link>
        </div>
      </div>
    </div>
  );
};
