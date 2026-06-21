import { useId } from 'react';

interface LogoProps {
  size?: number;
}

/** Orbis mark — planet with orbital ring. Uses currentColor. */
export default function Logo({ size = 24 }: Readonly<LogoProps>) {
  const gradId = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={gradId} x1="4" y1="4" x2="20" y2="20" gradientUnits="userSpaceOnUse">
          <stop stopColor="currentColor" stopOpacity="0.95" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0.7" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="5.2" fill="currentColor" opacity="0.2" />
      <circle cx="12" cy="12" r="5.2" stroke={`url(#${gradId})`} strokeWidth="1.4" />
      <ellipse
        cx="12"
        cy="12"
        rx="10.5"
        ry="4.2"
        stroke="currentColor"
        strokeWidth="1.3"
        opacity="0.55"
        transform="rotate(-28 12 12)"
      />
      <circle cx="3.4" cy="8.8" r="1.5" fill="currentColor" opacity="0.9" />
    </svg>
  );
}
