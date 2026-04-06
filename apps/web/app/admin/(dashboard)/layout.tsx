import Link from "next/link";
import { SiteLogo } from "@/components/site-logo";

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F5F5F5]">
      <aside className="fixed left-0 top-0 z-30 hidden h-full w-56 border-r border-white/10 bg-[#101010] p-4 md:block">
        <SiteLogo href="/" heightClass="h-8" />
        <p className="mt-4 font-display text-xs tracking-widest text-[#D4AF37]">ADMIN</p>
        <nav className="mt-8 flex flex-col gap-2 text-sm">
          <Link href="/admin" className="rounded-lg px-3 py-2 hover:bg-white/5">
            Dashboard
          </Link>
          <Link href="/" className="rounded-lg px-3 py-2 hover:bg-white/5">
            Site público
          </Link>
        </nav>
        <form action="/api/admin/auth/logout" method="POST" className="mt-8">
          <button type="submit" className="text-xs text-[#888] hover:text-[#D4AF37]">
            Sair
          </button>
        </form>
      </aside>
      <div className="md:pl-56">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-white/10 bg-[#0A0A0A]/90 px-4 py-3 backdrop-blur md:hidden">
          <SiteLogo href="/" heightClass="h-7" />
          <Link href="/admin" className="font-display text-sm text-[#D4AF37]">
            Admin
          </Link>
        </header>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
