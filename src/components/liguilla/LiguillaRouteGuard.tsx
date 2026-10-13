import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { useGetLiguillaOverviewQuery } from '../../services/api';

interface LiguillaRouteGuardProps {
  children: React.ReactNode;
}

export const LiguillaRouteGuard: React.FC<LiguillaRouteGuardProps> = ({ children }) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const activeQuinielaId = useSelector((state: RootState) => state.quiniela.activeQuinielaId);

  const { data: overviewResponse, isLoading } = useGetLiguillaOverviewQuery(activeQuinielaId!, {
    skip: !activeQuinielaId,
  });

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'OWNER';
  const overview = overviewResponse?.data;

  if (isLoading) {
    return (
      <div className="liguilla-loading-state">
        <div className="liguilla-spinner" />
        <p>Cargando Liguilla...</p>
      </div>
    );
  }

  // Si el módulo no está disponible y el usuario no es admin, redirigir silenciosamente al inicio
  if (!isAdmin && (!overview || !overview.isAvailable || overview.status === 'HIDDEN')) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
