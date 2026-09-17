import Link from "next/link";
import { ButtonHTMLAttributes } from "react";

type Variant = "solid" | "ghost" | "accent";

const VARIANT_CLASSES: Record<Variant, string> = {
  solid: "bg-ink text-paper border-ink hover:opacity-90",
  ghost: "bg-white text-ink border-ink hover:bg-neutral-soft",
  accent: "bg-accent text-paper border-accent hover:opacity-90",
};

const base =
  "inline-flex items-center justify-center gap-2 rounded font-bold text-sm px-4 py-2 border-2 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed";

export function Button({
  variant = "solid",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button className={`${base} ${VARIANT_CLASSES[variant]} ${className}`} {...props} />
  );
}

export function LinkButton({
  href,
  variant = "solid",
  className = "",
  children,
}: {
  href: string;
  variant?: Variant;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={`${base} ${VARIANT_CLASSES[variant]} ${className}`}>
      {children}
    </Link>
  );
}
