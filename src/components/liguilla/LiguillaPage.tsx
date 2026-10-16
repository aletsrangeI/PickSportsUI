import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Trophy, Shield, Ticket, Lock, Clock, Eye, AlertCircle } from 'lucide-react';
import type { RootState } from '../../store';
import {
  useGetLiguillaOverviewQuery,
  useGetLiguillaStandingsQuery,
  useSubmitLiguillaBracketMutation,
  useSeedSimulationLiguillaMutation,
  useGetQuinielasQuery,
} from '../../services/api';
import type { LiguillaTeam } from '../../types';
import { ArenaClashViewer } from './ArenaClashViewer';
import { FmfReSeedTransition } from './FmfReSeedTransition';
import { FinalAltar } from './FinalAltar';
import { PickemPassModal } from './PickemPassModal';
import { BracketReadOnlyTree } from './BracketReadOnlyTree';
import { UserAvatar } from '../common/UserAvatar';
import './LiguillaPage.css';

export const LiguillaPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const activeQuinielaId = useSelector((state: RootState) => state.quiniela.activeQuinielaId);

  const { data: quinielasResponse } = useGetQuinielasQuery();
  const quinielas = quinielasResponse?.data || [];
  const activeQuiniela = quinielas.find((q) => q.id === activeQuinielaId) || quinielas[0];

  const { data: overviewResponse, isLoading: loadingOverview, refetch: refetchOverview } = useGetLiguillaOverviewQuery(
    activeQuinielaId!,
    { skip: !activeQuinielaId }
  );

  const { data: standingsResponse } = useGetLiguillaStandingsQuery(
    activeQuinielaId!,
    { skip: !activeQuinielaId }
  );

  const [submitBracket, { isLoading: submitting }] = useSubmitLiguillaBracketMutation();
  const [seedSimulation, { isLoading: seeding }] = useSeedSimulationLiguillaMutation();

  const [activeTab, setActiveTab] = useState<'bracket' | 'standings'>('bracket');
  const [selectedQfWinners, setSelectedQfWinners] = useState<Record<number, number>>({});
  const [selectedSfWinners, setSelectedSfWinners] = useState<Record<number, number>>({});
  const [selectedChampionId, setSelectedChampionId] = useState<number | undefined>(undefined);
  const [showPassModal, setShowPassModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isAdmin = user?.role === 'ADMIN' || activeQuiniela?.userRole === 'OWNER' || activeQuiniela?.userRole === 'ADMIN';

  const handleSeedSimulation = async () => {
    if (!activeQuinielaId) return;
    try {
      setErrorMessage(null);
      await seedSimulation(activeQuinielaId).unwrap();
      refetchOverview();
    } catch (err: any) {
      setErrorMessage(err?.data?.message || err?.message || 'Error al sembrar la simulación');
    }
  };

  const overview = overviewResponse?.data;
  const userBracket = overview?.userBracket;
  const isBracketLocked = Boolean(userBracket?.isLocked || userBracket);

  // Mapa rápido de ID -> Equipo
  const teamMap = useMemo(() => {
    const map: Record<number, LiguillaTeam> = {};
    if (overview?.qualifiedTeams) {
      for (const t of overview.qualifiedTeams) {
        map[t.teamId] = t;
      }
    }
    return map;
  }, [overview?.qualifiedTeams]);

  // Si el usuario ya tiene un bracket guardado, sincronizar selecciones
  React.useEffect(() => {
    if (userBracket) {
      setSelectedQfWinners({
        1: userBracket.qfWinner1TeamId,
        2: userBracket.qfWinner2TeamId,
        3: userBracket.qfWinner3TeamId,
        4: userBracket.qfWinner4TeamId,
      });
      setSelectedSfWinners({
        1: userBracket.sfWinner1TeamId,
        2: userBracket.sfWinner2TeamId,
      });
      setSelectedChampionId(userBracket.championTeamId);
    }
  }, [userBracket]);

  const handleSelectQfWinner = (nodeNumber: number, team: LiguillaTeam) => {
    if (isBracketLocked) return;
    setSelectedQfWinners((prev) => {
      const updated = { ...prev, [nodeNumber]: team.teamId };
      // Limpiar selecciones de semis y final si cambia un semifinalista
      setSelectedSfWinners({});
      setSelectedChampionId(undefined);
      return updated;
    });
  };

  const handleSelectSfWinner = (semiIndex: number, team: LiguillaTeam) => {
    if (isBracketLocked) return;
    setSelectedSfWinners((prev) => {
      const updated = { ...prev, [semiIndex]: team.teamId };
      if (selectedChampionId && selectedChampionId !== team.teamId && !Object.values(updated).includes(selectedChampionId)) {
        setSelectedChampionId(undefined);
      }
      return updated;
    });
  };

  const handleSelectChampion = (team: LiguillaTeam) => {
    if (isBracketLocked) return;
    setSelectedChampionId(team.teamId);
  };

  const selectedQfTeamsList = useMemo(() => {
    return Object.values(selectedQfWinners)
      .map((id) => teamMap[id])
      .filter((t): t is LiguillaTeam => Boolean(t));
  }, [selectedQfWinners, teamMap]);

  const finalist1 = selectedSfWinners[1] ? teamMap[selectedSfWinners[1]] : undefined;
  const finalist2 = selectedSfWinners[2] ? teamMap[selectedSfWinners[2]] : undefined;

  const isTreeComplete =
    Object.keys(selectedQfWinners).length === 4 &&
    Object.keys(selectedSfWinners).length === 2 &&
    selectedChampionId !== undefined;

  const handleSubmit = async () => {
    if (isBracketLocked || !isTreeComplete || !activeQuinielaId || !selectedChampionId) return;
    setErrorMessage(null);

    try {
      const result = await submitBracket({
        quinielaId: activeQuinielaId,
        data: {
          qfWinner1TeamId: selectedQfWinners[1],
          qfWinner2TeamId: selectedQfWinners[2],
          qfWinner3TeamId: selectedQfWinners[3],
          qfWinner4TeamId: selectedQfWinners[4],
          sfWinner1TeamId: selectedSfWinners[1],
          sfWinner2TeamId: selectedSfWinners[2],
          championTeamId: selectedChampionId,
        },
      }).unwrap();

      if (result.isSuccess) {
        refetchOverview();
        setShowPassModal(true);
      } else {
        setErrorMessage(result.message || 'Error al confirmar el pronóstico');
      }
    } catch (err: any) {
      setErrorMessage(err?.data?.message || err?.message || 'Error al registrar el pronóstico.');
    }
  };

  if (loadingOverview) {
    return (
      <div className="liguilla-loading-state">
        <div className="liguilla-spinner" />
        <p>Cargando Pick'em Liguilla...</p>
      </div>
    );
  }

  const isAdminPreview = overview?.status === 'ADMIN_PREVIEW_HIDDEN';

  return (
    <div className="liguilla-page">
      {/* Banner de Admin Preview / Simulación */}
      {isAdmin && (
        <div className="liguilla-admin-banner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Eye size={18} />
            <span>
              <strong>Panel Admin:</strong> {isAdminPreview ? 'El torneo va en torneo regular.' : 'Modo de prueba activo.'} Puedes sembrar los primeros 8 lugares de la tabla de Liga MX para QA.
            </span>
          </div>
          <button
            type="button"
            className="btn btn--sm"
            onClick={handleSeedSimulation}
            disabled={seeding}
            style={{
              background: '#eab308',
              color: '#000',
              fontWeight: 700,
              border: 'none',
              padding: '6px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            {seeding ? 'Sembrando...' : '⚡ Sembrar Top 8 de Liga MX (Simulación)'}
          </button>
        </div>
      )}

      {/* Header */}
      <div className="liguilla-header">
        <h1 className="liguilla-header__title">Pick'em Liguilla</h1>
        <p className="liguilla-header__desc">
          Predice la ruta completa al campeonato. Acumula puntos y gana el trofeo de la Fiesta Grande.
        </p>
      </div>

      {/* Pestañas de Navegación */}
      <div className="liguilla-tabs">
        <button
          type="button"
          onClick={() => setActiveTab('bracket')}
          className={`liguilla-tab ${activeTab === 'bracket' ? 'liguilla-tab--active' : ''}`}
        >
          <Trophy size={16} /> Mi Bracket
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('standings')}
          className={`liguilla-tab ${activeTab === 'standings' ? 'liguilla-tab--active' : ''}`}
        >
          <Shield size={16} /> Tabla Pick'em
        </button>
      </div>

      {/* Vista de Espera Play-In */}
      {overview?.status === 'WAITING_PLAY_IN' && activeTab === 'bracket' && (
        <div className="liguilla-status-card">
          <Clock size={40} className="liguilla-status-card__icon" />
          <h3 className="liguilla-status-card__title">Play-In en Juego</h3>
          <p className="liguilla-status-card__desc">
            Los 8 calificados a Cuartos de Final se están definiendo en este momento. En cuanto termine el último partido de Play-In el domingo por la noche, se abrirá el Arena Clash para armar y confirmar tu pronóstico.
          </p>
        </div>
      )}

      {/* TAB 1: MI BRACKET */}
      {activeTab === 'bracket' && overview?.status !== 'WAITING_PLAY_IN' && (
        <>
          {/* Banner de Pronóstico Confirmado (si ya existe) */}
          {userBracket && (
            <div className="liguilla-locked-banner">
              <div className="liguilla-locked-banner__left">
                <div className="liguilla-locked-banner__icon-box">
                  <Lock size={18} />
                </div>
                <div className="liguilla-locked-banner__details">
                  <span className="liguilla-locked-banner__title">Pronóstico Confirmado</span>
                  <span className="liguilla-locked-banner__sub">
                    Puntos acumulados: <strong>{userBracket.totalScore} pts</strong>
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="liguilla-pass-btn"
                onClick={() => setShowPassModal(true)}
              >
                <Ticket size={16} />
                <span>Ver Mi Boleto</span>
              </button>
            </div>
          )}

          {/* Si ya está bloqueado / en progreso, mostrar el árbol de lectura */}
          {overview?.status === 'LOCKED_IN_PROGRESS' || overview?.status === 'FINISHED' ? (
            userBracket ? (
              <BracketReadOnlyTree
                bracket={userBracket}
                teams={teamMap}
                nodes={overview.nodes}
              />
            ) : (
              <div className="liguilla-status-card">
                <Lock size={36} className="text-slate-500 mb-2" />
                <h3 className="liguilla-status-card__title">Pronósticos Cerrados</h3>
                <p className="liguilla-status-card__desc">
                  La Liguilla ya comenzó y no registraste tu árbol a tiempo. Sigue la tabla en la pestaña de posiciones.
                </p>
              </div>
            )
          ) : (
            /* Modo Interactivo Arena Clash */
            <>
              {/* Fase 1: Cuartos de Final */}
              <ArenaClashViewer
                nodes={overview?.nodes || []}
                selectedQfWinners={selectedQfWinners}
                onSelectWinner={handleSelectQfWinner}
                isReadOnly={isBracketLocked}
              />

              {/* Fase 2: Semifinales (Re-seed FMF Art. 10) */}
              {selectedQfTeamsList.length === 4 && (
                <FmfReSeedTransition
                  selectedQfTeams={selectedQfTeamsList}
                  selectedSfWinners={selectedSfWinners}
                  onSelectSfWinner={handleSelectSfWinner}
                  isReadOnly={isBracketLocked}
                />
              )}

              {/* Fase 3: La Gran Final */}
              {finalist1 && finalist2 && (
                <FinalAltar
                  finalist1={finalist1}
                  finalist2={finalist2}
                  selectedChampionId={selectedChampionId}
                  onSelectChampion={handleSelectChampion}
                  isReadOnly={isBracketLocked}
                />
              )}

              {/* Mensaje de Error */}
              {errorMessage && (
                <div className="p-3 bg-red-900/30 border border-red-500/50 rounded-xl text-red-200 text-sm flex items-center gap-2 mb-4">
                  <AlertCircle size={16} />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Barra fija de Confirmación (Lock-In) */}
              {!isBracketLocked && (
                <div className="liguilla-submit-bar">
                  <button
                    type="button"
                    disabled={!isTreeComplete || submitting}
                    onClick={handleSubmit}
                    className="liguilla-submit-btn"
                  >
                    <Lock size={18} />
                    {submitting
                      ? 'Confirmando Pronóstico...'
                      : isTreeComplete
                      ? 'Confirmar Mi Pronóstico'
                      : 'Completa tu Árbol para Confirmar'}
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* TAB 2: TABLA EL PILÓN */}
      {activeTab === 'standings' && (
        <div className="liguilla-standings-container">
          <table className="liguilla-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>#</th>
                <th>Participante</th>
                <th style={{ textAlign: 'center' }}>QF</th>
                <th style={{ textAlign: 'center' }}>SF</th>
                <th style={{ textAlign: 'center' }}>Final</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {standingsResponse?.data?.standings.map((item) => {
                const isTop1 = item.rank === 1;
                const isTop2 = item.rank === 2;
                const isTop3 = item.rank === 3;

                return (
                  <tr
                    key={item.userId}
                    className={`liguilla-table-row ${
                      isTop1 ? 'liguilla-table-row--podium-1' : ''
                    } ${isTop2 ? 'liguilla-table-row--podium-2' : ''} ${
                      isTop3 ? 'liguilla-table-row--podium-3' : ''
                    }`}
                  >
                    <td>
                      <span className="liguilla-rank-badge">
                        {isTop1 ? '🥇' : isTop2 ? '🥈' : isTop3 ? '🥉' : `${item.rank}°`}
                      </span>
                    </td>
                    <td>
                      <div className="liguilla-participant-cell">
                        <UserAvatar src={item.avatarUrl} alt={item.alias} size="sm" />
                        <span className="liguilla-user-alias">{item.alias}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center', color: '#94a3b8' }}>{item.qfPoints}</td>
                    <td style={{ textAlign: 'center', color: '#94a3b8' }}>{item.sfPoints}</td>
                    <td style={{ textAlign: 'center', color: '#94a3b8' }}>
                      {item.championPoints + item.bonusPoints}
                    </td>
                    <td>
                      <span className="liguilla-pts-total">{item.totalPoints} pts</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Pick'em Pass */}
      {showPassModal && userBracket && (
        <PickemPassModal
          bracket={userBracket}
          teams={teamMap}
          quinielaName={activeQuiniela?.name}
          onClose={() => setShowPassModal(false)}
        />
      )}
    </div>
  );
};
