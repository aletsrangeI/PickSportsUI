import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link, NavLink } from 'react-router-dom';
import { Flame, LogOut, Plus, UserPlus, CalendarDays, FileSpreadsheet } from 'lucide-react';
import type { RootState } from '../../store';
import { logout } from '../../store/authSlice';
import { useGetQuinielasQuery } from '../../services/api';
import { QuinielaSelector } from '../quiniela/QuinielaSelector';
import './Header.css';

interface HeaderProps {
  onCreateClick: () => void;
  onJoinClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onCreateClick, onJoinClick }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const activeQuinielaId = useSelector((state: RootState) => state.quiniela.activeQuinielaId);
  const { data: quinielasResponse } = useGetQuinielasQuery(undefined, { skip: !isAuthenticated });
  const quinielas = quinielasResponse?.data || [];
  const activeQuiniela = quinielas.find((q) => q.id === activeQuinielaId);

  const isOwnerOrAdmin =
    user?.role?.toUpperCase() === 'ADMIN' ||
    user?.role?.toUpperCase() === 'OWNER' ||
    activeQuiniela?.userRole === 'OWNER' ||
    activeQuiniela?.userRole === 'ADMIN' ||
    quinielas.some((q) => q.userRole === 'OWNER' || q.userRole === 'ADMIN');

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const userInitial = (user?.displayName || user?.username || 'U').charAt(0).toUpperCase();

  return (
    <header className="header">
      <div className="header__main">
        <div className="header__left">
          <Link to="/" className="header__logo">
            <div className="header__logo-badge">
              <Flame className="header__logo-icon" size={20} />
            </div>
            <span className="header__logo-text">PickSports</span>
          </Link>

          {isAuthenticated && (
            <div className="header__selector-wrapper">
              <QuinielaSelector
                onCreateClick={onCreateClick}
                onJoinClick={onJoinClick}
              />
            </div>
          )}
        </div>

        {isAuthenticated && (
          <nav className="header__nav">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `header__nav-link ${isActive ? 'header__nav-link--active' : ''}`
              }
            >
              Picks
            </NavLink>
            <NavLink
              to="/fixtures"
              className={({ isActive }) =>
                `header__nav-link ${isActive ? 'header__nav-link--active' : ''}`
              }
            >
              <CalendarDays size={15} />
              <span>Partidos</span>
            </NavLink>
            <NavLink
              to="/standings"
              className={({ isActive }) =>
                `header__nav-link ${isActive ? 'header__nav-link--active' : ''}`
              }
            >
              Posiciones
            </NavLink>
            <NavLink
              to="/awards"
              className={({ isActive }) =>
                `header__nav-link ${isActive ? 'header__nav-link--active' : ''}`
              }
            >
              Premios
            </NavLink>
            {isOwnerOrAdmin && (
              <NavLink
                to="/admin/migracion"
                className={({ isActive }) =>
                  `header__nav-link header__nav-link--admin ${isActive ? 'header__nav-link--active' : ''}`
                }
                title="Migración de datos desde Excel / XLSX"
              >
                <FileSpreadsheet size={15} />
                <span>Migración</span>
              </NavLink>
            )}
          </nav>
        )}

        <div className="header__right">
          {isAuthenticated ? (
            <>
              <div className="header__actions-desktop">
                <button
                  type="button"
                  className="btn btn--outline btn--sm header__quick-action-btn"
                  onClick={onCreateClick}
                  title="Crear nueva quiniela"
                >
                  <Plus size={15} />
                  <span>Crear</span>
                </button>
                <button
                  type="button"
                  className="btn btn--outline btn--sm header__quick-action-btn"
                  onClick={onJoinClick}
                  title="Unirse a una quiniela"
                >
                  <UserPlus size={15} />
                  <span>Unirse</span>
                </button>
              </div>

              <div className="header__user-menu">
                <Link to="/settings" className="header__user-avatar-link" title="Ajustes y Perfil">
                  <div className="header__user-avatar" title={user?.displayName || user?.username}>
                    {user?.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user?.displayName || user?.username}
                        className="header__user-avatar-img"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const fallback = e.currentTarget.parentElement?.querySelector('.header__user-avatar-initial') as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <span
                      className="header__user-avatar-initial"
                      style={{ display: user?.avatarUrl ? 'none' : 'flex' }}
                    >
                      {userInitial}
                    </span>
                  </div>
                </Link>
                <Link to="/settings" className="header__user-name-link">
                  <span className="header__user-name">
                    {user?.displayName || user?.username}
                  </span>
                </Link>
                <button
                  type="button"
                  className="btn btn--icon header__logout-btn"
                  onClick={handleLogout}
                  title="Cerrar sesión"
                  aria-label="Cerrar sesión"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </>
          ) : (
            <div className="header__auth-links">
              <Link to="/login" className="btn btn--outline btn--sm">
                Iniciar Sesión
              </Link>
              <Link to="/register" className="btn btn--primary btn--sm">
                Registrarse
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
