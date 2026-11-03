import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useGetWrappedAvailabilityQuery } from '../../services/api';
import './WrappedBanner.css';

interface WrappedBannerProps {
  quinielaId: number;
}

export const WrappedBanner: React.FC<WrappedBannerProps> = ({ quinielaId }) => {
  const { data: response } = useGetWrappedAvailabilityQuery(quinielaId, {
    skip: !quinielaId,
  });

  const availability = response?.data;
  if (!availability?.isAvailable || !availability.seasonId) {
    return null;
  }

  return (
    <Link to={`/wrapped/${quinielaId}/${availability.seasonId}`} className="wrapped-banner">
      <span className="wrapped-banner__shine" aria-hidden="true" />
      <span className="wrapped-banner__text">✨ Tu PickSports Wrapped de la Temporada está listo</span>
      <ChevronRight size={20} className="wrapped-banner__chevron" />
    </Link>
  );
};
