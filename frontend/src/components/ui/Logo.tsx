export default function Logo({ size = 28 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2 font-bold text-lg tracking-tight text-ink">
      <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
        <circle cx="14" cy="14" r="12" stroke="#2f6b4f" strokeWidth="2" />
        <path
          d="M8 14.5L12 18.5L20 9.5"
          stroke="#2f6b4f"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span>Seovate</span>
    </div>
  );
}
