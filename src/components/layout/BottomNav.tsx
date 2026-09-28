import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Calendar, Trophy, Newspaper, User } from 'lucide-react';
import { LiquidGlass } from '@sohumsuthar/liquid-glass';
import type { RootState } from '../../store';
import {
  useGetQuinielasQuery,
  useGetSeasonsQuery,
  useGetWeeksBySeasonQuery,
} from '../../services/api';
import { UserAvatar } from '../common/UserAvatar';
import './BottomNav.css';

export const BottomNav: React.FC = () => {
  const location = useLocation();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const activeQuinielaId = useSelector((state: RootState) => state.quiniela.activeQuinielaId);
  const userInitial = (user?.displayName || user?.username || 'U').charAt(0).toUpperCase();

  // Obtener la quiniela activa y su liga para identificar la última jornada calificada (SCORED)
  const { data: quinielasResponse } = useGetQuinielasQuery(undefined, { skip: !isAuthenticated });
  const quinielas = quinielasResponse?.data || [];
  const activeQuiniela = quinielas.find((q) => q.id === activeQuinielaId) || quinielas[0];
  const leagueId = activeQuiniela?.leagueId;

  const { data: seasonsData } = useGetSeasonsQuery(leagueId, { skip: !leagueId });
  const seasons = seasonsData?.data ?? [];
  const currentSeason =
    seasons.find((s) => s.isCurrent && !s.isFinished) ??
    seasons.find((s) => s.isCurrent) ??
    seasons[0];

  const { data: weeksData } = useGetWeeksBySeasonQuery(currentSeason?.id!, {
    skip: !currentSeason?.id,
  });
  const weeks = weeksData?.data ?? [];

  const scoredWeeks = weeks.filter((w) => w.status?.toUpperCase() === 'SCORED');
  const latestScoredWeek =
    scoredWeeks.length > 0
      ? scoredWeeks.reduce(
          (latest, current) => (current.weekNumber > latest.weekNumber ? current : latest),
          scoredWeeks[0]
        )
      : null;

  const [hasUnreadBulletin, setHasUnreadBulletin] = useState(false);
  const quinielaKey = activeQuinielaId || activeQuiniela?.id;
  const storageKey = quinielaKey ? `picksports_last_seen_bulletin_${quinielaKey}` : null;

  useEffect(() => {
    if (!latestScoredWeek || !storageKey) {
      setHasUnreadBulletin(false);
      return;
    }

    const lastSeenWeekId = localStorage.getItem(storageKey);

    if (location.pathname === '/bulletin') {
      localStorage.setItem(storageKey, String(latestScoredWeek.id));
      setHasUnreadBulletin(false);
    } else {
      setHasUnreadBulletin(lastSeenWeekId !== String(latestScoredWeek.id));
    }
  }, [location.pathname, latestScoredWeek, storageKey]);

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
                <div className="bottom-nav__icon-wrapper">
                  <Calendar size={20} strokeWidth={1.8} className="bottom-nav__icon" />
                </div>
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
                <div className="bottom-nav__icon-wrapper">
                  <Trophy size={20} strokeWidth={1.8} className="bottom-nav__icon" />
                </div>
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
                <div className="bottom-nav__icon-wrapper">
                  <Newspaper size={20} strokeWidth={1.8} className="bottom-nav__icon" />
                  {hasUnreadBulletin && (
                    <span
                      className="bottom-nav__badge"
                      title="Nuevos resultados de jornada listos en el Boletín"
                      aria-label="Resultados de jornada disponibles"
                    >
                      1
                    </span>
                  )}
                </div>
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
                <div className="bottom-nav__icon-wrapper">
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
                </div>
                <span className="bottom-nav__label">Perfil</span>
              </div>
            </NavLink>
          </li>
        </ul>
      </LiquidGlass>
    </nav>
  );
};
