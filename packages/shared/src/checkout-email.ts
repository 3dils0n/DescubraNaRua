/** E-mail técnico para o gateway Pix quando o comprador não informa e-mail. */
export function syntheticEmailForPix(telefone: string): string {
  const d = telefone.replace(/\D/g, "") || "0";
  return `cliente+${d}@sem-email.rifa`;
}

const SYNTHETIC_RE = /^cliente\+\d+@sem-email\.rifa$/i;

/** Indica se o e-mail guardado é o gerado automaticamente (não deve ser mostrado ao comprador como “e-mail de contacto”). */
export function isSyntheticCheckoutEmail(email: string | null | undefined): boolean {
  if (!email?.trim()) return false;
  return SYNTHETIC_RE.test(email.trim());
}
