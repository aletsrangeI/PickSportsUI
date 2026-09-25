import React, { useRef } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { CreateQuinielaModal } from '../quiniela/CreateQuinielaModal';
import { JoinQuinielaModal } from '../quiniela/JoinQuinielaModal';
import { PushNotificationPrompt } from '../notifications/PushNotificationPrompt';
import { UpdateNotificationBanner } from '../common/UpdateNotificationBanner';
import { ForceUpdateModal } from '../common/ForceUpdateModal';
import { useAppVersionMonitor } from '../../hooks/useAppVersionMonitor';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';

import './AppLayout.css';

export const AppLayout: React.FC = () => {
  const createModalRef = useRef<HTMLDialogElement>(null);
  const joinModalRef = useRef<HTMLDialogElement>(null);
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  const {
    localVersion,
    serverVersion,
    minSupportedVersion,
    isUpdateAvailable,
    isForceUpdateRequired,
    applyUpdate,
    dismissUpdate
  } = useAppVersionMonitor();

  const handleOpenCreate = () => {
    createModalRef.current?.showModal();
  };

  const handleCloseCreate = () => {
    createModalRef.current?.close();
  };

  const handleOpenJoin = () => {
    joinModalRef.current?.showModal();
  };

  const handleCloseJoin = () => {
    joinModalRef.current?.close();
  };

  return (
    <div className="app-layout">
      {/* Notificación no intrusiva de actualización disponible */}
      {isUpdateAvailable && !isForceUpdateRequired && (
        <UpdateNotificationBanner
          version={serverVersion}
          onUpdate={applyUpdate}
          onDismiss={dismissUpdate}
        />
      )}

      {/* Modal bloqueante si la versión actual es inferior a la requerida por el backend */}
      {isForceUpdateRequired && (
        <ForceUpdateModal
          localVersion={localVersion}
          minSupportedVersion={minSupportedVersion}
          onUpdate={applyUpdate}
        />
      )}

      <Header
        onCreateClick={handleOpenCreate}
        onJoinClick={handleOpenJoin}
      />

      {isAuthenticated && <PushNotificationPrompt />}

      <main className="app-main">
        <Outlet context={{ openCreateModal: handleOpenCreate, openJoinModal: handleOpenJoin }} />
      </main>

      {isAuthenticated && <BottomNav />}

      <CreateQuinielaModal
        ref={createModalRef}
        onClose={handleCloseCreate}
      />

      <JoinQuinielaModal
        ref={joinModalRef}
        onClose={handleCloseJoin}
      />
    </div>
  );
};
