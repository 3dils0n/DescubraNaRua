"use client";

import { useEffect, useState } from "react";

type Dash = {
  totalRaffles: number;
  activeRaffles: number;
  paidNumbers: number;
  pendingReservations: number;
  paidToday: number;
  expiredPix: number;
  whatsappFailed: number;
  totalRevenue: number;
};

export default function AdminDashboardPage() {
  const [d, setD] = useState<Dash | null>(null);

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then((r) => r.json())
      .then(setD);
  }, []);

  if (!d) {
    return <p className="text-[#BDBDBD]">Carregando…</p>;
  }

  const cards = [
    { label: "Rifas (total)", val: d.totalRaffles },
    { label: "Rifas ativas", val: d.activeRaffles },
    { label: "Números pagos", val: d.paidNumbers },
    { label: "Reservas pendentes", val: d.pendingReservations },
    { label: "Pagos hoje", val: d.paidToday },
    { label: "Pix expirados", val: d.expiredPix },
    { label: "WhatsApp falha", val: d.whatsappFailed },
    {
      label: "Arrecadação (confirmada)",
      val: d.totalRevenue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
    },
  ];

  return (
    <div>
      <h1 className="font-display text-3xl text-[#F2C94C]">Dashboard</h1>
      <p className="mt-2 text-sm text-[#BDBDBD]">Visão geral da operação</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-2xl border border-white/10 bg-[#101010] p-6 shadow-[0_0_24px_rgba(212,175,55,0.08)]"
          >
            <p className="text-xs uppercase tracking-wider text-[#888]">{c.label}</p>
            <p className="mt-2 font-display text-2xl text-[#F5F5F5]">{c.val}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
