import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import {
  useGetQuinielasQuery,
  useGetSeasonsQuery,
  useGetWeeksBySeasonQuery,
  useGetQuinielaByIdQuery,
  useLazyGetWhatsAppReminderQuery,
  useLazyGetWhatsAppSummaryQuery,
  useLazyGetWhatsAppPrizePoolQuery,
  useLazyGetWhatsAppPlayerReportQuery,
} from '../../services/api';
import {
  Share2,
  Copy,
  Check,
  BellRing,
  Newspaper,
  Coins,
  UserCheck,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import './WhatsAppPage.css';

type ReportType = 'reminder' | 'summary' | 'prizepool' | 'player';

export const WhatsAppPage: React.FC = () => {
  const [reportType, setReportType] = useState<ReportType>('summary');
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | null>(null);
  const [selectedWeekId, setSelectedWeekId] = useState<number | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [reportText, setReportText] = useState<string>('');
  const [reportTitle, setReportTitle] = useState<string>('');

  const activeQuinielaId = useSelector((state: RootState) => state.quiniela.activeQuinielaId);
  const currentUserId = useSelector((state: RootState) => state.auth.user?.id);

  const { data: quinielasResponse } = useGetQuinielasQuery();
  const quinielas = quinielasResponse?.data || [];
  const activeQuiniela = quinielas.find((q) => q.id === activeQuinielaId) || quinielas[0];
  const quinielaId = activeQuiniela?.id || 0;

  const { data: quinielaDetailResponse } = useGetQuinielaByIdQuery(quinielaId, {
    skip: !quinielaId,
  });
  const members = quinielaDetailResponse?.data?.members ?? [];

  // Temporadas y jornadas
  const { data: seasonsData } = useGetSeasonsQuery(activeQuiniela?.leagueId, {
    skip: !activeQuiniela?.leagueId,
  });
  const seasons = seasonsData?.data ?? [];

  useEffect(() => {
    if (seasons.length > 0 && selectedSeasonId === null) {
      const current =
        seasons.find((s) => s.isCurrent && !s.isFinished) ??
        seasons.find((s) => s.isCurrent) ??
        seasons[0];
      setSelectedSeasonId(current.id);
    }
  }, [seasons, selectedSeasonId]);

  const { data: weeksData } = useGetWeeksBySeasonQuery(selectedSeasonId!, {
    skip: !selectedSeasonId,
  });
  const weeks = weeksData?.data ?? [];

  useEffect(() => {
    if (weeks.length > 0 && (selectedWeekId === null || !weeks.some(w => w.id === selectedWeekId))) {
      const activeWeek =
        weeks.find((w) => w.status === 'PUBLISHED') ??
        weeks.find((w) => w.status === 'LOCKED') ??
        weeks.find((w) => w.status === 'SCORED') ??
        weeks[0];
      setSelectedWeekId(activeWeek.id);
    }
  }, [weeks, selectedWeekId]);

  useEffect(() => {
    if (members.length > 0 && selectedMemberId === null) {
      const currentMember = members.find((m) => m.userId === currentUserId) || members[0];
      setSelectedMemberId(currentMember.id);
    }
  }, [members, currentUserId, selectedMemberId]);

  // Triggers para generación de reportes
  const [fetchReminder, { isFetching: fetchingReminder }] = useLazyGetWhatsAppReminderQuery();
  const [fetchSummary, { isFetching: fetchingSummary }] = useLazyGetWhatsAppSummaryQuery();
  const [fetchPrizePool, { isFetching: fetchingPrizePool }] = useLazyGetWhatsAppPrizePoolQuery();
  const [fetchPlayer, { isFetching: fetchingPlayer }] = useLazyGetWhatsAppPlayerReportQuery();

  const isFetching = fetchingReminder || fetchingSummary || fetchingPrizePool || fetchingPlayer;

  // Cargar reporte según el tipo seleccionado
  useEffect(() => {
    if (!quinielaId) return;

    let isMounted = true;

    const loadReport = async () => {
      try {
        if (reportType === 'reminder' && selectedWeekId) {
          const res = await fetchReminder({ quinielaId, weekId: selectedWeekId }).unwrap();
          if (isMounted && res.data) {
            setReportText(res.data.content);
            setReportTitle(res.data.title);
          }
        } else if (reportType === 'summary' && selectedWeekId) {
          const res = await fetchSummary({ quinielaId, weekId: selectedWeekId }).unwrap();
          if (isMounted && res.data) {
            setReportText(res.data.content);
            setReportTitle(res.data.title);
          }
        } else if (reportType === 'prizepool') {
          const res = await fetchPrizePool(quinielaId).unwrap();
          if (isMounted && res.data) {
            setReportText(res.data.content);
            setReportTitle(res.data.title);
          }
        } else if (reportType === 'player' && selectedWeekId && selectedMemberId) {
          const res = await fetchPlayer({
            quinielaId,
            weekId: selectedWeekId,
            memberId: selectedMemberId,
          }).unwrap();
          if (isMounted && res.data) {
            setReportText(res.data.content);
            setReportTitle(res.data.title);
          }
        }
      } catch (err) {
        console.error('Error cargando reporte WhatsApp:', err);
      }
    };

    loadReport();

    return () => {
      isMounted = false;
    };
  }, [reportType, quinielaId, selectedWeekId, selectedMemberId]);

  const handleCopy = async () => {
    if (!reportText) return;
    try {
      await navigator.clipboard.writeText(reportText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Error al copiar al portapapeles:', err);
    }
  };

  const handleOpenWhatsApp = () => {
    if (!reportText) return;
    const encoded = encodeURIComponent(reportText);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  if (!quinielaId) {
    return (
      <div className="whatsapp-page__no-quiniela">
        <AlertCircle size={40} />
        <h2>No tienes ninguna quiniela seleccionada</h2>
        <p>Crea o únete a una quiniela para generar reportes oficiales para WhatsApp.</p>
      </div>
    );
  }

  return (
    <div className="whatsapp-page">
      {/* Header */}
      <div className="whatsapp-page__header">
        <div>
          <h1 className="whatsapp-page__title">Centro de WhatsApp</h1>
          <p className="whatsapp-page__subtitle">
            Generador de comunicados oficiales formateados con emojis para compartir en tu grupo
          </p>
        </div>
      </div>

      {/* Selector de Tipo de Reporte */}
      <div className="whatsapp-page__type-grid">
        <button
          className={`whatsapp-page__type-btn ${reportType === 'summary' ? 'whatsapp-page__type-btn--active' : ''}`}
          onClick={() => setReportType('summary')}
        >
          <Newspaper size={20} />
          <div>
            <strong>Periódico del Lunes</strong>
            <span>Resultados, podio y tabla</span>
          </div>
        </button>

        <button
          className={`whatsapp-page__type-btn ${reportType === 'reminder' ? 'whatsapp-page__type-btn--active' : ''}`}
          onClick={() => setReportType('reminder')}
        >
          <BellRing size={20} />
          <div>
            <strong>Alerta de Cierre</strong>
            <span>Cuenta regresiva y faltantes</span>
          </div>
        </button>

        <button
          className={`whatsapp-page__type-btn ${reportType === 'prizepool' ? 'whatsapp-page__type-btn--active' : ''}`}
          onClick={() => setReportType('prizepool')}
        >
          <Coins size={20} />
          <div>
            <strong>Prize Pool</strong>
            <span>Bolsa 70% / 20% / 10%</span>
          </div>
        </button>

        <button
          className={`whatsapp-page__type-btn ${reportType === 'player' ? 'whatsapp-page__type-btn--active' : ''}`}
          onClick={() => setReportType('player')}
        >
          <UserCheck size={20} />
          <div>
            <strong>Reporte Individual</strong>
            <span>Desglose por participante</span>
          </div>
        </button>
      </div>

      {/* Parámetros de Reporte */}
      <div className="whatsapp-page__params">
        {reportType !== 'prizepool' && (
          <div className="whatsapp-page__param-group">
            <label className="whatsapp-page__label">Jornada</label>
            <select
              value={selectedWeekId || ''}
              onChange={(e) => setSelectedWeekId(Number(e.target.value))}
              className="whatsapp-page__select"
            >
              {weeks.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.status})
                </option>
              ))}
            </select>
          </div>
        )}

        {reportType === 'player' && (
          <div className="whatsapp-page__param-group">
            <label className="whatsapp-page__label">Participante</label>
            <select
              value={selectedMemberId || ''}
              onChange={(e) => setSelectedMemberId(Number(e.target.value))}
              className="whatsapp-page__select"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.alias} {m.displayName ? `(${m.displayName})` : ''}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Vista Previa y Botones de Copiado */}
      <div className="whatsapp-page__preview-card">
        <div className="whatsapp-page__preview-header">
          <div className="whatsapp-page__preview-title-col">
            <Share2 size={18} className="whatsapp-page__preview-icon" />
            <span className="whatsapp-page__preview-title">{reportTitle || 'Vista Previa'}</span>
          </div>

          <div className="whatsapp-page__actions">
            <button
              onClick={handleCopy}
              disabled={isFetching || !reportText}
              className={`whatsapp-page__copy-btn ${copied ? 'whatsapp-page__copy-btn--copied' : ''}`}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              <span>{copied ? '¡Copiado!' : 'Copiar Texto'}</span>
            </button>

            <button
              onClick={handleOpenWhatsApp}
              disabled={isFetching || !reportText}
              className="whatsapp-page__open-btn"
              title="Abrir directamente en WhatsApp"
            >
              <ExternalLink size={16} />
              <span>Abrir WhatsApp</span>
            </button>
          </div>
        </div>

        <div className="whatsapp-page__bubble-container">
          <div className="whatsapp-page__bubble">
            {isFetching ? (
              <p className="whatsapp-page__bubble-loading">Generando texto formateado...</p>
            ) : (
              <pre className="whatsapp-page__bubble-text">{reportText || 'Sin datos para generar reporte.'}</pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
