import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from './store';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/Auth/LoginPage';
import { RegisterPage } from './pages/Auth/RegisterPage';
import { DashboardPage } from './pages/Dashboard/DashboardPage';
import { FixturesPage } from './pages/Fixtures/FixturesPage';
import { StandingsPage } from './pages/Standings/StandingsPage';
import { AwardsPage } from './pages/Awards/AwardsPage';
import { WhatsAppPage } from './pages/WhatsApp/WhatsAppPage';
import { MigrationPage } from './pages/Admin/MigrationPage';
import { SettingsPage } from './pages/Settings/SettingsPage';
import { ActivatePage } from './pages/Auth/ActivatePage';

import { useGetQuinielasQuery } from './services/api';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const OwnerOrAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const activeQuinielaId = useSelector((state: RootState) => state.quiniela.activeQuinielaId);
  const { data: quinielasResponse } = useGetQuinielasQuery(undefined, { skip: !isAuthenticated });
  const quinielas = quinielasResponse?.data || [];
  const activeQuiniela = quinielas.find((q) => q.id === activeQuinielaId);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const isOwnerOrAdmin =
    user?.role?.toUpperCase() === 'ADMIN' ||
    user?.role?.toUpperCase() === 'OWNER' ||
    activeQuiniela?.userRole === 'OWNER' ||
    activeQuiniela?.userRole === 'ADMIN' ||
    quinielas.some((q) => q.userRole === 'OWNER' || q.userRole === 'ADMIN');

  if (!isOwnerOrAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas Públicas */}
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicOnlyRoute>
              <RegisterPage />
            </PublicOnlyRoute>
          }
        />
        <Route path="/activar" element={<ActivatePage />} />
        <Route path="/claim" element={<ActivatePage />} />

        {/* Layout Principal Autenticado */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="standings" element={<StandingsPage />} />
          <Route path="awards" element={<AwardsPage />} />
          <Route
            path="share"
            element={
              <OwnerOrAdminRoute>
                <WhatsAppPage />
              </OwnerOrAdminRoute>
            }
          />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="fixtures" element={<FixturesPage />} />
          <Route
            path="admin/migracion"
            element={
              <OwnerOrAdminRoute>
                <MigrationPage />
              </OwnerOrAdminRoute>
            }
          />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
