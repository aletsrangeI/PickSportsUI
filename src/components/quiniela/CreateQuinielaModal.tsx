import React, { useState, useEffect, forwardRef } from 'react';
import { X, Trophy, AlertCircle } from 'lucide-react';
import { useCreateQuinielaMutation, useGetLeaguesQuery, useGetSeasonsQuery } from '../../services/api';
import { useDispatch } from 'react-redux';
import { setActiveQuinielaId } from '../../store/quinielaSlice';

interface CreateQuinielaModalProps {
  onClose: () => void;
}

export const CreateQuinielaModal = forwardRef<HTMLDialogElement, CreateQuinielaModalProps>(
  ({ onClose }, ref) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [leagueId, setLeagueId] = useState<number>(0);
    const [entryFee, setEntryFee] = useState<number>(100);
    const [firstPlacePct, setFirstPlacePct] = useState<number>(70);
    const [secondPlacePct, setSecondPlacePct] = useState<number>(20);
    const [thirdPlacePct, setThirdPlacePct] = useState<number>(10);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const { data: leaguesResponse, isLoading: isLeaguesLoading } = useGetLeaguesQuery();
    const leagues = leaguesResponse?.data || [];

    const { data: seasonsResponse } = useGetSeasonsQuery(leagueId || undefined);
    const seasons = seasonsResponse?.data || [];

    const leagueSeasons = seasons.filter((s) => s.leagueId === leagueId);
    const currentSeason =
      leagueSeasons.find((s) => s.isCurrent && !s.isFinished) ??
      leagueSeasons.find((s) => !s.isFinished) ??
      leagueSeasons[0];
    const hasFinishedOnly = leagueSeasons.length > 0 && leagueSeasons.every((s) => s.isFinished);

    useEffect(() => {
      if (leagues.length > 0 && (!leagueId || !leagues.some((l) => l.id === leagueId))) {
        setLeagueId(leagues[0].id);
      }
    }, [leagues, leagueId]);

    const [createQuiniela, { isLoading }] = useCreateQuinielaMutation();
    const dispatch = useDispatch();

    const sumPcts = Number(firstPlacePct) + Number(secondPlacePct) + Number(thirdPlacePct);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setErrorMessage(null);

      if (!leagueId) {
        setErrorMessage('Por favor selecciona una liga deportiva.');
        return;
      }

      if (sumPcts !== 100) {
        setErrorMessage('La suma de porcentajes de premios debe ser exactamente 100%.');
        return;
      }

      try {
        const result = await createQuiniela({
          name,
          description: description || undefined,
          leagueId: Number(leagueId),
          entryFee: Number(entryFee),
          firstPlacePct: Number(firstPlacePct),
          secondPlacePct: Number(secondPlacePct),
          thirdPlacePct: Number(thirdPlacePct),
        }).unwrap();

        if (result.isSuccess && result.data) {
          dispatch(setActiveQuinielaId(result.data.id));
          // Reset form
          setName('');
          setDescription('');
          onClose();
        } else {
          setErrorMessage(result.message || 'Error al crear la quiniela');
        }
      } catch (err: any) {
        setErrorMessage(err?.data?.message || 'Error de conexión al crear la quiniela');
      }
    };

    return (
      <dialog ref={ref} className="modal" onClose={onClose}>
        <div className="modal__handle" />
        <div className="modal__header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Trophy className="quiniela-selector__icon" size={20} />
            <h2 className="modal__title">Crear Nueva Quiniela</h2>
          </div>
          <button
            type="button"
            className="modal__close"
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <div className="modal__body">
            {errorMessage && (
              <div className="alert alert--error">
                <AlertCircle size={18} />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-group__label" htmlFor="quiniela-name">
                Nombre de la Quiniela *
              </label>
              <input
                id="quiniela-name"
                type="text"
                className="form-group__input"
                placeholder={currentSeason ? `Ej. Quiniela ${currentSeason.name}` : `Ej. Quiniela Apertura ${new Date().getFullYear()}`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={3}
                maxLength={100}
              />
            </div>

            <div className="form-group">
              <label className="form-group__label" htmlFor="quiniela-league">
                Torneo / Liga Deportiva *
              </label>
              <select
                id="quiniela-league"
                className="form-group__select"
                value={leagueId}
                onChange={(e) => setLeagueId(Number(e.target.value))}
                disabled={isLeaguesLoading || leagues.length === 0}
              >
                {isLeaguesLoading && <option value={0}>Cargando torneos desde la base de datos...</option>}
                {!isLeaguesLoading && leagues.length === 0 && <option value={0}>No hay ligas disponibles</option>}
                {leagues.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} {l.country ? `(${l.country})` : ''} - {l.sportName}
                  </option>
                ))}
              </select>

              {/* Colchón de seguridad y torneo en curso */}
              {currentSeason && !currentSeason.isFinished && (
                <div
                  style={{
                    marginTop: '8px',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.8125rem',
                  }}
                >
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>Torneo actual en curso: </span>
                    <strong style={{ color: 'var(--color-primary)' }}>{currentSeason.name}</strong>
                  </div>
                  <span className="badge badge--primary" style={{ fontSize: '0.6875rem' }}>
                    {currentSeason.status === 'ACTIVE' ? 'Activo' : 'Próximo'}
                  </span>
                </div>
              )}

              {hasFinishedOnly && (
                <div
                  className="alert alert--warning"
                  style={{ marginTop: '8px', padding: '8px 12px', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <AlertCircle size={15} style={{ flexShrink: 0 }} />
                  <span>Todos los torneos registrados para esta liga han concluido. Sincroniza el torneo en curso desde el menú <strong>Partidos / Sync</strong>.</span>
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-group__label" htmlFor="quiniela-fee">
                Cuota de Entrada ($ MXN)
              </label>
              <input
                id="quiniela-fee"
                type="number"
                min="0"
                step="10"
                className="form-group__input"
                value={entryFee}
                onChange={(e) => setEntryFee(Number(e.target.value))}
              />
            </div>

            <div style={{ marginTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span className="form-group__label" style={{ fontWeight: 600, margin: 0 }}>
                  Reparto de la Bolsa
                </span>
                <span
                  className="badge"
                  style={{
                    fontSize: '0.75rem',
                    padding: '2px 8px',
                    backgroundColor: sumPcts === 100 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    color: sumPcts === 100 ? 'var(--color-primary)' : 'var(--color-danger)',
                    border: `1px solid ${sumPcts === 100 ? 'var(--color-primary)' : 'var(--color-danger)'}`,
                  }}
                >
                  {sumPcts === 100 ? '100% ✓ Válido' : `${sumPcts}% (${sumPcts > 100 ? `sobran ${sumPcts - 100}%` : `faltan ${100 - sumPcts}%`})`}
                </span>
              </div>

              {/* Barra de progreso visual segmentada */}
              <div
                style={{
                  height: '6px',
                  borderRadius: '3px',
                  backgroundColor: 'var(--bg-app)',
                  display: 'flex',
                  overflow: 'hidden',
                  marginBottom: '10px',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div
                  style={{
                    width: `${Math.min(firstPlacePct, 100)}%`,
                    backgroundColor: 'var(--color-primary)',
                    transition: 'width var(--transition-fast)',
                  }}
                  title={`1er Lugar: ${firstPlacePct}%`}
                />
                <div
                  style={{
                    width: `${Math.min(secondPlacePct, 100)}%`,
                    backgroundColor: 'var(--color-secondary)',
                    transition: 'width var(--transition-fast)',
                  }}
                  title={`2do Lugar: ${secondPlacePct}%`}
                />
                <div
                  style={{
                    width: `${Math.min(thirdPlacePct, 100)}%`,
                    backgroundColor: 'var(--color-accent)',
                    transition: 'width var(--transition-fast)',
                  }}
                  title={`3er Lugar: ${thirdPlacePct}%`}
                />
                {sumPcts > 100 && (
                  <div
                    style={{
                      flex: 1,
                      backgroundColor: 'var(--color-danger)',
                      transition: 'width var(--transition-fast)',
                    }}
                    title={`Excedente: +${sumPcts - 100}%`}
                  />
                )}
              </div>

              {/* Botones de Presets Rápidos */}
              <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
                {[
                  { label: '🏆 Solo 1° (100%)', pcts: [100, 0, 0] },
                  { label: 'Top 3 (70/20/10)', pcts: [70, 20, 10] },
                  { label: 'Top 2 (70/30)', pcts: [70, 30, 0] },
                  { label: '50/30/20', pcts: [50, 30, 20] },
                ].map((preset) => {
                  const isSelected =
                    firstPlacePct === preset.pcts[0] &&
                    secondPlacePct === preset.pcts[1] &&
                    thirdPlacePct === preset.pcts[2];
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      className={`btn btn--sm ${isSelected ? 'btn--primary' : 'btn--outline'}`}
                      style={{
                        fontSize: '0.75rem',
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-full)',
                      }}
                      onClick={() => {
                        setFirstPlacePct(preset.pcts[0]);
                        setSecondPlacePct(preset.pcts[1]);
                        setThirdPlacePct(preset.pcts[2]);
                      }}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>

              {/* Inputs numéricos con sufijo % */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-primary)', display: 'block', marginBottom: '4px' }}>
                    1er Lugar
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      className="form-group__input"
                      style={{ paddingRight: '22px', fontWeight: 700 }}
                      value={firstPlacePct}
                      onChange={(e) => setFirstPlacePct(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                    />
                    <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>%</span>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-secondary)', display: 'block', marginBottom: '4px' }}>
                    2do Lugar
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      className="form-group__input"
                      style={{ paddingRight: '22px', fontWeight: 700 }}
                      value={secondPlacePct}
                      onChange={(e) => setSecondPlacePct(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                    />
                    <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>%</span>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-accent)', display: 'block', marginBottom: '4px' }}>
                    3er Lugar
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      className="form-group__input"
                      style={{ paddingRight: '22px', fontWeight: 700 }}
                      value={thirdPlacePct}
                      onChange={(e) => setThirdPlacePct(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                    />
                    <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>%</span>
                  </div>
                </div>
              </div>

              {sumPcts !== 100 && (
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: sumPcts > 100 ? 'var(--color-danger)' : 'var(--color-accent)',
                    marginTop: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <AlertCircle size={13} style={{ flexShrink: 0 }} />
                  <span>
                    {sumPcts > 100
                      ? `La suma da ${sumPcts}%. Sobran ${sumPcts - 100}% para llegar al 100%.`
                      : `Faltan repartir ${100 - sumPcts}%. La suma debe ser exactamente 100%.`}
                  </span>
                </div>
              )}
            </div>

            <div className="form-group" style={{ marginTop: '16px' }}>
              <label className="form-group__label" htmlFor="quiniela-desc">
                Descripción / Reglas (Opcional)
              </label>
              <textarea
                id="quiniela-desc"
                className="form-group__textarea"
                rows={2}
                placeholder="Reglas de la quiniela entre amigos..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          <div className="modal__footer">
            <button
              type="button"
              className="btn btn--secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={isLoading || !name.trim() || sumPcts !== 100 || !leagueId}
            >
              {isLoading ? 'Creando...' : 'Crear Quiniela'}
            </button>
          </div>
        </form>
      </dialog>
    );
  }
);

CreateQuinielaModal.displayName = 'CreateQuinielaModal';
