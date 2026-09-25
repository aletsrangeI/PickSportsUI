import React, { useState } from 'react';
import './UserAvatar.css';

interface UserAvatarProps {
  src?: string | null;
  alt: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  fallbackText?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  src,
  alt,
  size = 'sm',
  className = '',
  fallbackText,
}) => {
  const [hasError, setHasError] = useState(false);

  // Derivar iniciales para el fallback
  const initials = fallbackText || (alt ? alt.trim().slice(0, 2).toUpperCase() : '?');

  // Si la ruta cambia, reintentar carga
  React.useEffect(() => {
    setHasError(false);
  }, [src]);

  const showImage = Boolean(src && !hasError);

  return (
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
};
