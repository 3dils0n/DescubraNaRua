"use client";

import { useEffect, useRef } from "react";
import { adminBtnSecondary } from "@/components/admin/admin-styles";

export type PixProviderMode = "inherit" | "mock" | "mercadopago";

const infoBox =
  "rounded-xl border border-sky-500/25 bg-sky-500/10 px-3 py-2.5 text-sm text-sky-100/95";
const warnBox =
  "rounded-xl border border-amber-500/35 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-100/95";
const okBox =
  "rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2.5 text-sm text-emerald-100/95";

function StepList({ steps }: { steps: string[] }) {
  return (
    <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm text-[#CFCFCF]">
      {steps.map((s, i) => (
        <li key={i}>{s}</li>
      ))}
    </ol>
  );
}

/** Painel explicativo que muda conforme o modo PIX selecionado (linguagem simples). */
export function PixModeExplanation({ mode }: { mode: PixProviderMode }) {
  if (mode === "inherit") {
    return (
      <div className="mt-3 space-y-3" role="region" aria-label="Explicação do modo de configuração automática">
        <div className={infoBox}>
          <p className="font-medium text-sky-50">ℹ️ Configuração automática do sistema</p>
          <p className="mt-1.5 text-sky-100/90">
            Esta opção usa as definições já instaladas no servidor pela equipa que montou o site. Em muitos casos
            está tudo pronto e não precisa de mexer aqui.
          </p>
        </div>
        <div className={warnBox}>
          <p className="font-medium text-amber-50">⚠️ Quando faz sentido escolher isto</p>
          <p className="mt-1.5">
            Só deve escolher esta opção se alguém da equipa técnica (ou da hospedagem) já tiver configurado o PIX por
            si. Se não tiver a certeza, fale com essa pessoa antes de alterar outras opções.
          </p>
        </div>
        <div className={okBox}>
          <p className="font-medium text-emerald-50">✅ Depois de escolher</p>
          <p className="mt-1.5">
            O site continua a seguir a configuração do servidor. Os campos abaixo (token e webhook) só entram em
            jogo se quiser guardar credenciais neste painel em vez de no servidor.
          </p>
        </div>
        <StepList
          steps={[
            "Confirme com quem instalou o sistema que o PIX já está ativo no servidor.",
            "Se estiver tudo certo, pode deixar esta opção e testar uma reserva de exemplo.",
            "Se algo falhar, use o guia completo ou peça ajuda a quem gere a hospedagem.",
          ]}
        />
      </div>
    );
  }

  if (mode === "mock") {
    return (
      <div className="mt-3 space-y-3" role="region" aria-label="Explicação do modo de teste">
        <div className={infoBox}>
          <p className="font-medium text-sky-50">ℹ️ Modo de simulação (testes)</p>
          <p className="mt-1.5 text-sky-100/90">
            Isto é um modo de treino: o sistema finge que há um pagamento PIX. Não há cobrança real nem dinheiro a
            entrar na sua conta.
          </p>
        </div>
        <div className={okBox}>
          <p className="font-medium text-emerald-50">✅ Quando usar</p>
          <p className="mt-1.5">
            Ideal para testar rifas, números e o fluxo de compra antes de publicar para o público. Assim evita erros
            com dinheiro real.
          </p>
        </div>
        <div className={warnBox}>
          <p className="font-medium text-amber-50">⚠️ Atenção</p>
          <p className="mt-1.5">
            Não use este modo quando a rifa estiver aberta a compradores reais — eles precisam do Mercado Pago (PIX
            verdadeiro) para pagar.
          </p>
        </div>
        <StepList
          steps={[
            "Escolha este modo enquanto monta e testa a rifa.",
            "Faça uma reserva de teste e confira se os números e mensagens aparecem como esperado.",
            "Antes de divulgar a rifa, mude para Mercado Pago e configure as credenciais reais.",
          ]}
        />
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-3" role="region" aria-label="Explicação do Mercado Pago">
      <div className={infoBox}>
        <p className="font-medium text-sky-50">ℹ️ PIX real com Mercado Pago</p>
        <p className="mt-1.5 text-sky-100/90">
          Os participantes pagam de verdade por PIX. O dinheiro cai na conta Mercado Pago associada às credenciais
          que configurar. Precisa de uma conta em{" "}
          <a
            href="https://www.mercadopago.com.br"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-200 underline underline-offset-2 hover:text-white"
          >
            mercadopago.com.br
          </a>
          .
        </p>
      </div>
      <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-[#CFCFCF]">
        <p className="font-medium text-[#E8E8E8]">Onde obter as informações no Mercado Pago</p>
        <ul className="mt-2 list-none space-y-1.5">
          <li>
            <span className="text-emerald-300">✔</span> <strong className="text-[#E0E0E0]">Access Token</strong> — chave
            secreta de acesso (é esta que cola no campo &quot;Access Token&quot; abaixo).
          </li>
          <li>
            <span className="text-emerald-300">✔</span> <strong className="text-[#E0E0E0]">Chave pública (Public Key)</strong>{" "}
            — aparece no mesmo sítio das credenciais; neste sistema o PIX é criado pelo servidor, por isso{" "}
            <strong className="text-[#E0E0E0]">não precisa colar a chave pública neste painel</strong>. Basta saber
            onde fica, caso um técnico peça mais tarde.
          </li>
        </ul>
      </div>
      <div className={warnBox}>
        <p className="font-medium text-amber-50">⚠️ Segurança</p>
        <p className="mt-1.5">
          Trate o Access Token como uma senha: não partilhe por WhatsApp ou e-mail aberto. Quem tiver esta chave pode
          movimentar pagamentos na sua conta de integração.
        </p>
      </div>
      <div className={okBox}>
        <p className="font-medium text-emerald-50">✅ Depois de configurar</p>
        <p className="mt-1.5">
          As novas reservas passam a gerar cobranças PIX reais. Recomendamos um pagamento de teste com valor pequeno
          antes de divulgar a rifa.
        </p>
      </div>
      <p className="text-xs font-medium text-[#888]">Passo a passo rápido</p>
      <StepList
        steps={[
          "Crie ou aceda à sua conta em https://www.mercadopago.com.br",
          "Entre em Suas integrações (ou Credenciais / API, conforme o menu da sua conta).",
          "Copie o Access Token (produção quando for ao ar com público real).",
          "Cole no campo Access Token abaixo e guarde. Configure também o segredo do webhook conforme o guia completo.",
        ]}
      />
    </div>
  );
}

/** Modal com tutorial detalhado de configuração PIX. */
export function PixConfigGuideDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onDialogClose = () => {
      onClose();
    };
    el.addEventListener("close", onDialogClose);
    return () => el.removeEventListener("close", onDialogClose);
  }, [onClose]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open) {
      if (!el.open) el.showModal();
    } else if (el.open) {
      el.close();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="fixed left-1/2 top-1/2 z-[100] w-[min(100%-1.5rem,36rem)] max-h-[min(90vh,42rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[#D4AF37]/30 bg-[#121212] p-0 text-[#E8E8E8] shadow-[0_0_40px_rgba(0,0,0,0.6)] [&::backdrop]:bg-black/70"
    >
      <div className="flex max-h-[min(90vh,42rem)] flex-col">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-white/10 px-4 py-3">
          <h2 className="text-base font-semibold text-[#D4AF37]">📘 Guia completo — configuração PIX</h2>
          <button
            type="button"
            className={`${adminBtnSecondary} shrink-0`}
            onClick={() => ref.current?.close()}
            aria-label="Fechar guia"
          >
            Fechar
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 text-sm leading-relaxed">
          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-[#F0F0F0]">1. Configuração automática (servidor)</h3>
            <p className="text-[#B8B8B8]">
              Se a equipa que instalou o site já definiu o PIX no servidor, escolha a opção correspondente no menu e
              não precisa repetir os passos do Mercado Pago. Em caso de dúvida, confirme com quem gere a hospedagem.
            </p>
          </section>

          <section className="mt-5 space-y-2">
            <h3 className="text-sm font-semibold text-[#F0F0F0]">2. Modo de teste</h3>
            <p className="text-[#B8B8B8]">
              Serve para simular compras sem dinheiro real. Use ao preparar a rifa; antes de divulgar ao público, mude
              para Mercado Pago e teste um valor pequeno.
            </p>
          </section>

          <section className="mt-5 space-y-3">
            <h3 className="text-sm font-semibold text-[#F0F0F0]">3. Mercado Pago (PIX real)</h3>
            <ol className="list-decimal space-y-2 pl-5 text-[#B8B8B8]">
              <li>
                Crie ou entre na conta em{" "}
                <a
                  className="text-[#D4AF37] underline underline-offset-2 hover:text-[#F2C94C]"
                  href="https://www.mercadopago.com.br"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  mercadopago.com.br
                </a>
                .
              </li>
              <li>Aceda a Suas integrações (ou à área de credenciais / API, conforme o painel).</li>
              <li>
                Copie o <strong className="text-[#DCDCDC]">Access Token</strong> de produção quando for receber
                pagamentos reais.
              </li>
              <li>Cole no campo Access Token desta página e clique em Guardar.</li>
            </ol>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-[#B8B8B8]">
              <p className="font-medium text-[#E0E0E0]">Chave pública (Public Key)</p>
              <p className="mt-1">
                Aparece junto das credenciais no Mercado Pago. Neste projeto o PIX é gerado no servidor; só o Access
                Token é guardado aqui. Não é necessário colar a chave pública neste formulário.
              </p>
            </div>
            <div className="rounded-xl border border-sky-500/20 bg-sky-500/10 p-3 text-[#B8B8B8]">
              <p className="font-medium text-sky-100">Segredo do webhook</p>
              <p className="mt-1">
                O webhook é o aviso automático que o Mercado Pago envia ao site quando um pagamento é confirmado. Com
                o segredo correto, o sistema marca a reserva como paga de forma segura.
              </p>
              <p className="mt-2">
                No Mercado Pago, configure a URL de notificação que a sua equipa indicou (geralmente definida na
                hospedagem). Use o mesmo segredo que colar no campo &quot;Segredo do webhook&quot; aqui no painel, em
                harmonia com a documentação do Mercado Pago para webhooks.
              </p>
              <p className="mt-2 text-amber-200/90">
                ⚠️ Se o webhook estiver errado ou vazio, o cliente pode pagar o PIX mas o site demorar a reconhecer —
                por isso vale testar com um valor baixo após configurar.
              </p>
            </div>
          </section>

          <section className="mt-5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3">
            <p className="font-medium text-emerald-100">✅ Checklist final</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-[#B8B8B8]">
              <li>Modo Mercado Pago selecionado e credenciais guardadas.</li>
              <li>Teste com valor pequeno antes de divulgar a rifa.</li>
              <li>Em dúvida sobre URL do webhook, peça à pessoa que gere o servidor ou a hospedagem.</li>
            </ul>
          </section>
        </div>
      </div>
    </dialog>
  );
}
