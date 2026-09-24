import React, { useRef } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { CreateQuinielaModal } from '../quiniela/CreateQuinielaModal';
import { JoinQuinielaModal } from '../quiniela/JoinQuinielaModal';
import { PushNotificationPrompt } from '../notifications/PushNotificationPrompt';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';

import './AppLayout.css';

export const AppLayout: React.FC = () => {
  const createModalRef = useRef<HTMLDialogElement>(null);
  const joinModalRef = useRef<HTMLDialogElement>(null);
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

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
