import Image from "next/image";
import Link from "next/link";
import { prisma } from "@repo/db";
import { RaffleStatus } from "@prisma/client";
import { GoldButton } from "@/components/gold-button";
import { ProgressGold } from "@/components/progress-gold";
import { SiteHeader } from "@/components/site-header";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const raffles = await prisma.raffle.findMany({
    where: { status: RaffleStatus.ACTIVE },
    orderBy: { createdAt: "desc" },
  });

  const cards = await Promise.all(
    raffles.map(async (r) => {
      const [paid, total] = await Promise.all([
        prisma.raffleNumber.count({ where: { raffleId: r.id, status: "PAID" } }),
        prisma.raffleNumber.count({ where: { raffleId: r.id } }),
      ]);
      const pct = total ? (paid / total) * 100 : 0;
      return { raffle: r, paid, total, pct };
    }),
  );

  const featured = cards.find((c) => c.raffle.slug === "descubra-na-rua") ?? cards[0];

  return (
    <main className="min-h-screen">
      <SiteHeader />

      <section className="relative overflow-hidden px-4 pb-20 pt-16 md:pt-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(212,175,55,0.15),transparent_50%)]" />
        <div className="relative mx-auto max-w-4xl text-center">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.35em] text-[#D4AF37]">
            Pix · confirmação automática · prova social ao vivo
          </p>
          <h1 className="font-display text-4xl leading-tight text-[#F5F5F5] sm:text-5xl md:text-6xl">
            A rifa que parece{" "}
            <span className="bg-gradient-to-r from-[#D4AF37] to-[#F2C94C] bg-clip-text text-transparent">
              campanha viral
            </span>
            .
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-[#BDBDBD]">
            Escolha seus números ou deixe o acaso decidir. Pague com Pix. Receba confirmação na hora e mensagem no
            WhatsApp.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <GoldButton href={featured ? `/rifas/${featured.raffle.slug}` : "/#rifas"}>
              Quero participar agora
            </GoldButton>
            <Link
              href="/#rifas"
              className="rounded-xl border border-white/10 px-8 py-4 text-sm font-medium text-[#F5F5F5] hover:border-[#D4AF37]/50"
            >
              Ver todas as rifas
            </Link>
          </div>

          <div className="mx-auto mt-14 grid max-w-3xl grid-cols-3 gap-4 text-center">
            {[
              { label: "Pagamento", val: "Pix" },
              { label: "Confirmação", val: "Automática" },
              { label: "Transparência", val: "Total" },
            ].map((m) => (
              <div key={m.label} className="rounded-2xl border border-[#D4AF37]/20 bg-[#101010]/80 p-4">
                <div className="font-display text-2xl text-[#F2C94C]">{m.val}</div>
                <div className="text-xs uppercase tracking-wider text-[#BDBDBD]">{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="rifas" className="border-t border-white/5 bg-[#0A0A0A] px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 flex flex-col gap-2 text-center md:text-left">
            <h2 className="font-display text-3xl text-[#F5F5F5] md:text-4xl">Rifas em destaque</h2>
            <p className="text-[#BDBDBD]">Escassez real. Números limitados. Energia de lançamento.</p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {cards.map(({ raffle: r, paid, total, pct }) => {
              const isFeatured = r.slug === "descubra-na-rua";
              return (
                <article
                  key={r.id}
                  className={`group relative overflow-hidden rounded-3xl border bg-[#101010] p-1 transition hover:shadow-[0_0_40px_rgba(212,175,55,0.15)] ${
                    isFeatured ? "border-[#D4AF37]/60 ring-1 ring-[#D4AF37]/30" : "border-white/10"
                  }`}
                >
                  {isFeatured && (
                    <div className="absolute right-4 top-4 rounded-full bg-[#D4AF37] px-3 py-1 text-xs font-bold text-[#0A0A0A]">
                      DESTAQUE
                    </div>
                  )}
                  <div className="overflow-hidden rounded-[1.35rem] bg-[#161616]">
                    <div className="relative aspect-[16/9] w-full bg-gradient-to-br from-[#2a2410] to-[#0a0a0a]">
                      {r.imagem ? (
                        <Image
                          src={r.imagem}
                          alt={r.titulo}
                          fill
                          className="object-cover transition duration-500 group-hover:scale-105"
                          sizes="(max-width:768px) 100vw, 50vw"
                        />
                      ) : null}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    </div>
                    <div className="p-6">
                      <h3 className="font-display text-2xl text-[#F5F5F5]">{r.titulo}</h3>
                      <p className="mt-2 line-clamp-2 text-sm text-[#BDBDBD]">{r.descricao}</p>
                      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
                        <div>
                          <p className="text-xs uppercase text-[#888]">Por número</p>
                          <p className="font-display text-3xl text-[#F2C94C]">
                            {Number(r.valorNumero).toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })}
                          </p>
                        </div>
                        <div className="text-right text-sm text-[#BDBDBD]">
                          <p>
                            Sorteio:{" "}
                            {new Date(r.dataSorteio).toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                          <p className="mt-1">
                            {paid} / {total} vendidos
                          </p>
                        </div>
                      </div>
                      <div className="mt-4">
                        <ProgressGold value={pct} />
                      </div>
                      <div className="mt-6">
                        <GoldButton href={`/rifas/${r.slug}`} className="w-full">
                          Ver detalhes
                        </GoldButton>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {cards.length === 0 && (
            <p className="text-center text-[#BDBDBD]">Nenhuma rifa ativa no momento. Volte em breve.</p>
          )}
        </div>
      </section>

      <footer className="border-t border-white/5 px-4 py-10 text-center text-sm text-[#666]">
        Pagamento via Pix · Confirmação automática · Resultado transparente
      </footer>
    </main>
  );
}
