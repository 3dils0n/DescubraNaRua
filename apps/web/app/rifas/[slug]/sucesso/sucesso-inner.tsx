"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { GoldButton } from "@/components/gold-button";
import { SiteHeader } from "@/components/site-header";

export function SucessoInner() {
  const sp = useSearchParams();
  const codigo = sp.get("codigo") ?? "";
  const [data, setData] = useState<unknown>(null);

  useEffect(() => {
    if (!codigo) return;
    fetch(`/api/public/reservations/by-code/${codigo}`)
      .then((r) => r.json())
      .then(setData);
  }, [codigo]);

  const d = data as {
    codigo?: string;
    raffle?: { titulo: string };
    numbers?: string[];
    valorTotal?: number;
    participant?: { nome: string; telefone: string; email?: string };
  } | null;

  return (
    <>
      <SiteHeader />
      <main className="flex min-h-screen flex-col items-center justify-center px-4 pb-16 pt-8 text-center">
        <div className="max-w-lg rounded-3xl border border-[#22C55E]/40 bg-[#101010] p-10">
          <p className="text-sm font-semibold uppercase tracking-widest text-[#22C55E]">Pagamento confirmado</p>
          <h1 className="mt-4 font-display text-3xl text-[#F5F5F5]">Você está dentro!</h1>
          {d?.participant && (
            <div className="mt-4 space-y-1 text-sm text-[#BDBDBD]">
              <p>
                Nome: <strong className="text-[#F5F5F5]">{d.participant.nome}</strong>
              </p>
              <p>
                WhatsApp: <strong className="text-[#F5F5F5]">{d.participant.telefone}</strong>
              </p>
              {d.participant.email && (
                <p>
                  E-mail: <span className="text-[#E0E0E0]">{d.participant.email}</span>
                </p>
              )}
            </div>
          )}
          {d?.raffle && (
            <p className="mt-4 text-[#BDBDBD]">
              Rifa: <strong className="text-[#F2C94C]">{d.raffle.titulo}</strong>
            </p>
          )}
          {d?.numbers && (
            <p className="mt-4 text-sm text-[#BDBDBD]">
              Seus números: <span className="font-mono text-[#F5F5F5]">{d.numbers.join(", ")}</span>
            </p>
          )}
          {d?.valorTotal != null && (
            <p className="mt-2 text-[#BDBDBD]">
              Valor: {d.valorTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </p>
          )}
          <div className="mt-8 flex flex-col gap-3">
            <GoldButton href={`/consulta?codigo=${encodeURIComponent(codigo)}`}>Ver minha reserva</GoldButton>
            <Link href="/" className="text-sm text-[#D4AF37]">
              Ir para a home
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
