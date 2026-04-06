import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  href?: string;
  children: ReactNode;
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
};

export function GoldButton({ href, className = "", children, type = "button", disabled, onClick }: Props) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-8 py-4 font-semibold tracking-wide transition-all duration-300 " +
    "bg-gradient-to-r from-[#8C6A1D] via-[#D4AF37] to-[#F2C94C] text-[#0A0A0A] shadow-[0_0_32px_rgba(212,175,55,0.35)] " +
    "hover:shadow-[0_0_48px_rgba(242,201,76,0.45)] hover:scale-[1.02] active:scale-[0.99] disabled:opacity-50 disabled:hover:scale-100";

  if (href) {
    return (
      <Link href={href} className={`${base} ${className}`}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} className={`${base} ${className}`} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
}
