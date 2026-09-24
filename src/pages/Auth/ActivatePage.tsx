import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Flame,
  Trophy,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Zap,
  Sparkles,
  UserCheck,
  ChevronDown,
} from 'lucide-react';
import type { RootState } from '../../store';
import {
  useGetClaimInfoQuery,
  useClaimAccountMutation,
  useGetUnclaimedMembersQuery,
  useLinkCurrentUserMutation,
} from '../../services/api';
import { setCredentials } from '../../store/authSlice';
import './ActivatePage.css';

export const ActivatePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const urlToken = searchParams.get('token') || '';
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user: currentUser, isAuthenticated } = useSelector((state: RootState) => state.auth);

  // Token seleccionado (sea por URL o por Dropdown)
  const [selectedToken, setSelectedToken] = useState<string>(urlToken);

  // Consulta de participantes pendientes de la quiniela (para link genérico)
  const {
    data: unclaimedResponse,
    isLoading: loadingUnclaimed,
    isError: errorUnclaimed,
  } = useGetUnclaimedMembersQuery(undefined, {
    skip: Boolean(urlToken),
  });

  const unclaimedData = unclaimedResponse?.data;
  const unclaimedMembers = unclaimedData?.members || [];

  // Consulta de datos del participante cuando hay un token seleccionado
  const activeToken = selectedToken || urlToken;
  const {
    data: claimResponse,
    isLoading: loadingClaimInfo,
    isError: errorClaimInfo,
    error: claimErrorObj,
  } = useGetClaimInfoQuery(activeToken, {
    skip: !activeToken,
  });

  const [claimAccount, { isLoading: isSubmittingNew }] = useClaimAccountMutation();
  const [linkCurrentUser, { isLoading: isLinkingCurrent }] = useLinkCurrentUserMutation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const claimInfo = claimResponse?.data;

  // Actualizar displayName al seleccionar un participante
  useEffect(() => {
    if (claimInfo?.alias) {
      setDisplayName(claimInfo.alias);
    }
  }, [claimInfo]);

  // Si cambia la URL con token
  useEffect(() => {
    if (urlToken && urlToken !== selectedToken) {
      setSelectedToken(urlToken);
    }
  }, [urlToken]);

  // Vinculación para usuario que ya tiene cuenta y está logueado
  const handleLinkCurrent = async () => {
    if (!selectedToken) {
      setSubmitError('Por favor selecciona tu nombre en la quiniela.');
      return;
    }
    setSubmitError(null);

    try {
      const response = await linkCurrentUser({ token: selectedToken }).unwrap();
      if (response.isSuccess && response.data) {
        dispatch(setCredentials(response.data));
        navigate('/', { replace: true });
      } else {
        setSubmitError(response.message || 'Error al vincular el historial.');
      }
    } catch (err: any) {
      setSubmitError(err?.data?.message || 'Error al vincular con tu usuario actual.');
    }
  };

  // Creación y activación de cuenta nueva
  const handleSubmitNew = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!selectedToken) {
      setSubmitError('Por favor selecciona tu nombre en la quiniela.');
      return;
    }

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
        token: selectedToken,
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

  const isInitialLoading = !urlToken ? loadingUnclaimed : loadingClaimInfo;

  if (isInitialLoading) {
    return (
      <div className="activate-page-wrapper">
        <div className="card activate-card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <div className="activate-spinner" />
          <h3 style={{ marginTop: '1.5rem', marginBottom: '0.5rem' }}>Cargando participantes...</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Obteniendo la lista de la quiniela activa.
          </p>
        </div>
      </div>
    );
  }

  // Si no venía token en URL y todos los participantes ya activaron
  if (!urlToken && unclaimedMembers.length === 0 && !loadingUnclaimed) {
    return (
      <div className="activate-page-wrapper">
        <div className="card activate-card">
          <div className="activate-header">
            <div className="activate-icon-circle activate-icon-circle--success">
              <CheckCircle2 size={32} />
            </div>
            <h2>¡Todos los Participantes Están Activos!</h2>
            <p className="activate-subtitle">
              Todos los participantes de {unclaimedData?.quinielaName || 'la quiniela'} ya activaron
              su cuenta. Si ya tienes acceso, inicia sesión para ingresar tus pronósticos.
            </p>
          </div>
          <Link to="/login" className="btn btn--primary" style={{ width: '100%', marginTop: '1.5rem' }}>
            Ir a Iniciar Sesión <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="activate-page-wrapper">
      <div className="card activate-card">
        {/* Header con Branding */}
        <div className="activate-header">
          <div className="activate-brand-badge">
            <Flame size={16} />
            <span>{unclaimedData?.quinielaName || claimInfo?.quinielaName || 'PickSports Quiniela'}</span>
          </div>

          <h1 className="activate-title">
            {claimInfo ? `¡Hola, ${claimInfo.alias}! 👋` : 'Activa tu Cuenta ⚽'}
          </h1>
          <p className="activate-subtitle">
            {claimInfo
              ? 'Tus aciertos y estadísticas ya están listos. Asocia tu acceso para continuar jugando.'
              : 'Selecciona tu nombre en la lista de abajo para ligar tus puntos acumulados a tu cuenta.'}
          </p>
        </div>

        {/* Dropdown Genérico de Selección (Visible cuando no viene token fijo en URL) */}
        {!urlToken && (
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-group__label" htmlFor="unclaimed-select">
              👤 ¿Quién eres en la quiniela?
            </label>
            <div className="activate-select-wrapper">
              <select
                id="unclaimed-select"
                className="form-group__input activate-select"
                value={selectedToken}
                onChange={(e) => {
                  setSelectedToken(e.target.value);
                  setSubmitError(null);
                }}
              >
                <option value="">-- Elige tu nombre de la lista --</option>
                {unclaimedMembers.map((m) => (
                  <option key={m.claimToken} value={m.claimToken}>
                    {m.alias} ({m.totalHits} aciertos acumulados)
                  </option>
                ))}
              </select>
              <ChevronDown size={18} className="activate-select-arrow" />
            </div>
            <span className="form-group__hint">
              Solo aparecen los participantes que aún no han activado su cuenta.
            </span>
          </div>
        )}

        {/* Resumen del Perfil Seleccionado */}
        {claimInfo && (
          <div className="activate-stats-card">
            <div className="activate-stats-header">
              <div className="activate-stats-title">
                <Trophy size={18} className="text-warning" />
                <span>{claimInfo.alias}</span>
              </div>
              <span className="activate-badge-verified">
                <ShieldCheck size={14} /> Historial Precargado
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
        )}

        {/* Errores */}
        {submitError && (
          <div className="alert alert--error" style={{ marginBottom: '1rem' }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{submitError}</span>
          </div>
        )}

        {/* CASO A: El usuario ya tiene sesión iniciada en PickSports */}
        {isAuthenticated && currentUser ? (
          <div className="activate-logged-in-box">
            <div className="activate-logged-in-user">
              <UserCheck size={20} className="text-primary" />
              <div>
                <strong>Conectado como:</strong> {currentUser.displayName || currentUser.username} ({currentUser.email})
              </div>
            </div>

            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '10px 0' }}>
              Al pulsar el botón se asignará todo el historial de <strong>{claimInfo?.alias || 'este participante'}</strong> a tu cuenta actual.
            </p>

            <button
              type="button"
              className="btn btn--primary activate-submit-btn"
              onClick={handleLinkCurrent}
              disabled={isLinkingCurrent || !selectedToken}
            >
              <span>
                {isLinkingCurrent
                  ? 'Vinculando...'
                  : `✓ Vincular a mi cuenta (${claimInfo?.alias || 'Seleccionado'})`}
              </span>
            </button>
          </div>
        ) : (
          /* CASO B: Usuario no autenticado (Crea su cuenta y contraseña) */
          selectedToken && (
            <form onSubmit={handleSubmitNew} className="activate-form">
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
                disabled={isSubmittingNew}
              >
                <span>{isSubmittingNew ? 'Activando tu cuenta...' : '🚀 Activar Mi Cuenta y Entrar'}</span>
              </button>
            </form>
          )
        )}

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
