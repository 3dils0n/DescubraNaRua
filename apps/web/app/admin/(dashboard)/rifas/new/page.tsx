"use client";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { RaffleForm } from "@/components/admin/raffle-form";

export default function AdminNovaRifaPage() {
  return (
    <div>
      <AdminPageHeader
        title="Nova rifa"
        subtitle="Os números serão gerados automaticamente após salvar"
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Rifas", href: "/admin/rifas" },
          { label: "Nova" },
        ]}
      />
      <div className="rounded-2xl border border-[#D4AF37]/20 bg-[#101010] p-6 md:p-8">
        <RaffleForm mode="create" />
      </div>
    </div>
  );
}
