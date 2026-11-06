import React, { useState } from 'react';
import { Flame, Snowflake } from 'lucide-react';
import './UserAvatar.css';

interface UserAvatarProps {
  src?: string | null;
  alt: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  fallbackText?: string;
  /** SPEC-013: racha vigente. FIRE = On-Fire, ICE = En la Nevera. */
  heat?: 'FIRE' | 'ICE' | null;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  src,
  alt,
  size = 'sm',
  className = '',
  fallbackText,
  heat = null,
}) => {
  const [hasError, setHasError] = useState(false);

  // Derivar iniciales para el fallback
  const initials = fallbackText || (alt ? alt.trim().slice(0, 2).toUpperCase() : '?');

  // Si la ruta cambia, reintentar carga
  React.useEffect(() => {
    setHasError(false);
  }, [src]);

  const showImage = Boolean(src && !hasError);

  const avatar = (
    <div className={`user-avatar user-avatar--${size} ${className}`} title={alt}>
      {showImage ? (
        <img
          src={src!}
          alt={alt}
          className="user-avatar__img"
          loading="lazy"
          onError={() => setHasError(true)}
        />
      ) : (
        <span className="user-avatar__fallback">
          {initials}
        </span>
      )}
    </div>
  );

  if (!heat) return avatar;

  const isFire = heat === 'FIRE';
  // El envoltorio es un <div> (inline-flex por CSS) porque contiene el <div> del avatar: un <span> con <div> dentro es HTML invalido.
  return (
    <div
      className={`user-avatar-heat user-avatar-heat--${isFire ? 'fire' : 'ice'} user-avatar-heat--${size}`}
      title={isFire ? `${alt}: On-Fire` : `${alt}: En la Nevera`}
    >
      {avatar}
      <span className="user-avatar-heat__badge" aria-hidden="true">
        {isFire ? <Flame size="100%" strokeWidth={2.4} /> : <Snowflake size="100%" strokeWidth={2.4} />}
      </span>
      <span className="visually-hidden-heat">{isFire ? 'En racha de aciertos' : 'En racha de fallos'}</span>
    </div>
  );
};
