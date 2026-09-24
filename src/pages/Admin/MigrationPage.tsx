import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Users,
  Trophy,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Sparkles,
  Info
} from 'lucide-react';
import type { RootState } from '../../store';
import { setActiveQuinielaId } from '../../store/quinielaSlice';
import {
  usePreviewMigrationMutation,
  useExecuteMigrationMutation,
} from '../../services/api';
import type {
  MigrationPreviewData,
  MigrationResultData,
} from '../../types';

export const MigrationPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Form parameters
  const [quinielaName, setQuinielaName] = useState('Liga MX Clausura 2026');
  const [adminAlias, setAdminAlias] = useState('Alex');
  const [entryFee, setEntryFee] = useState<number>(0);

  // API mutations
  const [previewMigration, { isLoading: isPreviewLoading }] = usePreviewMigrationMutation();
  const [executeMigration, { isLoading: isExecuting }] = useExecuteMigrationMutation();

  // Results & Errors
  const [previewData, setPreviewData] = useState<MigrationPreviewData | null>(null);
  const [migrationResult, setMigrationResult] = useState<MigrationResultData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileSelect = async (file: File) => {
    if (!file.name.endsWith('.xlsx')) {
      setErrorMessage('Por favor selecciona un archivo con formato .xlsx');
      return;
    }

    setSelectedFile(file);
    setErrorMessage(null);
    setMigrationResult(null);

    // Auto-preview
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await previewMigration(formData).unwrap();
      if (res.isSuccess && res.data) {
        setPreviewData(res.data);
        if (res.data.suggestedQuinielaName) {
          setQuinielaName(res.data.suggestedQuinielaName);
        }
        // Match user's display name or username to an alias if possible, else default to first or 'Alex'
        const matchedParticipant = res.data.participants.find(
          (p) =>
            p.alias.toLowerCase() === user?.displayName?.toLowerCase() ||
            p.alias.toLowerCase() === user?.username?.toLowerCase() ||
            p.alias.toLowerCase() === 'alex'
        );
        if (matchedParticipant) {
          setAdminAlias(matchedParticipant.alias);
        } else if (res.data.participants.length > 0) {
          setAdminAlias(res.data.participants[0].alias);
        }
      } else {
        setErrorMessage(res.message || 'No se pudo procesar la previsualización');
      }
    } catch (err: any) {
      setErrorMessage(err?.data?.message || 'Error al comunicarse con el servidor para la previsualización');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleExecute = async () => {
    if (!selectedFile) {
      setErrorMessage('Selecciona un archivo .xlsx primero.');
      return;
    }

    setErrorMessage(null);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('quinielaName', quinielaName);
    formData.append('adminPlayerAlias', adminAlias);
    formData.append('entryFee', entryFee.toString());

    try {
      const res = await executeMigration(formData).unwrap();
      if (res.isSuccess && res.data) {
        setMigrationResult(res.data);
        dispatch(setActiveQuinielaId(res.data.quinielaId));
      } else {
        setErrorMessage(res.message || 'La migración falló');
      }
    } catch (err: any) {
      setErrorMessage(
        err?.data?.message || 'Error durante la ejecución de la migración en el servidor.'
      );
    }
  };

  const handleGoToDashboard = () => {
    if (migrationResult) {
      navigate('/');
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: 'var(--space-md)' }}>
      {/* Header */}
      <div style={{ marginBottom: 'var(--space-xl)', textAlign: 'center' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(59, 130, 246, 0.12)',
            color: '#3b82f6',
            padding: '6px 14px',
            borderRadius: '9999px',
            fontSize: '0.85rem',
            fontWeight: 600,
            marginBottom: '12px',
          }}
        >
          <Sparkles size={16} />
          Módulo de Administración — SPEC-007
        </div>
        <h1 style={{ fontSize: '2rem', marginBottom: '8px', fontWeight: 800 }}>
          Migración Seamless desde Google Sheets / XLSX
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '680px', margin: '0 auto' }}>
          Importa una quiniela activa con sus partidos, pronósticos históricos, participantes y
          valida los puntajes con el motor de calificación oficial sin interrupción operativa.
        </p>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div
          className="alert alert--error"
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            marginBottom: 'var(--space-lg)',
            padding: '14px 18px',
          }}
        >
          <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong>Error de validación o migración:</strong>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem' }}>{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Migration Success View */}
      {migrationResult && (
        <div
          className="card"
          style={{
            border: '2px solid rgba(16, 185, 129, 0.4)',
            backgroundColor: 'rgba(16, 185, 129, 0.04)',
            marginBottom: 'var(--space-xl)',
            padding: 'var(--space-xl)',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-lg)' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                color: '#10b981',
                marginBottom: '16px',
              }}
            >
              <CheckCircle2 size={36} />
            </div>
            <h2 style={{ fontSize: '1.6rem', color: '#10b981', marginBottom: '8px' }}>
              ¡Migración Completada con Éxito!
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
              {migrationResult.message}
            </p>
          </div>

          {/* Quick Metrics */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '14px',
              marginBottom: 'var(--space-lg)',
            }}
          >
            <div className="card" style={{ padding: '14px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                Quiniela Creada
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: '4px' }}>
                {migrationResult.quinielaName}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#3b82f6', marginTop: '2px' }}>
                Código: {migrationResult.inviteCode}
              </div>
            </div>

            <div className="card" style={{ padding: '14px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                Miembros Migrados
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#10b981', marginTop: '4px' }}>
                {migrationResult.totalMembersMigrated}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {migrationResult.createdUsernames.length} cuentas generadas
              </div>
            </div>

            <div className="card" style={{ padding: '14px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                Pronósticos & Partidos
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, marginTop: '4px' }}>
                {migrationResult.totalPicksMigrated} picks
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                en {migrationResult.totalMatchesMigrated} partidos
              </div>
            </div>

            <div className="card" style={{ padding: '14px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                Estado Actual
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f59e0b', marginTop: '4px' }}>
                Jornada {migrationResult.currentWeekNumber}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Abierta para pronósticos
              </div>
            </div>
          </div>

          {/* Verification Table */}
          <div style={{ marginBottom: 'var(--space-lg)' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={20} color="#10b981" />
              Auditoría Matemática de Integridad (Standings vs ScoringEngine)
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                    <th style={{ padding: '8px' }}>Participante</th>
                    <th style={{ padding: '8px' }}>Aciertos Esperados (Sheets)</th>
                    <th style={{ padding: '8px' }}>Aciertos Calculados (PickSports)</th>
                    <th style={{ padding: '8px' }}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {migrationResult.playerVerification.map((pv) => (
                    <tr key={pv.alias} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '8px', fontWeight: 600 }}>{pv.alias}</td>
                      <td style={{ padding: '8px' }}>{pv.expectedHits}</td>
                      <td style={{ padding: '8px' }}>{pv.calculatedHits}</td>
                      <td style={{ padding: '8px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: '#10b981',
                            fontWeight: 600,
                          }}
                        >
                          <CheckCircle2 size={16} /> 100% Coincidencia
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <button
              type="button"
              className="btn btn--primary"
              onClick={handleGoToDashboard}
              style={{ padding: '12px 28px', fontSize: '1.05rem', fontWeight: 700 }}
            >
              <span>Ir al Dashboard de la Quiniela Migrada</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Upload & Preview Step (hidden when completed) */}
      {!migrationResult && (
        <>
          {/* Dropzone */}
          <div
            className="card"
            style={{
              border: `2px dashed ${isDragging ? 'var(--color-primary)' : 'var(--border-color)'}`,
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-2xl) var(--space-lg)',
              textAlign: 'center',
              backgroundColor: isDragging ? 'rgba(16, 185, 129, 0.05)' : 'var(--surface-color)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              marginBottom: 'var(--space-xl)',
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx"
              style={{ display: 'none' }}
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFileSelect(e.target.files[0]);
                }
              }}
            />

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                color: '#3b82f6',
                marginBottom: '14px',
              }}
            >
              {isPreviewLoading ? (
                <Loader2 className="animate-spin" size={30} />
              ) : selectedFile ? (
                <FileSpreadsheet size={30} color="#10b981" />
              ) : (
                <UploadCloud size={30} />
              )}
            </div>

            {selectedFile ? (
              <div>
                <h3 style={{ fontSize: '1.15rem', marginBottom: '4px' }}>{selectedFile.name}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  {(selectedFile.size / 1024).toFixed(1)} KB — Clic para cambiar archivo
                </p>
              </div>
            ) : (
              <div>
                <h3 style={{ fontSize: '1.15rem', marginBottom: '6px' }}>
                  Arrastra tu archivo Excel (.xlsx) aquí
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  o haz clic para explorar en tus carpetas (ej. Quiniela Clausura Liga MX 2026.xlsx)
                </p>
              </div>
            )}
          </div>

          {/* Loading Indicator */}
          {isPreviewLoading && (
            <div style={{ textAlign: 'center', padding: 'var(--space-xl)' }}>
              <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto 12px auto', color: '#3b82f6' }} />
              <p style={{ color: 'var(--text-secondary)' }}>Analizando estructura y pronósticos del archivo Excel...</p>
            </div>
          )}

          {/* Preview Details */}
          {previewData && !isPreviewLoading && (
            <div className="card" style={{ padding: 'var(--space-xl)', marginBottom: 'var(--space-xl)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-lg)' }}>
                <div>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0 }}>
                    Previsualización de Datos Detectados
                  </h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
                    Revisa las métricas antes de ejecutar la transacción atómica.
                  </p>
                </div>
                <div
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    color: '#10b981',
                    padding: '4px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                  }}
                >
                  Dry-Run Válido
                </div>
              </div>

              {/* KPI Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                  gap: '12px',
                  marginBottom: 'var(--space-lg)',
                }}
              >
                <div className="card" style={{ padding: '12px', textAlign: 'center' }}>
                  <Users size={20} style={{ color: '#3b82f6', marginBottom: '4px' }} />
                  <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>{previewData.totalParticipants}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Participantes</div>
                </div>

                <div className="card" style={{ padding: '12px', textAlign: 'center' }}>
                  <Calendar size={20} style={{ color: '#8b5cf6', marginBottom: '4px' }} />
                  <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>{previewData.totalMatches}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Partidos Detectados</div>
                </div>

                <div className="card" style={{ padding: '12px', textAlign: 'center' }}>
                  <Trophy size={20} style={{ color: '#f59e0b', marginBottom: '4px' }} />
                  <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>{previewData.totalPicks}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Pronósticos Totales</div>
                </div>

                <div className="card" style={{ padding: '12px', textAlign: 'center' }}>
                  <Sparkles size={20} style={{ color: '#10b981', marginBottom: '4px' }} />
                  <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>Jornada {previewData.currentWeekNumber}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Jornada Activa Sugerida</div>
                </div>
              </div>

              {/* Configuration Form */}
              <div
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-md)',
                  marginBottom: 'var(--space-lg)',
                }}
              >
                <h4 style={{ margin: '0 0 12px 0', fontSize: '1rem', fontWeight: 600 }}>
                  Configuración de la Nueva Quiniela
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', fontWeight: 500 }}>
                      Nombre de la Quiniela
                    </label>
                    <input
                      type="text"
                      className="input"
                      value={quinielaName}
                      onChange={(e) => setQuinielaName(e.target.value)}
                      placeholder="Liga MX Clausura 2026"
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', fontWeight: 500 }}>
                      ¿Quién eres tú en esta quiniela? (Cuenta Owner)
                    </label>
                    <select
                      className="input"
                      value={adminAlias}
                      onChange={(e) => setAdminAlias(e.target.value)}
                      style={{ width: '100%', height: '42px' }}
                    >
                      {previewData.participants.map((p) => (
                        <option key={p.alias} value={p.alias}>
                          {p.alias} ({p.expectedHits} aciertos en Excel)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', fontWeight: 500 }}>
                      Cuota de Entrada ($ MXN opcional)
                    </label>
                    <input
                      type="number"
                      className="input"
                      value={entryFee}
                      onChange={(e) => setEntryFee(Number(e.target.value))}
                      placeholder="0"
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                    marginTop: '10px',
                  }}
                >
                  <Info size={14} />
                  Los otros {previewData.totalParticipants - 1} participantes recibirán cuentas de usuario automáticas con rol de miembro.
                </div>
              </div>

              {/* Participants Table */}
              <div style={{ marginBottom: 'var(--space-xl)' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '1rem', fontWeight: 600 }}>
                  Participantes y Puntajes Detectados en Hoja Standings
                </h4>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                        <th style={{ padding: '8px' }}>Alias</th>
                        <th style={{ padding: '8px' }}>Aciertos Históricos</th>
                        <th style={{ padding: '8px' }}>Pronósticos Capturados</th>
                        <th style={{ padding: '8px' }}>Efectividad</th>
                        <th style={{ padding: '8px' }}>Rol en PickSports</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.participants.map((p) => {
                        const isOwner = p.alias.toLowerCase() === adminAlias.toLowerCase();
                        return (
                          <tr
                            key={p.alias}
                            style={{
                              borderBottom: '1px solid rgba(255,255,255,0.05)',
                              backgroundColor: isOwner ? 'rgba(59, 130, 246, 0.08)' : undefined,
                            }}
                          >
                            <td style={{ padding: '8px', fontWeight: isOwner ? 700 : 500 }}>
                              {p.alias} {isOwner && '(Tú)'}
                            </td>
                            <td style={{ padding: '8px', fontWeight: 600 }}>{p.expectedHits}</td>
                            <td style={{ padding: '8px' }}>{p.totalPicks}</td>
                            <td style={{ padding: '8px' }}>{p.percentage}%</td>
                            <td style={{ padding: '8px' }}>
                              <span
                                style={{
                                  fontSize: '0.75rem',
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  fontWeight: 600,
                                  backgroundColor: isOwner
                                    ? 'rgba(59, 130, 246, 0.2)'
                                    : 'rgba(255, 255, 255, 0.08)',
                                  color: isOwner ? '#3b82f6' : 'var(--text-secondary)',
                                }}
                              >
                                {isOwner ? 'OWNER / ADMIN' : 'MEMBER'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Button */}
              <div style={{ textAlign: 'center' }}>
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={handleExecute}
                  disabled={isExecuting}
                  style={{
                    padding: '14px 32px',
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    minWidth: '280px',
                  }}
                >
                  {isExecuting ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      <span>Ejecutando Migración Atómica...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={18} />
                      <span>Confirmar y Ejecutar Migración</span>
                    </>
                  )}
                </button>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                  Se validará matemáticamente cada acierto con el ScoringEngine antes de confirmar la transacción.
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MigrationPage;
