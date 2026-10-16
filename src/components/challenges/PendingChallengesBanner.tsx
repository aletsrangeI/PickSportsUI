import React, { useState } from 'react';
import { useGetPendingChallengesQuery } from '../../services/api';
import type { Challenge, Match } from '../../types';
import { RespondChallengeModal } from './RespondChallengeModal';
import { Swords, ChevronRight } from 'lucide-react';
import './PendingChallengesBanner.css';

interface PendingChallengesBannerProps {
  quinielaId: number;
  weekMatches?: Match[];
}

export const PendingChallengesBanner: React.FC<PendingChallengesBannerProps> = ({
  quinielaId,
  weekMatches = [],
}) => {
  const { data: response } = useGetPendingChallengesQuery(quinielaId, {
    skip: !quinielaId,
  });

  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);

  const pendingChallenges = response?.data || [];

  if (pendingChallenges.length === 0) {
    return null;
  }

  const latestChallenge = pendingChallenges[0];

  return (
    <>
      <div
        className="pending-challenges-banner"
        onClick={() => setSelectedChallenge(latestChallenge)}
        role="button"
        tabIndex={0}
        aria-label="Tienes invitaciones a retos pendientes"
      >
        <div className="pending-challenges-banner__left">
          <div className="pending-challenges-banner__icon-wrap">
            <Swords size={18} color="#eab308" />
          </div>
          <div className="pending-challenges-banner__text">
            <div className="pending-challenges-banner__title">
              <span>¡Te han retado!</span>
              <span className="pending-challenges-banner__badge">
                {pendingChallenges.length}
              </span>
            </div>
            <div className="pending-challenges-banner__desc">
              {latestChallenge.creatorAlias} te retó: "{latestChallenge.stakesDescription}"
            </div>
          </div>
        </div>

        <button
          type="button"
          className="pending-challenges-banner__action-btn"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedChallenge(latestChallenge);
          }}
        >
          <span>Responder</span>
          <ChevronRight size={14} />
        </button>
      </div>

      {selectedChallenge && (
        <RespondChallengeModal
          isOpen={!!selectedChallenge}
          onClose={() => setSelectedChallenge(null)}
          challenge={selectedChallenge}
          weekMatches={weekMatches}
        />
      )}
    </>
  );
};
