import React from 'react';
import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Calendar, Trophy, Newspaper, User } from 'lucide-react';
import { LiquidGlass } from '@sohumsuthar/liquid-glass';
import type { RootState } from '../../store';
import { UserAvatar } from '../common/UserAvatar';
import './BottomNav.css';

export const BottomNav: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const userInitial = (user?.displayName || user?.username || 'U').charAt(0).toUpperCase();

  return (
    <nav className="bottom-nav" aria-label="Navegación principal">
      <LiquidGlass
        variant="clear"
        className="bottom-nav__glass"
        contentClassName="bottom-nav__content"
      >
        <ul className="bottom-nav__list">
          {/* 1. Picks */}
          <li className="bottom-nav__item">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `bottom-nav__link ${isActive ? 'bottom-nav__link--active' : ''}`
              }
            >
              <div className="bottom-nav__capsule">
                <Calendar size={20} strokeWidth={1.8} className="bottom-nav__icon" />
                <span className="bottom-nav__label">Picks</span>
              </div>
            </NavLink>
          </li>

          {/* 2. Posiciones */}
          <li className="bottom-nav__item">
            <NavLink
              to="/standings"
              className={({ isActive }) =>
                `bottom-nav__link ${isActive ? 'bottom-nav__link--active' : ''}`
              }
            >
              <div className="bottom-nav__capsule">
                <Trophy size={20} strokeWidth={1.8} className="bottom-nav__icon" />
                <span className="bottom-nav__label">Posiciones</span>
              </div>
            </NavLink>
          </li>

          {/* 3. Boletín */}
          <li className="bottom-nav__item">
            <NavLink
              to="/bulletin"
              className={({ isActive }) =>
                `bottom-nav__link ${isActive ? 'bottom-nav__link--active' : ''}`
              }
            >
              <div className="bottom-nav__capsule">
                <Newspaper size={20} strokeWidth={1.8} className="bottom-nav__icon" />
                <span className="bottom-nav__label">Boletín</span>
              </div>
            </NavLink>
          </li>

          {/* 4. Perfil */}
          <li className="bottom-nav__item">
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `bottom-nav__link ${isActive ? 'bottom-nav__link--active' : ''}`
              }
            >
              <div className="bottom-nav__capsule">
                {user ? (
                  <UserAvatar
                    src={user?.avatarUrl}
                    alt={user?.displayName || user?.username || 'Perfil'}
                    size="xs"
                    className="bottom-nav__avatar"
                    fallbackText={userInitial}
                  />
                ) : (
                  <User size={20} strokeWidth={1.8} className="bottom-nav__icon" />
                )}
                <span className="bottom-nav__label">Perfil</span>
              </div>
            </NavLink>
          </li>
        </ul>
      </LiquidGlass>
    </nav>
  );
};
