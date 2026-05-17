import { useState } from 'react';

/**
 * Tries to load logo as PNG first (for real production logos),
 * falls back to bundled SVG placeholder if PNG is missing.
 */
export default function Logo({ name, alt, className }) {
  const [src, setSrc] = useState(`/${name}.png`);
  const [hasError, setHasError] = useState(false);

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => {
        if (!hasError) {
          setHasError(true);
          setSrc(`/${name}.svg`);
        }
      }}
    />
  );
}
