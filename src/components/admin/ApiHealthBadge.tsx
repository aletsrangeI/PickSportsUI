import React from 'react';
import { useGetEspnHealthQuery } from '../../services/api';
import './ApiHealthBadge.css';

interface ApiHealthBadgeProps {
  onContingencyClick?: () => void;
}

export const ApiHealthBadge: React.FC<ApiHealthBadgeProps> = ({ onContingencyClick }) => {
  const { data, isLoading } = useGetEspnHealthQuery(undefined, {
    pollingInterval: 60_000, // refresca cada 60 s
  });

  const health = data?.data;

  if (isLoading) {
    return <div className="api-health-badge api-health-badge--loading">ESPN ···</div>;
  }

  if (!health) {
    return <div className="api-health-badge api-health-badge--yellow">🟡 ESPN</div>;
  }

  const statusMap: Record<'GREEN' | 'YELLOW' | 'RED', { emoji: string; label: string; className: string }> = {
    GREEN:  { emoji: '🟢', label: 'ESPN OK',    className: 'api-health-badge--green'  },
    YELLOW: { emoji: '🟡', label: 'ESPN Lento', className: 'api-health-badge--yellow' },
    RED:    { emoji: '🔴', label: 'ESPN Caído', className: 'api-health-badge--red'    },
  };

  const { emoji, label, className } = statusMap[health.status] ?? statusMap.YELLOW;
  const checkedAt = new Date(health.checkedAt).toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={`api-health-badge ${className}`}>
      <span className="api-health-badge__indicator">
        {emoji} {label}
        {health.latencyMs > 0 && (
          <span className="api-health-badge__latency"> · {health.latencyMs}ms</span>
        )}
      </span>
      <span className="api-health-badge__time">última sync {checkedAt}</span>
      {health.status === 'RED' && onContingencyClick && (
        <button
          type="button"
          className="api-health-badge__contingency"
          onClick={onContingencyClick}
        >
          Modo Contingencia
        </button>
      )}
    </div>
  );
};
