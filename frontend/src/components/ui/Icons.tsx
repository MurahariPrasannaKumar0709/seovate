export function IconCheck({ size = 18, color = "#2f6b4f" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="8.5" stroke={color} strokeWidth="1.8" />
      <path d="M6 10.2L8.7 13L14 7.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconX({ size = 18, color = "#a1401b" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="8.5" stroke={color} strokeWidth="1.8" />
      <path d="M7 7l6 6M13 7l-6 6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function IconInfo({ size = 18, color = "#2f6b4f" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="8.5" stroke={color} strokeWidth="1.8" />
      <line x1="10" y1="9" x2="10" y2="14" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="10" cy="6.3" r="1" fill={color} />
    </svg>
  );
}

export function IconWarn({ size = 18, color = "#9a6b1c" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="8.5" stroke={color} strokeWidth="1.8" />
      <line x1="10" y1="6" x2="10" y2="11" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="10" cy="13.7" r="1" fill={color} />
    </svg>
  );
}

export function IconSpinner({ size = 18, color = "#6b6a63" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="8.5" stroke="#e4e2d8" strokeWidth="1.8" />
      <path d="M10 1.5a8.5 8.5 0 018.5 8.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
