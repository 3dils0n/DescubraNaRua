/** Layout raiz do admin: sem cabeçalho do site público — apenas envoltório. */
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-screen flex-col bg-[#0A0A0A] text-[#F5F5F5]">{children}</div>;
}
