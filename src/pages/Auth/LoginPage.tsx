import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Flame, LogIn, AlertCircle, CheckCircle2, Trophy, ArrowRight } from 'lucide-react';
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
    unclaimedAccount,
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
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-md)' }}>
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

        {/* Banner para participantes de la quiniela */}
        <div
          style={{
            marginBottom: 'var(--space-md)',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            fontSize: '0.8125rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
          }}
        >
          <span style={{ color: 'var(--text-secondary)' }}>
            ⚽ ¿Participas en la quiniela?
          </span>
          <Link
            to="/activar"
            style={{
              fontWeight: 700,
              color: 'var(--color-primary)',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            Activar cuenta <ArrowRight size={14} />
          </Link>
        </div>

        {registrationSuccess && (
          <div className="alert alert--success">
            <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
            <span>{registrationSuccess}</span>
          </div>
        )}

        {unclaimedAccount ? (
          <div
            className="alert"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              marginBottom: 'var(--space-md)',
              backgroundColor: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              color: 'var(--text-main)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: '#f59e0b' }}>
              <Trophy size={20} />
              <span>¡Cuenta de {unclaimedAccount.alias} Encontrada! 👋</span>
            </div>
            <p style={{ fontSize: '0.875rem', margin: 0, color: 'var(--text-secondary)' }}>
              Tus aciertos de las jornadas anteriores ya están listos. Solo necesitas activar tu cuenta para definir tu contraseña personal y tu correo.
            </p>
            <Link
              to={`/activar?token=${unclaimedAccount.token}`}
              className="btn btn--primary"
              style={{
                width: '100%',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px',
                marginTop: '4px',
              }}
            >
              <span>🚀 Activar mi cuenta ({unclaimedAccount.alias})</span>
            </Link>
          </div>
        ) : errorMessage ? (
          <div className="alert alert--error">
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        ) : null}

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
