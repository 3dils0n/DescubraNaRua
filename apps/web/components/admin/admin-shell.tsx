"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ADMIN_NAV } from "./admin-nav";

const linkBase =
  "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-white/5";
const linkActive = "bg-[#D4AF37]/15 text-[#F2C94C] border border-[#D4AF37]/30";
const linkIdle = "text-[#BDBDBD] border border-transparent";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-0 flex-1 flex-col md:flex-row">
      {/* Mobile toggle */}
      <div className="flex items-center justify-between border-b border-white/10 bg-[#0d0d0d] px-4 py-3 md:hidden">
        <span className="font-display text-sm tracking-widest text-[#D4AF37]">Menu</span>
        <button
          type="button"
          className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-[#F5F5F5]"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? "Fechar" : "Abrir"}
        </button>
      </div>

      <aside
        className={`${
          open ? "flex" : "hidden"
        } md:flex shrink-0 flex-col border-b border-white/10 bg-[#0d0d0d] md:w-60 md:border-b-0 md:border-r`}
      >
        <div className="border-b border-white/10 p-4">
          <Link href="/admin" className="font-display text-lg tracking-wide text-[#F2C94C]">
            Descubra <span className="text-[#888]">·</span> Admin
          </Link>
          <p className="mt-1 text-[10px] uppercase tracking-[0.25em] text-[#666]">Painel operacional</p>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 p-3">
          {ADMIN_NAV.map((item) => {
            const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${linkBase} ${active ? linkActive : linkIdle}`}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-3">
          <Link
            href="/"
            className="block rounded-lg px-3 py-2 text-xs text-[#888] hover:text-[#D4AF37]"
            target="_blank"
            rel="noreferrer"
          >
            Ver site público ↗
          </Link>
          <form action="/api/admin/auth/logout" method="POST" className="mt-2">
            <button type="submit" className="w-full rounded-lg px-3 py-2 text-left text-xs text-[#888] hover:bg-white/5 hover:text-[#D4AF37]">
              Sair
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 border-b border-[#D4AF37]/20 bg-[#0A0A0A]/95 backdrop-blur-sm">
          <div className="flex h-14 items-center justify-between px-4 md:px-8">
            <p className="truncate text-xs text-[#666]">
              {pathname.replace("/admin", "") || " / dashboard"}
            </p>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-4 md:p-8">{children}</div>
      </div>
    </div>
  );
}
