import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useGetSeasonWrappedQuery } from '../../services/api';
import { WrappedViewer } from './WrappedViewer';
import './WrappedViewer.css';
import './WrappedShareCard.css';

export const WrappedPage: React.FC = () => {
  const navigate = useNavigate();
  const { seasonId, quinielaId: quinielaIdParam } = useParams<{ seasonId: string; quinielaId: string }>();
  const parsedSeasonId = Number(seasonId);
  const parsedQuinielaId = Number(quinielaIdParam);
  const quinielaId = Number.isFinite(parsedQuinielaId) && parsedQuinielaId > 0 ? parsedQuinielaId : 0;

  const { data, isLoading, isError } = useGetSeasonWrappedQuery(
    { quinielaId, seasonId: parsedSeasonId },
    { skip: !quinielaId || !Number.isFinite(parsedSeasonId) || parsedSeasonId <= 0 },
  );

  const close = () => navigate('/', { replace: true });
  const wrapped = data?.isSuccess ? data.data : undefined;

  if (isLoading) {
    return (
      <div className="wrapped-page-state" role="status">
        <Loader2 size={36} className="wrapped-page-state__spinner" />
        <p className="wrapped-page-state__text">Preparando tu Wrapped...</p>
      </div>
    );
  }

  if (!wrapped || wrapped.slides.length === 0) {
    const message =
      data && !data.isSuccess && data.message
        ? data.message
        : isError
          ? 'No pudimos cargar tu Wrapped. Intenta de nuevo mas tarde.'
          : 'Tu Wrapped aun no esta disponible.';
    return (
      <div className="wrapped-page-state">
        <p className="wrapped-page-state__text">{message}</p>
        <button type="button" className="wrapped-page-state__btn" onClick={close}>
          Volver
        </button>
      </div>
    );
  }

  return <WrappedViewer wrapped={wrapped} onClose={close} />;
};
