import Link from "next/link";
import { SiteLogo } from "@/components/site-logo";

const navLink = "text-sm text-[#BDBDBD] transition-colors hover:text-[#F2C94C]";
const adminBtn =
  "rounded-lg border border-[#D4AF37]/40 px-3 py-1.5 text-sm text-[#D4AF37] transition-colors hover:bg-[#D4AF37]/10";

/** Cabeçalho público único: logo + navegação (Rifas, Minha reserva, Admin). */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0A0A0A]/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <SiteLogo href="/" />
        <nav className="flex shrink-0 items-center gap-4 sm:gap-6" aria-label="Principal">
          <Link href="/#rifas" className={navLink}>
            Rifas
          </Link>
          <Link href="/consulta" className={navLink}>
            Minha reserva
          </Link>
          <Link href="/admin" className={adminBtn}>
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}
