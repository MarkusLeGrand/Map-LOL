import { useState } from 'react';

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  fallbackType?: 'profile' | 'champion';
  style?: React.CSSProperties;
  className?: string;
  title?: string;
}

export function ImageWithFallback({
  src,
  alt,
  fallbackType = 'champion',
  style,
  className,
  title
}: ImageWithFallbackProps) {
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    setHasError(true);
  };

  // Si l'image a une erreur, afficher un placeholder SVG
  if (hasError) {
    return (
      <div
        style={{
          ...style,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#2A2A2A',
        }}
        className={className}
        title={title}
      >
        {fallbackType === 'profile' ? (
          // Icône de profil par défaut
          <svg
            width="60%"
            height="60%"
            viewBox="0 0 24 24"
            fill="none"
            stroke="rgba(245, 245, 245, 0.4)"
            strokeWidth="2"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        ) : (
          // Icône de champion/question mark par défaut
          <svg
            width="60%"
            height="60%"
            viewBox="0 0 24 24"
            fill="none"
            stroke="rgba(245, 245, 245, 0.4)"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <circle cx="12" cy="17" r="0.5" fill="rgba(245, 245, 245, 0.4)" />
          </svg>
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      style={style}
      className={className}
      title={title}
      onError={handleError}
    />
  );
}
