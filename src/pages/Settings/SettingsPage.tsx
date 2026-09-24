import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import {
  User,
  ShieldCheck,
  FileSpreadsheet,
  CalendarDays,
  LogOut,
  ChevronRight,
  Sparkles,
  Trophy,
  Share2,
} from 'lucide-react';
import type { RootState } from '../../store';
import { logout } from '../../store/authSlice';
import { useGetQuinielasQuery } from '../../services/api';
import { ClaimLinksModal } from '../../components/admin/ClaimLinksModal';
import './SettingsPage.css';

export const SettingsPage: React.FC = () => {
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const activeQuinielaId = useSelector((state: RootState) => state.quiniela.activeQuinielaId);
  const { data: quinielasResponse } = useGetQuinielasQuery();
  const activeQuiniela = quinielasResponse?.data?.find(q => q.id === activeQuinielaId);

  const allQuinielas = quinielasResponse?.data || [];
  const isOwner =
    activeQuiniela?.userRole === 'OWNER' ||
    user?.role?.toUpperCase() === 'OWNER' ||
    allQuinielas.some(q => q.userRole === 'OWNER');
  const isAdmin = user?.role?.toUpperCase() === 'ADMIN';
  const isOwnerOrAdmin =
    isAdmin ||
    isOwner ||
    activeQuiniela?.userRole === 'ADMIN' ||
    allQuinielas.some(q => q.userRole === 'ADMIN');

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const userInitial = (user?.displayName || user?.username || 'U').charAt(0).toUpperCase();

  return (
    <div className="settings-page">
      <div className="settings-page__header">
        <h1 className="settings-page__title">Ajustes & Cuenta</h1>
        <p className="settings-page__subtitle">
          Administración de tu perfil, quinielas y herramientas del sistema
        </p>
      </div>

      {/* Tarjeta de Perfil de Usuario */}
      <div className="settings-card settings-card--profile">
        <div className="settings-profile">
          <div className="settings-profile__avatar">
            {userInitial}
          </div>
          <div className="settings-profile__info">
            <div className="settings-profile__name-row">
              <h2 className="settings-profile__name">
                {user?.displayName || user?.username}
              </h2>
              {isAdmin && (
                <span className="badge badge--admin">
                  <ShieldCheck size={13} />
                  ADMIN
                </span>
              )}
              {!isAdmin && isOwner && (
                <span className="badge badge--admin">
                  <ShieldCheck size={13} />
                  OWNER
                </span>
              )}
            </div>
            <p className="settings-profile__username">@{user?.username}</p>
            <p className="settings-profile__email">{user?.email}</p>
          </div>
        </div>

        {activeQuiniela && (
          <div className="settings-quiniela-info">
            <Trophy size={16} className="text-accent" />
            <span>Quiniela activa: <strong>{activeQuiniela.name}</strong></span>
          </div>
        )}
      </div>

      {/* Sección para Administradores y Owners */}
      {isOwnerOrAdmin && (
        <div className="settings-section">
          <div className="settings-section__header">
            <div className="settings-section__title-row">
              <Sparkles size={18} className="text-primary" />
              <h3 className="settings-section__title">Herramientas de Quiniela & Administración</h3>
            </div>
            <span className="settings-section__badge">Owner / Admin</span>
          </div>

          <div className="settings-grid">
            {/* Tarjeta de Migración XLSX */}
            <Link to="/admin/migracion" className="settings-tool-card settings-tool-card--featured">
              <div className="settings-tool-card__icon settings-tool-card__icon--excel">
                <FileSpreadsheet size={24} />
              </div>
              <div className="settings-tool-card__content">
                <div className="settings-tool-card__heading">
                  <h4 className="settings-tool-card__title">Migración XLSX (SPEC-007)</h4>
                  <span className="badge badge--success">Recomendado</span>
                </div>
                <p className="settings-tool-card__desc">
                  Sube el archivo Excel de la quiniela activa para importar los 9 participantes, 90 partidos, picks históricos y calcular la tabla de posiciones oficial.
                </p>
              </div>
              <ChevronRight size={20} className="settings-tool-card__arrow" />
            </Link>

            {/* Tarjeta de Gestión de Partidos / ESPN */}
            <Link to="/fixtures" className="settings-tool-card">
              <div className="settings-tool-card__icon settings-tool-card__icon--calendar">
                <CalendarDays size={24} />
              </div>
              <div className="settings-tool-card__content">
                <h4 className="settings-tool-card__title">Partidos & Sincronización ESPN</h4>
                <p className="settings-tool-card__desc">
                  Revisa el calendario oficial de Liga MX, marcadores en vivo y resultados actualizados por jornada.
                </p>
              </div>
              <ChevronRight size={20} className="settings-tool-card__arrow" />
            </Link>

            {/* Tarjeta de Activación de Participantes Migrados */}
            <div
              className="settings-tool-card"
              style={{ cursor: 'pointer' }}
              onClick={() => setIsClaimModalOpen(true)}
            >
              <div
                className="settings-tool-card__icon"
                style={{ backgroundColor: 'rgba(37, 211, 102, 0.15)', color: '#25d366' }}
              >
                <Share2 size={24} />
              </div>
              <div className="settings-tool-card__content">
                <div className="settings-tool-card__heading">
                  <h4 className="settings-tool-card__title">Activar Cuentas de Amigos</h4>
                  <span className="badge badge--success" style={{ backgroundColor: '#25d366', color: '#073315' }}>
                    WhatsApp
                  </span>
                </div>
                <p className="settings-tool-card__desc">
                  Comparte a cada participante su enlace personalizado para activar su cuenta y ligar sus puntos acumulados.
                </p>
              </div>
              <ChevronRight size={20} className="settings-tool-card__arrow" />
            </div>
          </div>
        </div>
      )}

      {/* Acciones de Cuenta */}
      <div className="settings-section">
        <h3 className="settings-section__title">Sesión</h3>
        <div className="settings-card">
          <button
            type="button"
            className="btn btn--outline btn--danger-outline btn--full settings-logout-btn"
            onClick={handleLogout}
          >
            <LogOut size={18} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>

      <ClaimLinksModal
        quinielaId={activeQuinielaId || activeQuiniela?.id || 0}
        quinielaName={activeQuiniela?.name}
        isOpen={isClaimModalOpen}
        onClose={() => setIsClaimModalOpen(false)}
      />
    </div>
  );
};
