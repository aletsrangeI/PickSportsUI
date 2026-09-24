import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  Flame,
  Trophy,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Zap,
  Sparkles,
} from 'lucide-react';
import { useGetClaimInfoQuery, useClaimAccountMutation } from '../../services/api';
import { setCredentials } from '../../store/authSlice';
import './ActivatePage.css';

export const ActivatePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { data: claimResponse, isLoading, isError, error } = useGetClaimInfoQuery(token, {
    skip: !token,
  });

  const [claimAccount, { isLoading: isSubmitting }] = useClaimAccountMutation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const claimInfo = claimResponse?.data;

  // Inicializar displayName con el alias cuando esté disponible
  React.useEffect(() => {
    if (claimInfo?.alias && !displayName) {
      setDisplayName(claimInfo.alias);
    }
  }, [claimInfo, displayName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (password.length < 6) {
      setSubmitError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setSubmitError('Las contraseñas no coinciden.');
      return;
    }

    try {
      const response = await claimAccount({
        token,
        email,
        password,
        displayName: displayName || undefined,
      }).unwrap();

      if (response.isSuccess && response.data) {
        dispatch(setCredentials(response.data));
        navigate('/', { replace: true });
      } else {
        setSubmitError(response.message || 'Error al activar la cuenta.');
      }
    } catch (err: any) {
      setSubmitError(
        err?.data?.message || 'Error al procesar la activación. Verifica tus datos o intenta más tarde.'
      );
    }
  };

  if (!token) {
    return (
      <div className="activate-page-wrapper">
        <div className="card activate-card">
          <div className="activate-header">
            <div className="activate-icon-circle activate-icon-circle--warning">
              <AlertCircle size={32} />
            </div>
            <h2>Enlace Incompleto</h2>
            <p className="activate-subtitle">
              No se detectó un token de activación en este enlace. Solicita nuevamente tu link de
              invitación al administrador de tu quiniela.
            </p>
          </div>
          <Link to="/login" className="btn btn--primary" style={{ width: '100%', marginTop: '1rem' }}>
            Ir a Iniciar Sesión
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="activate-page-wrapper">
        <div className="card activate-card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <div className="activate-spinner" />
          <h3 style={{ marginTop: '1.5rem', marginBottom: '0.5rem' }}>Cargando tu información...</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Estamos preparando tu perfil y tu historial en la quiniela.
          </p>
        </div>
      </div>
    );
  }

  if (isError || !claimInfo) {
    const errorMsg =
      (error as any)?.data?.message ||
      'El enlace de activación es inválido o ya ha sido utilizado.';
    const isAlreadyClaimed =
      (error as any)?.data?.data?.isAlreadyClaimed ||
      errorMsg.toLowerCase().includes('activada previamente');

    return (
      <div className="activate-page-wrapper">
        <div className="card activate-card">
          <div className="activate-header">
            <div
              className={`activate-icon-circle ${
                isAlreadyClaimed ? 'activate-icon-circle--success' : 'activate-icon-circle--error'
              }`}
            >
              {isAlreadyClaimed ? <CheckCircle2 size={32} /> : <AlertCircle size={32} />}
            </div>
            <h2>{isAlreadyClaimed ? '¡Cuenta Ya Activada!' : 'Enlace No Válido'}</h2>
            <p className="activate-subtitle">
              {isAlreadyClaimed
                ? 'Esta cuenta ya fue activada con anterioridad. Puedes ingresar directamente con tu correo electrónico y contraseña.'
                : errorMsg}
            </p>
          </div>
          <Link to="/login" className="btn btn--primary" style={{ width: '100%', marginTop: '1.5rem' }}>
            Iniciar Sesión <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="activate-page-wrapper">
      <div className="card activate-card">
        {/* Header con Branding y Bienvenida */}
        <div className="activate-header">
          <div className="activate-brand-badge">
            <Flame size={16} />
            <span>PickSports Quiniela</span>
          </div>

          <h1 className="activate-title">¡Hola, {claimInfo.alias}! 👋</h1>
          <p className="activate-subtitle">
            Tu historial y estadísticas ya están listos. Define tu correo y contraseña para activar
            tu acceso permanente.
          </p>
        </div>

        {/* Resumen del Perfil Migrado */}
        <div className="activate-stats-card">
          <div className="activate-stats-header">
            <div className="activate-stats-title">
              <Trophy size={18} className="text-warning" />
              <span>{claimInfo.quinielaName}</span>
            </div>
            <span className="activate-badge-verified">
              <ShieldCheck size={14} /> Historial Verificado
            </span>
          </div>

          <div className="activate-stats-grid">
            <div className="activate-stat-item">
              <span className="activate-stat-val text-primary">{claimInfo.totalHits}</span>
              <span className="activate-stat-lbl">Aciertos</span>
            </div>
            <div className="activate-stat-item">
              <span className="activate-stat-val text-purple">
                <Sparkles size={16} style={{ display: 'inline', marginRight: 2 }} />
                {claimInfo.totalUpsets}
              </span>
              <span className="activate-stat-lbl">Sorpresas</span>
            </div>
            <div className="activate-stat-item">
              <span className="activate-stat-val text-amber">
                <Zap size={16} style={{ display: 'inline', marginRight: 2 }} />
                {claimInfo.currentStreak}
              </span>
              <span className="activate-stat-lbl">Racha Actual</span>
            </div>
          </div>
        </div>

        {/* Errores */}
        {submitError && (
          <div className="alert alert--error" style={{ marginBottom: '1rem' }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{submitError}</span>
          </div>
        )}

        {/* Formulario de Activación */}
        <form onSubmit={handleSubmit} className="activate-form">
          <div className="form-group">
            <label className="form-group__label" htmlFor="activate-email">
              Correo Electrónico Personal
            </label>
            <input
              id="activate-email"
              type="email"
              className="form-group__input"
              placeholder="tu@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
            <span className="form-group__hint">
              Usarás este correo para ingresar a la plataforma cada jornada.
            </span>
          </div>

          <div className="form-group">
            <label className="form-group__label" htmlFor="activate-name">
              Nombre o Apodo Visible
            </label>
            <input
              id="activate-name"
              type="text"
              className="form-group__input"
              placeholder="Cómo te verán en la tabla"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-group__label" htmlFor="activate-pwd">
              Crea tu Contraseña
            </label>
            <input
              id="activate-pwd"
              type="password"
              className="form-group__input"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <div className="form-group">
            <label className="form-group__label" htmlFor="activate-confirm-pwd">
              Confirma tu Contraseña
            </label>
            <input
              id="activate-confirm-pwd"
              type="password"
              className="form-group__input"
              placeholder="Repite tu contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            className="btn btn--primary activate-submit-btn"
            disabled={isSubmitting}
          >
            <span>{isSubmitting ? 'Activando tu cuenta...' : '🚀 Activar Mi Cuenta y Entrar'}</span>
          </button>
        </form>

        <div className="activate-footer">
          ¿Ya tenías cuenta en PickSports?{' '}
          <Link to="/login" style={{ fontWeight: 600 }}>
            Inicia sesión
          </Link>
        </div>
      </div>
    </div>
  );
};
export default ActivatePage;
