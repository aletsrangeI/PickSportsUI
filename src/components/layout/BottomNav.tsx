import React from 'react';
import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Calendar, Trophy, Award, Share2, Settings, CalendarDays } from 'lucide-react';
import type { RootState } from '../../store';
import { useGetQuinielasQuery } from '../../services/api';
import './BottomNav.css';

export const BottomNav: React.FC = () => {
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

  return (
    <nav className="bottom-nav" aria-label="Navegación principal">
      <ul className="bottom-nav__list">
        <li className="bottom-nav__item">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `bottom-nav__link ${isActive ? 'bottom-nav__link--active' : ''}`
            }
          >
            <Calendar size={19} className="bottom-nav__icon" />
            <span className="bottom-nav__label">Picks</span>
          </NavLink>
        </li>
        <li className="bottom-nav__item">
          <NavLink
            to="/fixtures"
            className={({ isActive }) =>
              `bottom-nav__link ${isActive ? 'bottom-nav__link--active' : ''}`
            }
          >
            <CalendarDays size={19} className="bottom-nav__icon" />
            <span className="bottom-nav__label">Partidos</span>
          </NavLink>
        </li>
        <li className="bottom-nav__item">
          <NavLink
            to="/standings"
            className={({ isActive }) =>
              `bottom-nav__link ${isActive ? 'bottom-nav__link--active' : ''}`
            }
          >
            <Trophy size={19} className="bottom-nav__icon" />
            <span className="bottom-nav__label">Posiciones</span>
          </NavLink>
        </li>
        <li className="bottom-nav__item">
          <NavLink
            to="/awards"
            className={({ isActive }) =>
              `bottom-nav__link ${isActive ? 'bottom-nav__link--active' : ''}`
            }
          >
            <Award size={19} className="bottom-nav__icon" />
            <span className="bottom-nav__label">Premios</span>
          </NavLink>
        </li>
        {isOwnerOrAdmin && (
          <li className="bottom-nav__item">
            <NavLink
              to="/share"
              className={({ isActive }) =>
                `bottom-nav__link ${isActive ? 'bottom-nav__link--active' : ''}`
              }
            >
              <Share2 size={19} className="bottom-nav__icon" />
              <span className="bottom-nav__label">WhatsApp</span>
            </NavLink>
          </li>
        )}
        <li className="bottom-nav__item">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `bottom-nav__link ${isActive ? 'bottom-nav__link--active' : ''}`
            }
          >
            <Settings size={19} className="bottom-nav__icon" />
            <span className="bottom-nav__label">Ajustes</span>
          </NavLink>
        </li>
      </ul>
    </nav>
  );
};
