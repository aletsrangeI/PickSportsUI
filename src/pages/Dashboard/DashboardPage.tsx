import React, { useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import {
  Trophy,
  Copy,
  Check,
  Users,
  DollarSign,
  Plus,
  UserPlus,
  Shield,
  CreditCard,
  Target,
  Sparkles,
  CalendarDays,
  Lock,
  Bot,
  Table as TableIcon,
  AlertCircle,
} from 'lucide-react';
import { useDashboard } from '../../hooks/useDashboard';
import { usePicks } from '../../hooks/usePicks';
import { MatchCard } from '../../components/matches/MatchCard';
import { MatchPicker } from '../../components/picks/MatchPicker';
import { PicksMatrix } from '../../components/picks/PicksMatrix';
import './DashboardPage.css';

interface OutletContextType {
  openCreateModal: () => void;
  openJoinModal: () => void;
}

export const DashboardPage: React.FC = () => {
  const { openCreateModal, openJoinModal } = useOutletContext<OutletContextType>();
  const [activeTab, setActiveTab] = useState<'picks' | 'matrix' | 'standings'>('picks');

  const {
    quiniela,
    isLoading: isDashboardLoading,
    hasQuinielas,
    copiedCode,
    isOwnerOrAdmin,
    handleCopyInviteCode,
    handleTogglePayment,
  } = useDashboard();

  const {
    selectedWeekId,
    setSelectedWeekId,
    weeks,
    matches,
    userPicks,
    allPicks,
    members: pickMembers,
    isLocked: isWeekLocked,
    isRevealed,
    allowsDraw,
    weekName,
    completedPicksCount,
    totalMatchesCount,
    isOwnerOrAdmin: isPicksAdmin,
    isSubmitting: isSubmittingPick,
    isLocking: isLockingWeek,
    toast: picksToast,
    clearToast: clearPicksToast,
    handleVote,
    handleLockAndAutofill,
  } = usePicks();

  if (isDashboardLoading) {
    return (
      <div style={{ padding: 'var(--space-2xl) 0', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Cargando información de quinielas...</p>
      </div>
    );
  }

  if (!hasQuinielas) {
    return (
      <div className="dashboard-welcome">
        <div className="dashboard-welcome__badge">
          <Sparkles size={13} />
          <span>Temporada 2026 • Quinielas</span>
        </div>

        <div className="dashboard-welcome__icon-wrapper">
          <Trophy size={36} />
        </div>

        <h1 className="dashboard-welcome__title">
          ¡Bienvenido al Juego!
        </h1>

        <p className="dashboard-welcome__subtitle">
          Crea tu propia quiniela o únete con un código de invitación para empezar a pronosticar y competir con tus amigos por la bolsa acumulada.
        </p>

        <div className="dashboard-welcome__features">
          <div className="dashboard-welcome__feature-item">
            <div className="dashboard-welcome__feature-icon">
              <Shield size={18} />
            </div>
            <div>
              <div className="dashboard-welcome__feature-title">1. Elige tu Liga</div>
              <div className="dashboard-welcome__feature-desc">
                Compite en Liga MX, Champions League y torneos internacionales.
              </div>
            </div>
          </div>

          <div className="dashboard-welcome__feature-item">
            <div className="dashboard-welcome__feature-icon">
              <Target size={18} />
            </div>
            <div>
              <div className="dashboard-welcome__feature-title">2. Pronostica cada Jornada</div>
              <div className="dashboard-welcome__feature-desc">
                Predice resultados exactos, comodines y acumula rachas de aciertos.
              </div>
            </div>
          </div>

          <div className="dashboard-welcome__feature-item">
            <div className="dashboard-welcome__feature-icon">
              <Trophy size={18} />
            </div>
            <div>
              <div className="dashboard-welcome__feature-title">3. Gana la Bolsa Acumulada</div>
              <div className="dashboard-welcome__feature-desc">
                Tabla de posiciones en vivo y reparto de premios para los primeros lugares.
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-welcome__actions">
          <button
            type="button"
            className="btn dashboard-welcome__btn-primary"
            onClick={openCreateModal}
          >
            <Plus size={20} />
            <span>Crear mi primera quiniela</span>
          </button>
          <button
            type="button"
            className="btn dashboard-welcome__btn-secondary"
            onClick={openJoinModal}
          >
            <UserPlus size={18} />
            <span>Unirme con código de invitación</span>
          </button>
        </div>
      </div>
    );
  }

  if (!quiniela) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 'var(--space-xl)' }}>
        <p style={{ color: 'var(--text-secondary)' }}>
          Selecciona una quiniela en la barra superior para ver su información.
        </p>
      </div>
    );
  }

  const paidMembersCount = quiniela.members?.filter((m) => m.paidFee).length || 0;
  const totalPot = paidMembersCount * Number(quiniela.entryFee);
  const firstPrize = (totalPot * Number(quiniela.firstPlacePct)) / 100;
  const secondPrize = (totalPot * Number(quiniela.secondPlacePct)) / 100;
  const thirdPrize = (totalPot * Number(quiniela.thirdPlacePct)) / 100;

  const currentMember = quiniela.members?.find((m) => m.alias === quiniela.userRole || m.role === quiniela.userRole);
  const progressPct = totalMatchesCount > 0 ? Math.round((completedPicksCount / totalMatchesCount) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
      {/* Banner de Quiniela */}
      <div className="dashboard-banner">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="badge badge--primary">{quiniela.leagueName}</span>
            <span className="badge badge--secondary">{quiniela.sportName}</span>
            {quiniela.userRole && (
              <span className="badge badge--accent">
                Tu Rol: {quiniela.userRole}
              </span>
            )}
          </div>
          <h1 style={{ fontSize: '1.625rem', marginBottom: '4px' }}>{quiniela.name}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Administrada por <strong style={{ color: 'var(--text-main)' }}>{quiniela.ownerName}</strong>
            {quiniela.description && ` • ${quiniela.description}`}
          </p>
          <div style={{ marginTop: '10px' }}>
            <Link
              to="/fixtures"
              className="btn btn--outline btn--sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <CalendarDays size={14} />
              <span>Ver Calendario & Sync ESPN</span>
            </Link>
          </div>
        </div>

        {/* Invite Code Box */}
        <div className="dashboard-invite-box">
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            CÓDIGO DE INVITACIÓN
          </span>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <code
              style={{
                fontSize: '1.125rem',
                fontWeight: 800,
                color: 'var(--color-primary)',
                letterSpacing: '0.08em',
              }}
            >
              {quiniela.inviteCode}
            </code>
            <button
              type="button"
              className="btn btn--outline btn--sm"
              onClick={handleCopyInviteCode}
              title="Copiar código"
            >
              {copiedCode ? <Check size={14} color="var(--color-primary)" /> : <Copy size={14} />}
              <span>{copiedCode ? 'Copiado' : 'Copiar'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Switcher: Pronósticos | Matriz de Rivales | Bolsa & Miembros */}
      <div className="dashboard-tabs">
        <button
          type="button"
          className={`dashboard-tab-btn ${activeTab === 'picks' ? 'dashboard-tab-btn--active' : ''}`}
          onClick={() => setActiveTab('picks')}
        >
          <Target size={18} />
          <span>Pronósticos (Jornada)</span>
        </button>

        <button
          type="button"
          className={`dashboard-tab-btn ${activeTab === 'matrix' ? 'dashboard-tab-btn--active' : ''}`}
          onClick={() => setActiveTab('matrix')}
        >
          <TableIcon size={18} />
          <span>Matriz de Rivales</span>
        </button>

        <button
          type="button"
          className={`dashboard-tab-btn ${activeTab === 'standings' ? 'dashboard-tab-btn--active' : ''}`}
          onClick={() => setActiveTab('standings')}
        >
          <DollarSign size={18} />
          <span>Bolsa y Miembros</span>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: PRONÓSTICOS DE LA JORNADA
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'picks' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {/* Controles de la Jornada */}
          <div className="dashboard-picks-controls">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              {weeks.length > 0 && (
                <select
                  className="dashboard-week-select"
                  value={selectedWeekId || ''}
                  onChange={(e) => setSelectedWeekId(Number(e.target.value))}
                >
                  {weeks.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} {w.status === 'LOCKED' ? '🔒' : w.status === 'SCORED' ? '🏁' : ''}
                    </option>
                  ))}
                </select>
              )}

              {isWeekLocked ? (
                <span className="badge badge--secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Lock size={12} /> Jornada Bloqueada
                </span>
              ) : (
                <span className="badge badge--primary">
                  ● Abierta para Pronósticos
                </span>
              )}
            </div>

            {/* Barra de progreso de pronósticos */}
            {totalMatchesCount > 0 && (
              <div className="dashboard-picks-progress">
                <div className="dashboard-picks-progress__label">
                  <span>Tus Pronósticos:</span>
                  <strong>{completedPicksCount} de {totalMatchesCount} ({progressPct}%)</strong>
                </div>
                <div className="dashboard-picks-progress__bar">
                  <div
                    className="dashboard-picks-progress__fill"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            )}

            {/* Botón Admin: Bloqueo y Autollenado manual */}
            {isPicksAdmin && !isWeekLocked && (
              <button
                type="button"
                className="btn btn--outline btn--sm"
                onClick={handleLockAndAutofill}
                disabled={isLockingWeek}
                title="Cierra la jornada inmediatamente y genera pronósticos aleatorios para los miembros rezagados"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Bot size={15} />
                <span>{isLockingWeek ? 'Cerrando y Autollenando...' : 'Cerrar & Autollenar Faltantes'}</span>
              </button>
            )}
          </div>

          {/* Toast Alert Feedback */}
          {picksToast && (
            <div
              className={`dashboard-toast-alert dashboard-toast-alert--${picksToast.type}`}
              onClick={clearPicksToast}
              style={{ cursor: 'pointer' }}
            >
              {picksToast.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
              <span>{picksToast.message}</span>
            </div>
          )}

          {/* Grid de Partidos con MatchPicker integrado */}
          {matches.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
              <p style={{ color: 'var(--text-secondary)' }}>
                No hay partidos registrados para {weekName}. Puedes sincronizarlos desde el menú de partidos.
              </p>
            </div>
          ) : (
            <div className="dashboard-matches-grid">
              {matches.map((match) => (
                <MatchCard key={match.id} match={match}>
                  <MatchPicker
                    match={match}
                    currentPick={userPicks[match.id]}
                    allowsDraw={allowsDraw}
                    isWeekLocked={isWeekLocked}
                    isSubmitting={isSubmittingPick}
                    onSelectPick={handleVote}
                  />
                </MatchCard>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: MATRIZ DE RIVALES
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'matrix' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div className="dashboard-picks-controls">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {weeks.length > 0 && (
                <select
                  className="dashboard-week-select"
                  value={selectedWeekId || ''}
                  onChange={(e) => setSelectedWeekId(Number(e.target.value))}
                >
                  {weeks.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} {w.status === 'LOCKED' ? '🔒' : w.status === 'SCORED' ? '🏁' : ''}
                    </option>
                  ))}
                </select>
              )}

              {isWeekLocked ? (
                <span className="badge badge--secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Lock size={12} /> Jornada Cerrada
                </span>
              ) : (
                <span className="badge badge--accent">
                  Abierta (Picks Ocultos)
                </span>
              )}
            </div>

            {isPicksAdmin && !isWeekLocked && (
              <button
                type="button"
                className="btn btn--outline btn--sm"
                onClick={handleLockAndAutofill}
                disabled={isLockingWeek}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Bot size={15} />
                <span>{isLockingWeek ? 'Cerrando...' : 'Cerrar & Autollenar para Revelar'}</span>
              </button>
            )}
          </div>

          {!isRevealed ? (
            <div className="card" style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'rgba(245, 158, 11, 0.15)',
                  color: 'var(--color-accent)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 'var(--space-md)',
                }}
              >
                <Lock size={28} />
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>
                Pronósticos Ocultos por Juego Limpio
              </h3>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '520px', margin: '0 auto', fontSize: '0.9375rem', lineHeight: 1.5 }}>
                Para evitar copias o espionaje de selecciones, los pronósticos de todos los participantes se mantendrán ocultos hasta el arranque del primer partido de la jornada. En ese momento, la matriz completa se revelará en tiempo real.
              </p>
            </div>
          ) : (
            <PicksMatrix
              matches={matches}
              members={pickMembers}
              picks={allPicks}
              currentUserMemberId={currentMember?.id}
            />
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 3: BOLSA Y PARTICIPANTES
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'standings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          {/* Stats Cards Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 'var(--space-md)',
            }}
          >
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
              <div
                style={{
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(59, 130, 246, 0.15)',
                  color: 'var(--color-secondary)',
                }}
              >
                <Users size={24} />
              </div>
              <div>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  Participantes
                </span>
                <h3 style={{ fontSize: '1.5rem' }}>
                  {quiniela.members?.length || 0}{' '}
                  <span style={{ fontSize: '0.875rem', fontWeight: 400, color: 'var(--text-muted)' }}>
                    ({paidMembersCount} con cuota cubierta)
                  </span>
                </h3>
              </div>
            </div>

            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
              <div
                style={{
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  color: 'var(--color-primary)',
                }}
              >
                <DollarSign size={24} />
              </div>
              <div>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  Bolsa Acumulada
                </span>
                <h3 style={{ fontSize: '1.5rem', color: 'var(--color-primary)' }}>
                  ${totalPot.toLocaleString('es-MX')} MXN
                </h3>
              </div>
            </div>

            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
              <div
                style={{
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(245, 158, 11, 0.15)',
                  color: 'var(--color-accent)',
                }}
              >
                <Trophy size={24} />
              </div>
              <div>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  Premio 1er Lugar ({quiniela.firstPlacePct}%)
                </span>
                <h3 style={{ fontSize: '1.5rem', color: 'var(--color-accent)' }}>
                  ${firstPrize.toLocaleString('es-MX')} MXN
                </h3>
              </div>
            </div>
          </div>

          {/* Tabla de Miembros */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="dashboard-members-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={18} style={{ color: 'var(--color-primary)' }} />
                <h2 style={{ fontSize: '1.125rem' }}>Miembros de la Quiniela</h2>
              </div>
              {isOwnerOrAdmin && (
                <span className="dashboard-members-admin-hint">
                  <Shield size={14} /> Modo Administrador: Puedes marcar pagos haciendo clic
                </span>
              )}
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  textAlign: 'left',
                  fontSize: '0.875rem',
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      backgroundColor: 'var(--bg-app)',
                      color: 'var(--text-secondary)',
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    <th style={{ padding: '12px 16px' }}>#</th>
                    <th style={{ padding: '12px 16px' }}>Participante / Alias</th>
                    <th style={{ padding: '12px 16px' }}>Rol</th>
                    <th style={{ padding: '12px 16px' }}>Aciertos</th>
                    <th style={{ padding: '12px 16px' }}>Racha</th>
                    <th style={{ padding: '12px 16px' }}>Cuota Cubierta</th>
                  </tr>
                </thead>
                <tbody>
                  {quiniela.members?.map((member, index) => (
                    <tr
                      key={member.id}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        transition: 'background-color var(--transition-fast)',
                      }}
                    >
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>
                        {index + 1}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 600 }}>{member.alias}</span>
                          {member.displayName && member.displayName !== member.alias && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {member.displayName}
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          className={`badge ${
                            member.role === 'OWNER'
                              ? 'badge--accent'
                              : member.role === 'ADMIN'
                              ? 'badge--primary'
                              : 'badge--secondary'
                          }`}
                        >
                          {member.role}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 600 }}>
                        {member.totalHits}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {member.currentStreak > 0 ? (
                          <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                            🔥 {member.currentStreak}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {isOwnerOrAdmin ? (
                          <button
                            type="button"
                            className={`btn btn--sm ${
                              member.paidFee ? 'btn--primary' : 'btn--outline'
                            }`}
                            onClick={() => handleTogglePayment(member.id, member.paidFee)}
                            title="Haz clic para alternar estado de pago"
                          >
                            <CreditCard size={14} />
                            <span>{member.paidFee ? 'Cubierto' : 'Pendiente'}</span>
                          </button>
                        ) : (
                          <span
                            className={`badge ${
                              member.paidFee ? 'badge--primary' : 'badge--secondary'
                            }`}
                          >
                            {member.paidFee ? 'Cubierto' : 'Pendiente'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
