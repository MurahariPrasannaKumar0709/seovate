import { HTMLAttributes } from "react";

const BORDER_CLASSES = {
  ink: "border-2 border-ink",
  accent: "border-2 border-accent",
  dashed: "border-2 border-dashed border-muted",
};

export function SketchBox({
  className = "",
  border = "ink",
  bg = "bg-white",
  ...props
}: HTMLAttributes<HTMLDivElement> & { border?: keyof typeof BORDER_CLASSES; bg?: string }) {
  return <div className={`rounded ${bg} ${BORDER_CLASSES[border]} ${className}`} {...props} />;
}

export function InfoCallout({
  children,
  tone = "accent",
}: {
  children: React.ReactNode;
  tone?: "accent" | "gold";
}) {
  const bg = tone === "accent" ? "bg-accent-soft" : "bg-gold-soft";
  const text = tone === "accent" ? "text-accent" : "text-gold";
  return (
    <div className={`flex items-start gap-3 rounded p-4 text-sm ${bg}`}>
      <span className={`mt-0.5 shrink-0 ${text}`}>
        <svg width={18} height={18} viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="8.5" stroke="currentColor" strokeWidth="1.8" />
          <line x1="10" y1="9" x2="10" y2="14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="10" cy="6.3" r="1" fill="currentColor" />
        </svg>
      </span>
      <p className="text-ink/80 leading-relaxed">{children}</p>
    </div>
  );
}

export function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <SketchBox className="flex flex-col items-center justify-center gap-1 p-6 text-center">
      <span className="font-hand text-4xl text-accent">{value}</span>
      <span className="text-sm text-muted">{label}</span>
    </SketchBox>
  );
}
