import React from 'react';
import { ArrowLeft, RefreshCw, ShieldAlert, Swords, Zap } from 'lucide-react';
import { useGetDuelMatchupQuery } from '../../services/api';
import type { DuelParticipantDto, DuelSide } from '../../types';
import { UserAvatar } from '../common/UserAvatar';
import './MatchupScreen.css';

interface MatchupScreenProps {
  quinielaId: number;
  fixtureId: number;
  onBack: () => void;
}

const Fighter: React.FC<{ participant: DuelParticipantDto | null; hits: number; side: DuelSide; won: boolean }> = ({
  participant,
  hits,
  side,
  won,
}) => (
  <div className={`matchup__fighter matchup__fighter--${side.toLowerCase()} ${won ? 'matchup__fighter--won' : ''}`}>
    <UserAvatar src={participant?.avatarUrl} alt={participant?.alias ?? 'Descanso'} size="xl" />
    <span className="matchup__alias">{participant?.alias ?? 'Descanso'}</span>
    {participant?.equippedTitle && <span className="matchup__fighter-title">{participant.equippedTitle}</span>}
    <span className="matchup__hits" aria-label={`${hits} aciertos`}>
      {hits}
    </span>
    <span className="matchup__hits-label">aciertos</span>
  </div>
);

export const MatchupScreen: React.FC<MatchupScreenProps> = ({ quinielaId, fixtureId, onBack }) => {
  const { data, isLoading, isError } = useGetDuelMatchupQuery({ quinielaId, fixtureId });
  const matchup = data?.data;

  return (
    <section className="matchup" aria-label="Cara a cara">
      <button type="button" className="matchup__back" onClick={onBack}>
        <ArrowLeft size={16} />
        <span>Volver a los duelos</span>
      </button>

      {isLoading && (
        <div className="matchup__state">
          <RefreshCw size={24} className="matchup__spin" />
          <p>Preparando el cara a cara...</p>
        </div>
      )}

      {isError && !isLoading && (
        <div className="matchup__state">
          <ShieldAlert size={28} />
          <p>No se pudo cargar el duelo.</p>
        </div>
      )}

      {matchup && (
        <>
          <header className="matchup__stage">
            <Fighter
              participant={matchup.fixture.home}
              hits={matchup.fixture.homeHits}
              side="HOME"
              won={matchup.fixture.result === 'HOME'}
            />
            <div className="matchup__versus" aria-hidden="true">
              <Swords size={28} />
              <span>VS</span>
            </div>
            <Fighter
              participant={matchup.fixture.away}
              hits={matchup.fixture.awayHits}
              side="AWAY"
              won={matchup.fixture.result === 'AWAY'}
            />
          </header>

          <div className="matchup__badges">
            {matchup.challengerAdvantage && (
              <span className="matchup__badge matchup__badge--advantage">
                <Zap size={14} />
                <span>
                  Ventaja del Retador:{' '}
                  {matchup.challengerAdvantage === 'HOME'
                    ? matchup.fixture.home.alias
                    : matchup.fixture.away?.alias}{' '}
                  gana el empate
                </span>
              </span>
            )}
            {matchup.fixture.wonByAdvantage && (
              <span className="matchup__badge matchup__badge--won">
                <Zap size={14} />
                <span>Resuelto por Ventaja del Retador</span>
              </span>
            )}
            {matchup.fixture.result === 'DRAW' && !matchup.fixture.wonByAdvantage && (
              <span className="matchup__badge">Empate</span>
            )}
          </div>

          <ul className="matchup__list">
            {matchup.matches.map((m) => (
              <li key={m.matchId} className={`matchup__match ${m.differential ? 'matchup__match--diff' : ''}`}>
                <div className="matchup__match-teams">
                  <span>{m.homeTeam}</span>
                  <span className="matchup__match-sep">vs</span>
                  <span>{m.awayTeam}</span>
                  {m.differential && (
                    <span className="matchup__diff-tag">
                      <Zap size={12} />
                      <span>Diferencial</span>
                    </span>
                  )}
                </div>
                <div className="matchup__picks">
                  <span
                    className={`matchup__pick ${m.winner === 'HOME' ? 'matchup__pick--hit' : ''} ${
                      m.isFinished && m.winner === 'AWAY' ? 'matchup__pick--miss' : ''
                    }`}
                  >
                    {m.homePick ?? 'Sin pick'}
                  </span>
                  <span
                    className={`matchup__pick ${m.winner === 'AWAY' ? 'matchup__pick--hit' : ''} ${
                      m.isFinished && m.winner === 'HOME' ? 'matchup__pick--miss' : ''
                    }`}
                  >
                    {m.awayPick ?? 'Sin pick'}
                  </span>
                </div>
              </li>
            ))}
            {matchup.matches.length === 0 && (
              <li className="matchup__empty">Aún no hay picks visibles para este duelo.</li>
            )}
          </ul>
        </>
      )}
    </section>
  );
};
