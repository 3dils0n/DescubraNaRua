"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { GoldButton } from "@/components/gold-button";
import { SiteHeader } from "@/components/site-header";

export function ConsultaInner() {
  const sp = useSearchParams();
  const [codigo, setCodigo] = useState(sp.get("codigo") ?? "");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<unknown>(null);
  const [err, setErr] = useState<string | null>(null);

  async function buscar() {
    setErr(null);
    const res = await fetch("/api/public/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        codigo: codigo || undefined,
        telefone: telefone || undefined,
        email: email || undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErr("Não encontrado");
      return;
    }
    setResult(data.reservations);
  }

  const rows = result as { codigo: string; status: string; raffle: { titulo: string; slug: string } }[];

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen px-4 pb-16 pt-8">
        <div className="mx-auto max-w-lg space-y-6">
          <h1 className="font-display text-3xl text-[#F2C94C]">Consultar reserva</h1>
          <p className="text-sm text-[#BDBDBD]">Informe o código, telefone ou email usados na compra.</p>
          <input
            placeholder="Código"
            className="w-full rounded-xl border border-white/10 bg-[#101010] px-4 py-3 text-[#F5F5F5]"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
          />
          <input
            placeholder="Telefone"
            className="w-full rounded-xl border border-white/10 bg-[#101010] px-4 py-3 text-[#F5F5F5]"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
          />
          <input
            type="email"
            placeholder="Email"
            className="w-full rounded-xl border border-white/10 bg-[#101010] px-4 py-3 text-[#F5F5F5]"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {err && <p className="text-[#EF4444]">{err}</p>}
          <GoldButton onClick={buscar}>Buscar</GoldButton>
          {rows?.length > 0 && (
            <ul className="space-y-3">
              {rows.map((r) => (
                <li key={r.codigo} className="rounded-xl border border-white/10 bg-[#101010] p-4">
                  <p className="font-mono text-[#F2C94C]">{r.codigo}</p>
                  <p className="text-sm text-[#BDBDBD]">{r.raffle.titulo}</p>
                  <p className="text-xs text-[#888]">{r.status}</p>
                  <a href={`/rifas/${r.raffle.slug}`} className="text-xs text-[#D4AF37]">
                    Ver rifa
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </>
  );
}
