type TagVariant = "success" | "pending" | "neutral" | "warn";

const VARIANT_CLASSES: Record<TagVariant, string> = {
  success: "border-accent text-accent bg-accent-soft",
  pending: "border-gold text-gold bg-gold-soft",
  neutral: "border-muted text-muted bg-neutral-soft",
  warn: "border-warn text-warn bg-warn-soft",
};

export default function Tag({
  children,
  variant = "neutral",
}: {
  children: React.ReactNode;
  variant?: TagVariant;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border-[1.5px] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${VARIANT_CLASSES[variant]}`}
    >
      {children}
    </span>
  );
}
