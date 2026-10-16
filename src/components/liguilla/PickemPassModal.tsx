import React, { useRef, useState } from 'react';
import { X, Trophy, Sparkles, Shield, Lock, Share2, Download, Loader2, Check } from 'lucide-react';
import type { LiguillaBracketDetail, LiguillaTeam } from '../../types';
import { shareElementAsImage, downloadElementAsImage } from '../../utils/shareImageUtils';

interface PickemPassModalProps {
  bracket: LiguillaBracketDetail;
  teams: Record<number, LiguillaTeam>;
  quinielaName?: string;
  onClose: () => void;
}

export const PickemPassModal: React.FC<PickemPassModalProps> = ({
  bracket,
  teams,
  quinielaName = 'Quiniela Liga MX',
  onClose,
}) => {
  const passCardRef = useRef<HTMLDivElement>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const championTeam = teams[bracket.championTeamId];
  const sf1Team = teams[bracket.sfWinner1TeamId];
  const sf2Team = teams[bracket.sfWinner2TeamId];
  const qf1Team = teams[bracket.qfWinner1TeamId];
  const qf2Team = teams[bracket.qfWinner2TeamId];
  const qf3Team = teams[bracket.qfWinner3TeamId];
  const qf4Team = teams[bracket.qfWinner4TeamId];

  const handleShare = async () => {
    if (!passCardRef.current || isSharing) return;
    setIsSharing(true);
    setFeedbackMsg(null);
    try {
      const result = await shareElementAsImage(passCardRef.current, {
        title: "Mi Boleto - Pick'em Liguilla",
        text: `¡Mira mi pronóstico oficial de Pick'em Liguilla en PickSports! 🏆 Participante: ${bracket.alias}`,
        filename: `boleto-liguilla-${bracket.alias}.png`,
        pixelRatio: 2,
      });

      if (result === 'downloaded') {
        setFeedbackMsg('¡Imagen descargada!');
        setTimeout(() => setFeedbackMsg(null), 3000);
      }
    } catch {
      setFeedbackMsg('Error al generar la imagen');
      setTimeout(() => setFeedbackMsg(null), 3000);
    } finally {
      setIsSharing(false);
    }
  };

  const handleDownload = async () => {
    if (!passCardRef.current || isDownloading) return;
    setIsDownloading(true);
    setFeedbackMsg(null);
    try {
      await downloadElementAsImage(
        passCardRef.current,
        `boleto-liguilla-${bracket.alias}.png`,
        { pixelRatio: 2 }
      );
      setFeedbackMsg('¡Imagen descargada con éxito!');
      setTimeout(() => setFeedbackMsg(null), 3000);
    } catch {
      setFeedbackMsg('Error al descargar la imagen');
      setTimeout(() => setFeedbackMsg(null), 3000);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="pickem-modal-overlay" onClick={onClose}>
      <div className="pickem-modal-content" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="pickem-modal-close" onClick={onClose} aria-label="Cerrar">
          <X size={20} />
        </button>

        {/* Boleto estilo Apple Wallet (Capturado en alta resolución para compartir) */}
        <div ref={passCardRef} className="pickem-pass">
          <div className="pickem-pass__header">
            <div className="pickem-pass__logo-group">
              <Sparkles size={16} className="pickem-pass__sparkle" />
              <span className="pickem-pass__badge-text">PICK'EM LIGUILLA · BRACKET PASS</span>
            </div>
            <span className="pickem-pass__secure-tag">
              <Lock size={12} /> CONFIRMADO
            </span>
          </div>

          <div className="pickem-pass__user-section">
            <div className="pickem-pass__user-info">
              <span className="pickem-pass__user-label">PARTICIPANTE</span>
              <h3 className="pickem-pass__user-alias">{bracket.alias}</h3>
              <span className="pickem-pass__quiniela-sub">{quinielaName}</span>
            </div>
            <div className="pickem-pass__score-badge">
              <span className="pickem-pass__score-pts">{bracket.totalScore}</span>
              <span className="pickem-pass__score-label">PTS</span>
            </div>
          </div>

          <div className="pickem-pass__divider">
            <div className="pickem-pass__notch pickem-pass__notch--left" />
            <div className="pickem-pass__dashed-line" />
            <div className="pickem-pass__notch pickem-pass__notch--right" />
          </div>

          {/* Campeón Pronosticado con Escudo Oficial */}
          <div className="pickem-pass__champion-highlight">
            <div className="pickem-pass__trophy-icon-wrap">
              {championTeam?.logoUrl ? (
                <img
                  src={championTeam.logoUrl}
                  alt={championTeam.name}
                  style={{ width: '38px', height: '38px', objectFit: 'contain' }}
                />
              ) : (
                <Trophy size={28} className="pickem-pass__gold-trophy" />
              )}
            </div>
            <div>
              <span className="pickem-pass__champ-label">PRONÓSTICO A CAMPEÓN</span>
              <h4 className="pickem-pass__champ-name">{championTeam?.name ?? 'Por definir'}</h4>
            </div>
          </div>

          {/* Ruta al Campeonato */}
          <div className="pickem-pass__pathway">
            {/* Finalistas */}
            <div>
              <span className="pickem-pass__stage-title">FINALISTAS</span>
              <div className="pickem-pass__chips">
                <span className="pickem-pass__chip" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  {sf1Team?.logoUrl ? (
                    <img
                      src={sf1Team.logoUrl}
                      alt={sf1Team.name}
                      style={{ width: '18px', height: '18px', objectFit: 'contain' }}
                    />
                  ) : (
                    <Shield size={14} />
                  )}
                  <span>{sf1Team?.shortName || sf1Team?.name || 'TBD'}</span>
                </span>
                <span className="pickem-pass__chip-vs">vs</span>
                <span className="pickem-pass__chip" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  {sf2Team?.logoUrl ? (
                    <img
                      src={sf2Team.logoUrl}
                      alt={sf2Team.name}
                      style={{ width: '18px', height: '18px', objectFit: 'contain' }}
                    />
                  ) : (
                    <Shield size={14} />
                  )}
                  <span>{sf2Team?.shortName || sf2Team?.name || 'TBD'}</span>
                </span>
              </div>
            </div>

            {/* Semifinalistas */}
            <div>
              <span className="pickem-pass__stage-title">SEMIFINALISTAS</span>
              <div className="pickem-pass__qf-grid">
                {[qf1Team, qf2Team, qf3Team, qf4Team].map((team, idx) => (
                  <span
                    key={idx}
                    className="pickem-pass__qf-chip"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    {team?.logoUrl ? (
                      <img
                        src={team.logoUrl}
                        alt={team.name}
                        style={{ width: '16px', height: '16px', objectFit: 'contain' }}
                      />
                    ) : (
                      <Shield size={12} />
                    )}
                    <span>{team?.shortName || team?.name || 'TBD'}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Footer del Boleto */}
          <div className="pickem-pass__footer">
            <div className="pickem-pass__barcode-wrap">
              <span className="pickem-pass__code-text" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                BOLETO OFICIAL · PASS-{bracket.id.toString().padStart(6, '0')} · {bracket.submittedAtUtc ? new Date(bracket.submittedAtUtc).toLocaleDateString('es-MX') : 'ACTIVO'}
              </span>
            </div>
          </div>
        </div>

        {/* Botones de Compartir y Descargar Imagen Oficial */}
        <div className="pickem-modal-actions">
          <button
            type="button"
            className="pickem-share-btn"
            onClick={handleShare}
            disabled={isSharing || isDownloading}
          >
            {isSharing ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Generando Imagen...</span>
              </>
            ) : (
              <>
                <Share2 size={18} />
                <span>Compartir Imagen</span>
              </>
            )}
          </button>

          <button
            type="button"
            className="pickem-download-btn"
            onClick={handleDownload}
            disabled={isSharing || isDownloading}
            title="Descargar imagen en formato PNG"
          >
            {isDownloading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Download size={18} />
            )}
            <span>Descargar PNG</span>
          </button>
        </div>

        {feedbackMsg && (
          <div className="pickem-feedback-toast">
            <Check size={14} />
            <span>{feedbackMsg}</span>
          </div>
        )}
      </div>
    </div>
  );
};
