import React from 'react';
import { useBulletin } from '../../hooks/useBulletin';
import type { BulletinWinner, PodiumMember } from '../../types';
import { UserAvatar } from '../../components/common/UserAvatar';
import {
  AlertCircle,
  BadgeCheck,
  CalendarClock,
  Check,
  Crown,
  Flame,
  HelpCircle,
  History,
  Medal,
  Megaphone,
  Moon,
  Newspaper,
  Pencil,
  Skull,
  Sparkles,
  Trophy,
  X,
} from 'lucide-react';
import './BulletinPage.css';

const MEDALS: Record<number, { label: string; modifier: string }> = {
  1: { label: 'Oro', modifier: 'gold' },
  2: { label: 'Plata', modifier: 'silver' },
  3: { label: 'Bronce', modifier: 'bronze' },
};

const formatCountdown = (firstGameUtc?: string | null): string | null => {
  if (!firstGameUtc) return null;
  const diff = new Date(firstGameUtc).getTime() - Date.now();
  if (Number.isNaN(diff) || diff <= 0) return null;
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

const formatDate = (iso?: string | null): string => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
};

const WinnerRow: React.FC<{ winner: BulletinWinner }> = ({ winner }) => (
  <div className="bulletin-winner">
    <UserAvatar
      src={winner.avatarUrl}
      alt={winner.alias}
      size="sm"
    />
    <div className="bulletin-winner__info">
      <span className="bulletin-winner__alias">{winner.alias}</span>
      {winner.notes && <span className="bulletin-winner__notes">{winner.notes}</span>}
    </div>
    <span className="bulletin-winner__value">
      {winner.value}
      {winner.secondaryValue ? ` · ${winner.secondaryValue}` : ''}
    </span>
  </div>
);

const PodiumCard: React.FC<{ member: PodiumMember }> = ({ member }) => {
  const medal = MEDALS[member.position] ?? { label: `${member.position}°`, modifier: 'default' };
  return (
    <article className={`podium-card podium-card--${medal.modifier}`}>
      <div className="podium-card__medal">
        <Medal size={26} strokeWidth={1.75} aria-label={`Medalla de ${medal.label}`} />
        <span className="podium-card__position">{member.position}°</span>
      </div>
      <UserAvatar
        src={member.avatarUrl}
        alt={member.alias}
        size="lg"
      />
      <h3 className="podium-card__alias">{member.alias}</h3>
      <p className="podium-card__stats">
        {member.hits} aciertos · {member.accuracyPct}%
      </p>
      <p className="podium-card__extra">
        {member.upsetHits > 0 && (
          <span className="podium-card__chip podium-card__chip--upset">
            <Sparkles size={12} strokeWidth={2} /> {member.upsetHits} sorpresa{member.upsetHits > 1 ? 's' : ''}
          </span>
        )}
        {member.humillaciones > 0 && (
          <span className="podium-card__chip podium-card__chip--infamy">
            <Skull size={12} strokeWidth={2} /> {member.humillaciones} goleada{member.humillaciones > 1 ? 's' : ''}
          </span>
        )}
      </p>
    </article>
  );
};

interface BulletinArchiveSelectorProps {
  seasons: Array<{ id: number; name: string; isCurrent: boolean }>;
  selectedSeasonId: number | null;
  onSelectSeason: (id: number) => void;
  weeks: Array<{ id: number; name: string; status: string }>;
  selectedWeekId: number | null;
  onSelectWeek: (id: number | null) => void;
}

const BulletinArchiveSelector: React.FC<BulletinArchiveSelectorProps> = ({
  seasons,
  selectedSeasonId,
  onSelectSeason,
  weeks,
  selectedWeekId,
  onSelectWeek,
}) => (
  <section className="bulletin-archive-card" aria-label="Histórico de Ediciones">
    <div className="bulletin-archive-card__header">
      <div className="bulletin-archive-card__icon-box">
        <History size={18} strokeWidth={2} />
      </div>
      <div className="bulletin-archive-card__titles">
        <h3 className="bulletin-archive-card__title">Archivo de Ediciones · PickSports Weekly</h3>
        <p className="bulletin-archive-card__subtitle">
          Selecciona una jornada o temporada para consultar sus resultados y trofeos
        </p>
      </div>
    </div>
    <div className="bulletin-archive-card__filters">
      {seasons.length > 1 && (
        <div className="bulletin-archive-card__filter">
          <label className="bulletin-archive-card__label" htmlFor="bulletin-season-bottom">
            Temporada
          </label>
          <select
            id="bulletin-season-bottom"
            className="select-field bulletin-archive-card__select"
            value={selectedSeasonId || ''}
            onChange={(e) => onSelectSeason(Number(e.target.value))}
          >
            {seasons.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} {s.isCurrent ? '(En curso)' : ''}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="bulletin-archive-card__filter">
        <label className="bulletin-archive-card__label" htmlFor="bulletin-week-bottom">
          Edición / Jornada
        </label>
        <select
          id="bulletin-week-bottom"
          className="select-field bulletin-archive-card__select"
          value={selectedWeekId ?? ''}
          onChange={(e) => onSelectWeek(e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">Última edición oficial</option>
          {weeks.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name} {w.status === 'SCORED' ? '(Oficial)' : `(${w.status})`}
            </option>
          ))}
        </select>
      </div>
    </div>
  </section>
);

export const BulletinPage: React.FC = () => {
  const {
    quinielaId,
    seasons,
    weeks,
    selectedSeasonId,
    selectedWeekId,
    bulletin,
    isLoadingBulletin,
    isBulletinError,
    refetchBulletin,
    isOwnerOrAdmin,
    isEditingAnnouncement,
    announcementDraft,
    isSavingAnnouncement,
    setSelectedSeasonId,
    handleSelectWeek,
    setIsEditingAnnouncement,
    setAnnouncementDraft,
    handleSaveAnnouncement,
  } = useBulletin();

  if (!quinielaId) {
    return (
      <div className="bulletin-page__empty-state">
        <AlertCircle size={40} />
        <h2>No tienes ninguna quiniela seleccionada</h2>
        <p>Crea o únete a una quiniela para leer el periódico semanal.</p>
      </div>
    );
  }

  const countdown = formatCountdown(bulletin?.nextWeekInfo?.firstGameUtc);

  const handleSeasonChange = (id: number) => {
    setSelectedSeasonId(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleWeekChange = (id: number | null) => {
    handleSelectWeek(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="bulletin-page">
      {isLoadingBulletin && !bulletin ? (
        <div className="bulletin-page__loading">Cargando edición de PickSports Weekly...</div>
      ) : isBulletinError && !bulletin ? (
        <div className="bulletin-page__empty-container">
          <div className="bulletin-page__empty-state">
            <AlertCircle size={40} />
            <h2>No se pudo cargar la edición</h2>
            <p>El servicio no está disponible por ahora. Verifica tu conexión e intenta de nuevo.</p>
            <button
              type="button"
              className="bulletin-page__retry"
              onClick={() => {
                void refetchBulletin();
              }}
            >
              Reintentar
            </button>
          </div>
          <BulletinArchiveSelector
            seasons={seasons}
            selectedSeasonId={selectedSeasonId}
            onSelectSeason={handleSeasonChange}
            weeks={weeks}
            selectedWeekId={selectedWeekId}
            onSelectWeek={handleWeekChange}
          />
        </div>
      ) : !bulletin ? (
        <div className="bulletin-page__empty-container">
          <div className="bulletin-page__empty-state">
            <Newspaper size={40} />
            <h2>Aún no hay ediciones publicadas</h2>
            <p>PickSports Weekly se publica automáticamente al calificarse los partidos de la jornada.</p>
          </div>
          <BulletinArchiveSelector
            seasons={seasons}
            selectedSeasonId={selectedSeasonId}
            onSelectSeason={handleSeasonChange}
            weeks={weeks}
            selectedWeekId={selectedWeekId}
            onSelectWeek={handleWeekChange}
          />
        </div>
      ) : (
        <article className="bulletin-paper">
          {/* Encabezado de edición estilo American Sports Recap Show */}
          <header className="bulletin-paper__masthead">
            <div className="bulletin-paper__badge-row">
              <span className="bulletin-paper__show-tag">
                <Flame size={13} strokeWidth={2.5} /> MONDAY NIGHT RECAP
              </span>
              <span className={`bulletin-paper__badge ${bulletin.isOfficial ? 'bulletin-paper__badge--official' : 'bulletin-paper__badge--draft'}`}>
                {bulletin.isOfficial ? <BadgeCheck size={14} strokeWidth={2} /> : <CalendarClock size={14} strokeWidth={2} />}
                {bulletin.isOfficial ? 'Edición Oficial' : 'Edición Preliminar'}
              </span>
            </div>
            <h1 className="bulletin-paper__title">PickSports Weekly</h1>
            <p className="bulletin-paper__kicker">
              Jornada {bulletin.weekNumber} · Análisis, Rendimiento y Sala de Trofeos
            </p>
            <div className="bulletin-paper__meta">
              <span className="bulletin-paper__date">Cierre: {formatDate(bulletin.weekEndDate)}</span>
              {bulletin.publishedAtUtc && (
                <span className="bulletin-paper__date">Publicado: {formatDate(bulletin.publishedAtUtc)}</span>
              )}
            </div>
          </header>

          {/* Tablón del Administrador */}
          <section className="bulletin-paper__section bulletin-banner" aria-label="Tablón del administrador">
            <div className="bulletin-banner__header">
              <Megaphone size={18} strokeWidth={2} className="bulletin-banner__icon" />
              <h2 className="bulletin-banner__title">Tablón del Administrador</h2>
              {isOwnerOrAdmin && !isEditingAnnouncement && (
                <button
                  type="button"
                  className="bulletin-banner__edit"
                  onClick={() => setIsEditingAnnouncement(true)}
                >
                  <Pencil size={14} strokeWidth={2} /> Editar
                </button>
              )}
            </div>

            {isEditingAnnouncement ? (
              <div className="bulletin-banner__editor">
                <textarea
                  className="bulletin-banner__textarea"
                  rows={3}
                  maxLength={2000}
                  value={announcementDraft}
                  onChange={(e) => setAnnouncementDraft(e.target.value)}
                  placeholder="Escribe el anuncio oficial de la jornada..."
                />
                <div className="bulletin-banner__actions">
                  <button
                    type="button"
                    className="bulletin-banner__save"
                    onClick={handleSaveAnnouncement}
                    disabled={isSavingAnnouncement}
                  >
                    <Check size={14} strokeWidth={2} /> {isSavingAnnouncement ? 'Guardando...' : 'Guardar'}
                  </button>
                  <button
                    type="button"
                    className="bulletin-banner__cancel"
                    onClick={() => {
                      setIsEditingAnnouncement(false);
                      setAnnouncementDraft(bulletin.adminAnnouncement ?? '');
                    }}
                  >
                    <X size={14} strokeWidth={2} /> Cancelar
                  </button>
                </div>
              </div>
            ) : bulletin.adminAnnouncement ? (
              <p className="bulletin-banner__text">{bulletin.adminAnnouncement}</p>
            ) : (
              <p className="bulletin-banner__empty">Sin anuncios oficiales para esta edición.</p>
            )}

            {bulletin.nextWeekInfo && (
              <div className="bulletin-banner__next">
                <CalendarClock size={16} strokeWidth={2} />
                <span>
                  Próxima jornada: {bulletin.nextWeekInfo.weekName}
                  {bulletin.nextWeekInfo.firstGameUtc &&
                    ` · Cierra el ${formatDate(bulletin.nextWeekInfo.firstGameUtc)}`}
                </span>
                {countdown && <strong className="bulletin-banner__countdown">{countdown}</strong>}
              </div>
            )}
          </section>

          {/* El Podio */}
          <section className="bulletin-paper__section" aria-label="Podio de la jornada">
            <h2 className="bulletin-paper__section-title">
              <Trophy size={18} strokeWidth={2} /> El Podio de la Jornada
            </h2>
            {bulletin.podium.length === 0 ? (
              <p className="bulletin-paper__empty-note">Aún no hay resultados para esta edición.</p>
            ) : (
              <div className="bulletin-podium">
                {bulletin.podium.map((member) => (
                  <PodiumCard key={member.memberId} member={member} />
                ))}
              </div>
            )}
          </section>

          {/* Salón de la Gloria */}
          <section className="bulletin-paper__section bulletin-glory" aria-label="Salón de la Gloria">
            <h2 className="bulletin-paper__section-title">
              <Crown size={18} strokeWidth={2} /> Salón de la Gloria
            </h2>
            <div className="bulletin-awards-grid">
              <div className="bulletin-award bulletin-award--mvp">
                <h3 className="bulletin-award__title"><Trophy size={16} strokeWidth={2} /> MVP de la Jornada</h3>
                {bulletin.awards.mvp.length > 0
                  ? bulletin.awards.mvp.map((w) => <WinnerRow key={w.memberId} winner={w} />)
                  : <p className="bulletin-paper__empty-note">Desierto esta jornada.</p>}
              </div>
              <div className="bulletin-award bulletin-award--surprise">
                <h3 className="bulletin-award__title"><Sparkles size={16} strokeWidth={2} /> Rey de las Sorpresas</h3>
                {bulletin.awards.surpriseKing.length > 0
                  ? bulletin.awards.surpriseKing.map((w) => <WinnerRow key={w.memberId} winner={w} />)
                  : <p className="bulletin-paper__empty-note">Nadie acertó sorpresas.</p>}
              </div>
              <div className="bulletin-award bulletin-award--breaker">
                <h3 className="bulletin-award__title"><Flame size={16} strokeWidth={2} /> Rompe-Quinielas</h3>
                {bulletin.awards.rompeQuinielas ? (
                  <div className="bulletin-breaker">
                    <span className="bulletin-breaker__match">{bulletin.awards.rompeQuinielas.matchLabel}</span>
                    <span className="bulletin-breaker__accuracy">
                      Solo {bulletin.awards.rompeQuinielas.accuracyPct}% de acierto
                      ({bulletin.awards.rompeQuinielas.correctPicks}/{bulletin.awards.rompeQuinielas.totalPicks})
                    </span>
                  </div>
                ) : (
                  <p className="bulletin-paper__empty-note">Sin partidos calificados.</p>
                )}
              </div>
            </div>
          </section>

          {/* Sala de la Infamia */}
          <section className="bulletin-paper__section bulletin-infamy" aria-label="Sala de la Infamia">
            <h2 className="bulletin-paper__section-title">
              <Skull size={18} strokeWidth={2} /> Sala de la Infamia
            </h2>
            <div className="bulletin-awards-grid bulletin-awards-grid--infamy">
              <div className="bulletin-award bulletin-award--humillado">
                <h3 className="bulletin-award__title"><Skull size={16} strokeWidth={2} /> El Humillado</h3>
                {bulletin.awards.humillado.length > 0
                  ? bulletin.awards.humillado.map((w) => <WinnerRow key={w.memberId} winner={w} />)
                  : <p className="bulletin-paper__empty-note">Nadie sufrió goleada.</p>}
              </div>
              <div className="bulletin-award bulletin-award--somnifero">
                <h3 className="bulletin-award__title"><Moon size={16} strokeWidth={2} /> Víctima del Somnífero</h3>
                {bulletin.awards.somnifero.length > 0
                  ? bulletin.awards.somnifero.map((w) => <WinnerRow key={w.memberId} winner={w} />)
                  : <p className="bulletin-paper__empty-note">Sin 0-0 traicioneros.</p>}
              </div>
              <div className="bulletin-award bulletin-award--empate">
                <h3 className="bulletin-award__title"><HelpCircle size={16} strokeWidth={2} /> Rey del Empate Fallido</h3>
                {bulletin.awards.empateFallido.length > 0
                  ? bulletin.awards.empateFallido.map((w) => <WinnerRow key={w.memberId} winner={w} />)
                  : <p className="bulletin-paper__empty-note">Todos los empates se cumplieron.</p>}
              </div>
            </div>
          </section>

          {/* Selector de ediciones al pie de página (Archivo histórico) */}
          <BulletinArchiveSelector
            seasons={seasons}
            selectedSeasonId={selectedSeasonId}
            onSelectSeason={handleSeasonChange}
            weeks={weeks}
            selectedWeekId={selectedWeekId}
            onSelectWeek={handleWeekChange}
          />
        </article>
      )}
    </div>
  );
};
