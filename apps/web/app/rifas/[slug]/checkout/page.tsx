"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { GoldButton } from "@/components/gold-button";
import { SiteHeader } from "@/components/site-header";

type Payload = {
  raffleSlug: string;
  numberIds: string[];
  quantity?: number;
  useRandom: boolean;
};

const ERR_MSG: Record<string, string> = {
  EMAIL_OBRIGATORIO: "Informe o e-mail.",
  EMAIL_INVALIDO: "E-mail inválido.",
  CPF_OBRIGATORIO: "Informe um CPF válido (11 dígitos).",
};

export default function CheckoutPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const slug = params.slug;

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [aceite, setAceite] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [payload, setPayload] = useState<Payload | null>(null);
  const [pedirEmail, setPedirEmail] = useState(false);
  const [pedirCpf, setPedirCpf] = useState(false);

  const [pix, setPix] = useState<{
    id: string;
    qrCodeBase64?: string;
    pixCopiaECola?: string;
    expiresAt: string;
    codigo: string;
  } | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("checkout_payload");
    if (!raw) return;
    try {
      const p = JSON.parse(raw) as Payload;
      if (p.raffleSlug !== slug) return;
      setPayload(p);
    } catch {
      setErr("Sessão inválida. Volte e selecione os números.");
    }
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    void fetch(`/api/public/raffles/${slug}`)
      .then((r) => r.json())
      .then((d: { raffle?: { checkoutPedirEmail?: boolean; checkoutPedirCpf?: boolean } }) => {
        if (d.raffle) {
          setPedirEmail(Boolean(d.raffle.checkoutPedirEmail));
          setPedirCpf(Boolean(d.raffle.checkoutPedirCpf));
        }
      })
      .catch(() => {
        setPedirEmail(false);
        setPedirCpf(false);
      });
  }, [slug]);

  async function submit() {
    setErr(null);
    if (!payload) {
      setErr("Nenhuma seleção. Volte à página da rifa.");
      return;
    }
    if (!aceite) {
      setErr("Aceite os termos para continuar.");
      return;
    }
    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        raffleSlug: payload.raffleSlug,
        nome,
        telefone,
        aceitouTermos: true,
      };
      if (pedirEmail) body.email = email.trim();
      if (pedirCpf) body.cpf = cpf.trim() || undefined;
      if (payload.useRandom) {
        body.quantity = payload.quantity;
      } else {
        body.numberIds = payload.numberIds;
      }
      const res = await fetch("/api/public/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        const code = typeof data.error === "string" ? data.error : "";
        setErr(ERR_MSG[code] ?? data.error ?? "Erro ao criar reserva");
        setLoading(false);
        return;
      }
      setPix({
        id: data.pix.id,
        qrCodeBase64: data.pix.qrCodeBase64,
        pixCopiaECola: data.pix.pixCopiaECola,
        expiresAt: data.pix.expiresAt,
        codigo: data.codigo,
      });
    } catch {
      setErr("Falha de rede. Tente novamente.");
    }
    setLoading(false);
  }

  async function copyPix() {
    if (!pix?.pixCopiaECola) return;
    await navigator.clipboard.writeText(pix.pixCopiaECola);
  }

  async function poll() {
    if (!pix?.id) return;
    await fetch(`/api/public/payments/${pix.id}/poll`, { method: "POST" });
    const r = await fetch(`/api/public/reservations/by-code/${pix.codigo}`);
    const d = await r.json();
    if (d.status === "PAID") {
      router.push(`/rifas/${slug}/sucesso?codigo=${encodeURIComponent(pix.codigo)}`);
    }
  }

  async function mockPay() {
    if (!pix?.id) return;
    await fetch(`/api/public/payments/${pix.id}/mock-approve`, { method: "POST" });
    await poll();
  }

  if (pix) {
    return (
      <>
        <SiteHeader />
        <main className="min-h-screen px-4 py-12">
          <div className="mx-auto max-w-lg space-y-6 text-center">
            <h1 className="font-display text-3xl text-[#F2C94C]">Pague com Pix</h1>
            <p className="text-sm text-[#BDBDBD]">Código da reserva: {pix.codigo}</p>
            {pix.qrCodeBase64 ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`data:image/png;base64,${pix.qrCodeBase64}`}
                alt="QR Pix"
                className="mx-auto rounded-2xl border border-[#D4AF37]/30 p-4"
              />
            ) : null}
            <textarea
              readOnly
              className="w-full rounded-xl border border-white/10 bg-[#101010] p-3 text-left text-xs text-[#BDBDBD]"
              rows={4}
              value={pix.pixCopiaECola ?? ""}
            />
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <GoldButton onClick={copyPix}>Copiar Pix</GoldButton>
              <GoldButton onClick={poll}>Já paguei — verificar</GoldButton>
            </div>
            {process.env.NODE_ENV === "development" && (
              <button type="button" onClick={mockPay} className="text-xs text-[#888] underline">
                [dev] Simular pagamento aprovado (mock Pix)
              </button>
            )}
            <Link href="/" className="block text-sm text-[#D4AF37]">
              Voltar ao início
            </Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen px-4 py-12">
        <div className="mx-auto max-w-md space-y-6 rounded-3xl border border-[#D4AF37]/25 bg-[#101010] p-8">
          <h1 className="font-display text-2xl text-[#F5F5F5]">Seus dados</h1>
          {!payload && <p className="text-sm text-[#EF4444]">Carregando seleção…</p>}
          <p className="text-xs text-[#666]">
            {pedirEmail || pedirCpf
              ? "Esta campanha pede dados extra além de nome e WhatsApp."
              : "Apenas nome e WhatsApp. O e-mail para o Pix é gerado automaticamente."}
          </p>
          <label className="block text-left text-sm text-[#BDBDBD]">
            Nome
            <input
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#161616] px-4 py-3 text-[#F5F5F5]"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              autoComplete="name"
            />
          </label>
          <label className="block text-left text-sm text-[#BDBDBD]">
            WhatsApp
            <input
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#161616] px-4 py-3 text-[#F5F5F5]"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              required
              autoComplete="tel"
              inputMode="tel"
            />
          </label>
          {pedirEmail && (
            <label className="block text-left text-sm text-[#BDBDBD]">
              E-mail
              <input
                type="email"
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#161616] px-4 py-3 text-[#F5F5F5]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </label>
          )}
          {pedirCpf && (
            <label className="block text-left text-sm text-[#BDBDBD]">
              CPF
              <input
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#161616] px-4 py-3 text-[#F5F5F5]"
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
                required
                placeholder="000.000.000-00"
                autoComplete="off"
              />
            </label>
          )}
          <label className="flex items-start gap-2 text-left text-sm text-[#BDBDBD]">
            <input type="checkbox" checked={aceite} onChange={(e) => setAceite(e.target.checked)} className="mt-1" />
            Li e aceito os termos da campanha e da plataforma.
          </label>
          {err && <p className="text-sm text-[#EF4444]">{err}</p>}
          <GoldButton onClick={submit} disabled={loading || !payload}>
            {loading ? "Gerando Pix…" : "Gerar cobrança Pix"}
          </GoldButton>
          <Link href={`/rifas/${slug}`} className="block text-center text-sm text-[#D4AF37]">
            Voltar
          </Link>
        </div>
      </main>
    </>
  );
}
