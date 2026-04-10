import Link from "next/link";

type Crumb = { label: string; href?: string };

export function AdminPageHeader({
  title,
  subtitle,
  breadcrumbs,
  actions,
}: {
  title: string;
  subtitle?: string;
  breadcrumbs?: Crumb[];
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 border-b border-white/10 pb-6 md:flex-row md:items-end md:justify-between">
      <div>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="mb-2 flex flex-wrap gap-2 text-xs text-[#666]">
            {breadcrumbs.map((c, i) => (
              <span key={`${c.label}-${i}`} className="flex items-center gap-2">
                {i > 0 && <span className="text-[#444]">/</span>}
                {c.href ? (
                  <Link href={c.href} className="hover:text-[#D4AF37]">
                    {c.label}
                  </Link>
                ) : (
                  <span className="text-[#888]">{c.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        <h1 className="font-display text-2xl text-[#F2C94C] md:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-[#BDBDBD]">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
