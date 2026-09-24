import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link, NavLink } from 'react-router-dom';
import { Flame, LogOut, Plus, UserPlus, CalendarDays, FileSpreadsheet } from 'lucide-react';
import type { RootState } from '../../store';
import { logout } from '../../store/authSlice';
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
                <span>Partidos / Sync</span>
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
              {user?.role?.toUpperCase() === 'ADMIN' && (
                <NavLink
                  to="/admin/migracion"
                  className={({ isActive }) =>
                    `header__nav-link ${isActive ? 'header__nav-link--active' : ''}`
                  }
                >
                  <FileSpreadsheet size={15} />
                  <span>Migración XLSX</span>
                </NavLink>
              )}
            </nav>
          )}
        </div>

        <div className="header__right">
          {isAuthenticated ? (
            <>
              <div className="header__actions-desktop">
                <button
                  type="button"
                  className="btn btn--outline btn--sm"
                  onClick={onCreateClick}
                >
                  <Plus size={15} />
                  <span>Crear</span>
                </button>
                <button
                  type="button"
                  className="btn btn--outline btn--sm"
                  onClick={onJoinClick}
                >
                  <UserPlus size={15} />
                  <span>Unirse</span>
                </button>
              </div>

              <div className="header__user-menu">
                <div className="header__user-avatar" title={user?.displayName || user?.username}>
                  {userInitial}
                </div>
                <span className="header__user-name">
                  {user?.displayName || user?.username}
                </span>
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
